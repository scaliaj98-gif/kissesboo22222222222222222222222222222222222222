"""
SnapRecord Pro - Backend API
Full-featured screen recording, screenshot management & AI-powered assistant
"""

from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File, Form, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, AsyncIterator
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
import motor.motor_asyncio
import httpx
import uuid
import os
import base64
import json
import asyncio

load_dotenv()

app = FastAPI(title="SnapRecord Pro API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class MediaItem(BaseModel):
    media_id: str
    user_id: str
    type: str  # 'screenshot' or 'recording'
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    file_data: Optional[str] = None  # Base64 encoded
    file_url: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[float] = None  # For recordings
    width: Optional[int] = None
    height: Optional[int] = None
    format: str = "png"
    size_bytes: Optional[int] = None
    is_public: bool = False
    share_link: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CreateMediaRequest(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    file_data: Optional[str] = None  # Base64 encoded
    format: str = "png"
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    thumbnail: Optional[str] = None
    is_public: bool = False
    folder_id: Optional[str] = None
    expiration_date: Optional[str] = None

class UpdateMediaRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    folder_id: Optional[str] = None
    expiration_date: Optional[str] = None

class CreateFolderRequest(BaseModel):
    name: str
    color: Optional[str] = "#6366F1"

class AIChatRequest(BaseModel):
    message: str
    session_id: str
    provider: str = "openai"  # "openai" or "gemini"
    model: Optional[str] = None
    context: Optional[dict] = None  # Current editor/screenshot context

class AITagRequest(BaseModel):
    image_data: str  # Base64 encoded image

class ShareRequest(BaseModel):
    platform: str  # 'jira', 'slack', 'trello', 'asana', 'github', 'link'

# ==================== AUTH HELPERS ====================

async def get_session_from_cookie(request: Request) -> Optional[str]:
    """Extract session token from cookie or header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    return session_token

async def get_current_user(request: Request) -> dict:
    """Validate session and return user"""
    session_token = await get_session_from_cookie(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_doc

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/session")
async def process_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    
    user_data = auth_response.json()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    session_token = user_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": user_data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Create new user
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "created_at": datetime.now(timezone.utc)
        })
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user, "session_token": session_token}

@app.get("/api/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    return user

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = await get_session_from_cookie(request)
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== MEDIA ENDPOINTS ====================

@app.get("/api/media")
async def get_media(
    request: Request,
    type: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = 0
):
    """Get user's media items"""
    user = await get_current_user(request)
    
    query = {"user_id": user["user_id"]}
    if type:
        query["type"] = type
    
    cursor = db.media.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    items = await cursor.to_list(length=limit)
    
    total = await db.media.count_documents(query)
    
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@app.post("/api/media")
async def create_media(request: Request, media: CreateMediaRequest):
    """Create a new media item (screenshot or recording)"""
    user = await get_current_user(request)
    
    media_id = f"media_{uuid.uuid4().hex[:12]}"
    share_link = f"share_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc)
    
    # Calculate file size
    size_bytes = len(base64.b64decode(media.file_data.split(",")[-1])) if media.file_data else 0
    
    media_doc = {
        "media_id": media_id,
        "user_id": user["user_id"],
        "type": media.type,
        "title": media.title,
        "description": media.description,
        "tags": media.tags,
        "file_data": media.file_data,
        "thumbnail": media.thumbnail,
        "duration": media.duration,
        "width": media.width,
        "height": media.height,
        "format": media.format,
        "size_bytes": size_bytes,
        "is_public": False,
        "share_link": share_link,
        "created_at": now,
        "updated_at": now
    }
    
    await db.media.insert_one(media_doc)
    
    # Return without _id
    media_doc.pop("_id", None)
    return media_doc

@app.get("/api/media/{media_id}")
async def get_media_item(media_id: str, request: Request):
    """Get a specific media item"""
    user = await get_current_user(request)
    
    media = await db.media.find_one(
        {"media_id": media_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    return media

@app.patch("/api/media/{media_id}")
async def update_media(media_id: str, request: Request, update: UpdateMediaRequest):
    """Update a media item"""
    user = await get_current_user(request)
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.media.update_one(
        {"media_id": media_id, "user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    
    media = await db.media.find_one({"media_id": media_id}, {"_id": 0})
    return media

@app.delete("/api/media/{media_id}")
async def delete_media(media_id: str, request: Request):
    """Delete a media item"""
    user = await get_current_user(request)
    
    result = await db.media.delete_one(
        {"media_id": media_id, "user_id": user["user_id"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    
    return {"message": "Media deleted successfully"}

# ==================== SHARING ENDPOINTS ====================

@app.get("/api/share/{share_link}")
async def get_shared_media(share_link: str):
    """Get a publicly shared media item"""
    media = await db.media.find_one(
        {"share_link": share_link, "is_public": True},
        {"_id": 0, "user_id": 0}
    )
    
    if not media:
        raise HTTPException(status_code=404, detail="Shared media not found")
    
    return media

@app.post("/api/media/{media_id}/share")
async def share_media(media_id: str, request: Request, share: ShareRequest):
    """Generate share link or prepare for platform sharing"""
    user = await get_current_user(request)
    
    media = await db.media.find_one(
        {"media_id": media_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Make media public if sharing
    if not media.get("is_public"):
        await db.media.update_one(
            {"media_id": media_id},
            {"$set": {"is_public": True}}
        )
    
    share_url = f"/share/{media['share_link']}"
    
    # Platform-specific share URLs
    platform_urls = {
        "slack": f"https://slack.com/share?text=Check%20out%20this%20{media['type']}&url={share_url}",
        "jira": share_url,
        "trello": f"https://trello.com/add-card?url={share_url}",
        "asana": share_url,
        "github": share_url,
        "link": share_url
    }
    
    return {
        "share_link": share_url,
        "platform_url": platform_urls.get(share.platform, share_url),
        "platform": share.platform
    }

# ==================== AI ENDPOINTS ====================

@app.post("/api/ai/generate-tags")
async def generate_tags(request: Request, data: AITagRequest):
    """Generate AI tags for an image"""
    user = await get_current_user(request)
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"tags_{uuid.uuid4().hex[:8]}",
            system_message="You are an image analysis assistant. Analyze images and provide relevant tags and descriptions. Respond with JSON only."
        ).with_model("openai", "gpt-4o")
        
        # For now, generate based on context (actual vision would need image URL)
        user_message = UserMessage(
            text="Generate 5-8 relevant tags for a screenshot or screen recording. Return JSON format: {\"tags\": [\"tag1\", \"tag2\"], \"description\": \"brief description\"}"
        )
        
        response = await chat.send_message(user_message)
        
        # Parse response
        import json
        try:
            result = json.loads(response)
        except:
            result = {
                "tags": ["screenshot", "capture", "screen", "desktop", "image"],
                "description": "Screen capture"
            }
        
        return result
    except Exception as e:
        # Fallback tags
        return {
            "tags": ["screenshot", "capture", "screen"],
            "description": "Screen capture",
            "error": str(e)
        }

@app.post("/api/ai/generate-title")
async def generate_title(request: Request):
    """Generate AI title for media"""
    user = await get_current_user(request)
    body = await request.json()
    
    if not EMERGENT_LLM_KEY:
        return {"title": f"Capture {datetime.now().strftime('%Y-%m-%d %H:%M')}"}
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"title_{uuid.uuid4().hex[:8]}",
            system_message="Generate short, descriptive titles for screenshots and recordings. Keep titles under 50 characters."
        ).with_model("openai", "gpt-4o")
        
        context = body.get("context", "screenshot")
        user_message = UserMessage(
            text=f"Generate a brief title for a {context}. Just return the title, nothing else."
        )
        
        response = await chat.send_message(user_message)
        return {"title": response.strip()[:50]}
    except:
        return {"title": f"Capture {datetime.now().strftime('%Y-%m-%d %H:%M')}"}

# ==================== STATS ENDPOINTS ====================

@app.get("/api/stats")
async def get_stats(request: Request):
    """Get user statistics"""
    user = await get_current_user(request)
    
    total_screenshots = await db.media.count_documents({
        "user_id": user["user_id"],
        "type": "screenshot"
    })
    
    total_recordings = await db.media.count_documents({
        "user_id": user["user_id"],
        "type": "recording"
    })
    
    # Calculate total storage
    pipeline = [
        {"$match": {"user_id": user["user_id"]}},
        {"$group": {"_id": None, "total_size": {"$sum": "$size_bytes"}}}
    ]
    result = await db.media.aggregate(pipeline).to_list(1)
    total_storage = result[0]["total_size"] if result else 0
    
    return {
        "total_screenshots": total_screenshots,
        "total_recordings": total_recordings,
        "total_storage_bytes": total_storage,
        "total_storage_mb": round(total_storage / (1024 * 1024), 2)
    }

# ==================== FOLDERS ====================

@app.get("/api/folders")
async def get_folders(request: Request):
    """Get all folders for current user"""
    try:
        user = await get_current_user(request)
    except HTTPException:
        return {"folders": []}
    
    folders = await db.folders.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Add item count
    for folder in folders:
        count = await db.media_items.count_documents({"user_id": user["user_id"], "folder_id": folder["folder_id"]})
        folder["item_count"] = count
    
    return {"folders": folders}

@app.post("/api/folders")
async def create_folder(request: Request, folder_req: CreateFolderRequest):
    """Create a new folder"""
    user = await get_current_user(request)
    folder_id = f"folder_{uuid.uuid4().hex[:12]}"
    
    folder = {
        "folder_id": folder_id,
        "user_id": user["user_id"],
        "name": folder_req.name,
        "color": folder_req.color or "#6366F1",
        "item_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.folders.insert_one(folder.copy())
    return folder

@app.delete("/api/folders/{folder_id}")
async def delete_folder(folder_id: str, request: Request):
    """Delete a folder (not its contents)"""
    user = await get_current_user(request)
    result = await db.folders.delete_one({"folder_id": folder_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Folder not found")
    # Remove folder reference from media items
    await db.media_items.update_many(
        {"user_id": user["user_id"], "folder_id": folder_id},
        {"$unset": {"folder_id": ""}}
    )
    return {"success": True}

# ==================== AI ENDPOINTS ====================

SNAPRECORD_SYSTEM_PROMPT = """You are an expert AI assistant for SnapRecord Pro, a professional Chrome extension for screen recording, screenshot capture, and video editing. You help users with:

1. **Recording** - Screen recording, webcam recording, picture-in-picture, audio narration
2. **Screenshots** - Capture visible tab, region selection, full page capture, annotation
3. **Video Editing** - Trim clips, remove silences, add text overlays, transitions
4. **Sharing** - Secure links, privacy settings, expiration dates, password protection
5. **Organization** - Folders, tags, search, library management

Be friendly, concise, and practical. Use markdown formatting with **bold** and bullet points. 
Use emojis appropriately to make responses engaging.
When given context about what the user is currently doing (e.g., editing a video, annotating a screenshot), tailor your advice specifically to that situation."""

def get_context_prompt(context: Optional[dict]) -> str:
    """Build context-aware system prompt addition"""
    if not context:
        return ""
    
    parts = []
    page = context.get("page")
    
    if page == "editor":
        duration = context.get("duration", "unknown")
        trim_in = context.get("trimIn", 0)
        trim_out = context.get("trimOut", 100)
        text_layers = context.get("textLayerCount", 0)
        silences = context.get("detectedSilences", 0)
        parts.append(f"\n\n**Current Context: Video Editor**")
        parts.append(f"- Video duration: {duration}")
        parts.append(f"- Trim region: {trim_in}% to {trim_out}%")
        parts.append(f"- Text layers added: {text_layers}")
        parts.append(f"- Detected silences: {silences}")
        parts.append("\nProvide specific editing advice for this video.")
        
    elif page == "screenshot":
        width = context.get("width", "unknown")
        height = context.get("height", "unknown")
        tool = context.get("currentTool", "unknown")
        annotations = context.get("annotationCount", 0)
        parts.append(f"\n\n**Current Context: Screenshot Editor**")
        parts.append(f"- Image dimensions: {width} × {height}px")
        parts.append(f"- Active tool: {tool}")
        parts.append(f"- Annotations added: {annotations}")
        parts.append("\nProvide specific annotation advice for this screenshot.")
        
    elif page == "recording":
        source = context.get("source", "unknown")
        duration_secs = context.get("durationSeconds", 0)
        parts.append(f"\n\n**Current Context: Recording in Progress**")
        parts.append(f"- Recording source: {source}")
        parts.append(f"- Duration so far: {duration_secs}s")
        parts.append("\nProvide recording tips and guidance.")
    
    return "\n".join(parts)

# In-memory session store (chat sessions per user)
ai_chat_sessions: dict = {}

@app.post("/api/ai/chat")
async def ai_chat(request: Request, chat_req: AIChatRequest):
    """
    AI Assistant chat endpoint.
    Routes to OpenAI (gpt-4o-mini/gpt-4o) or Google Gemini via Emergent LLM key.
    Maintains conversation history per session.
    """
    # Optionally require auth (allow unauthenticated for extension use)
    llm_key = EMERGENT_LLM_KEY
    if not llm_key:
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    # Build context-aware system prompt
    context_info = get_context_prompt(chat_req.context)
    full_system_prompt = SNAPRECORD_SYSTEM_PROMPT + context_info
    
    # Select model
    provider = chat_req.provider.lower()
    if provider == "gemini":
        model = chat_req.model or "gemini-2.0-flash"
    else:
        # Default to OpenAI
        model = chat_req.model or "gpt-4o-mini"
    
    # Get or create chat session (keeps conversation history)
    session_id = chat_req.session_id
    if session_id not in ai_chat_sessions:
        ai_chat_sessions[session_id] = LlmChat(
            api_key=llm_key,
            session_id=session_id,
            system_message=full_system_prompt
        )
    
    chat_session = ai_chat_sessions[session_id]
    
    # Update system message if context changed
    if chat_req.context:
        chat_session.system_message = full_system_prompt
    
    try:
        response = await chat_session.send_message(
            UserMessage(content=chat_req.message),
            model=model
        )
        
        # Save conversation to DB (for analytics/history)
        try:
            user = await get_current_user(request)
            user_id = user["user_id"]
        except:
            user_id = "anonymous"
        
        await db.ai_conversations.insert_one({
            "conversation_id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_id": user_id,
            "provider": provider,
            "model": model,
            "user_message": chat_req.message,
            "ai_response": response,
            "context": chat_req.context,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "response": response,
            "session_id": session_id,
            "model": model,
            "provider": provider
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

@app.delete("/api/ai/session/{session_id}")
async def clear_ai_session(session_id: str):
    """Clear a chat session (new chat)"""
    if session_id in ai_chat_sessions:
        del ai_chat_sessions[session_id]
    return {"success": True, "cleared": session_id}

@app.get("/api/ai/history/{session_id}")
async def get_chat_history(session_id: str, request: Request):
    """Get chat history for a session"""
    try:
        user = await get_current_user(request)
    except:
        return {"messages": []}
    
    messages = await db.ai_conversations.find(
        {"session_id": session_id, "user_id": user["user_id"]},
        {"_id": 0, "user_message": 1, "ai_response": 1, "timestamp": 1, "model": 1}
    ).sort("timestamp", 1).to_list(50)
    
    return {"messages": messages}

@app.post("/api/ai/tag")
async def ai_auto_tag(request: Request, tag_req: AITagRequest):
    """
    Auto-generate title, description and tags for a screenshot using AI vision.
    Uses GPT-4o for image understanding.
    """
    user = await get_current_user(request)
    
    llm_key = EMERGENT_LLM_KEY
    if not llm_key:
        return {"tags": [], "title": None, "description": None}
    
    session_id = f"tag_{uuid.uuid4().hex[:8]}"
    
    try:
        chat = LlmChat(
            api_key=llm_key,
            session_id=session_id,
            system_message="You are an expert at analyzing screenshots and generating concise, searchable tags and titles. Always respond with valid JSON only."
        )
        
        # Build message with image
        message_content = [
            {
                "type": "text",
                "text": """Analyze this screenshot and return JSON with:
- title: A short, descriptive title (max 6 words)
- description: One sentence describing what's shown
- tags: Array of 3-6 relevant tags (lowercase, no spaces, use hyphens)

Examples of good tags: web-design, dashboard, error-message, code-review, presentation, data-visualization

Respond ONLY with valid JSON like: {"title": "...", "description": "...", "tags": [...]}"""
            },
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{tag_req.image_data}"}
            }
        ]
        
        response = await chat.send_message(
            UserMessage(content=message_content),
            model="gpt-4o-mini"
        )
        
        # Parse JSON response
        try:
            # Clean response if it has markdown code blocks
            clean = response.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            result = json.loads(clean.strip())
            return {
                "title": result.get("title", "Screenshot"),
                "description": result.get("description", ""),
                "tags": result.get("tags", [])
            }
        except json.JSONDecodeError:
            return {"tags": [], "title": "Screenshot", "description": response[:100]}
            
    except Exception as e:
        return {"tags": [], "title": "Screenshot", "description": "", "error": str(e)}

@app.post("/api/ai/tag-video")
async def ai_tag_video(request: Request, body: dict):
    """Auto-generate title, description and tags for a video recording using AI"""
    user = await get_current_user(request)
    
    llm_key = EMERGENT_LLM_KEY
    if not llm_key:
        return {"tags": [], "title": None}
    
    duration = body.get("duration", 0)
    source = body.get("source", "screen")
    thumbnail_b64 = body.get("thumbnail", None)
    
    session_id = f"vtag_{uuid.uuid4().hex[:8]}"
    
    try:
        chat = LlmChat(
            api_key=llm_key,
            session_id=session_id,
            system_message="You generate concise metadata for screen recordings. Respond with valid JSON only."
        )
        
        mins = int(duration // 60)
        secs = int(duration % 60)
        duration_str = f"{mins}:{secs:02d}"
        
        prompt = f"""Generate metadata for a screen recording:
- Duration: {duration_str}
- Source: {source} recording

Return JSON: {{"title": "short title max 6 words", "description": "one sentence", "tags": ["tag1", "tag2", "tag3"]}}
Tags should describe the recording type and content. Respond ONLY with valid JSON."""

        if thumbnail_b64:
            content = [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{thumbnail_b64}"}}
            ]
        else:
            content = prompt
        
        response = await chat.send_message(UserMessage(content=content), model="gpt-4o-mini")
        
        try:
            clean = response.strip().replace("```json", "").replace("```", "")
            result = json.loads(clean)
            return {
                "title": result.get("title", f"Recording {duration_str}"),
                "description": result.get("description", ""),
                "tags": result.get("tags", [])
            }
        except:
            return {"title": f"Recording {duration_str}", "description": "", "tags": ["screen-recording"]}
            
    except Exception as e:
        return {"title": None, "tags": [], "error": str(e)}

# ==================== HEALTH CHECK ====================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "SnapRecord API v2"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
