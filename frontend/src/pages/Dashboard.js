import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Monitor, Camera, Video, LogOut, Search, Grid, List, Trash2, 
  Download, Share2, ExternalLink, MoreVertical, Image, Film,
  HardDrive, Clock, Tag, Edit2, Copy, Check, FolderPlus, Folder,
  Lock, Globe, Eye, Settings, Plus, Filter, ChevronDown, X,
  Star, Archive, Bookmark, Upload, Scissors, MessageCircle,
  BarChart2, Bell, User, Bot
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState([]);
  const [stats, setStats] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showEditModal, setShowEditModal] = useState(null);
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('library');

  const fetchMedia = useCallback(async () => {
    try {
      const typeParam = filter !== 'all' ? `?type=${filter}` : '';
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/media${typeParam}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMedia(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/folders`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      // Folders API might not exist yet, ignore
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMedia(), fetchStats(), fetchFolders()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMedia, fetchStats, fetchFolders]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDelete = async (mediaId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/media/${mediaId}`, {
        method: 'DELETE', credentials: 'include'
      });
      if (response.ok) {
        setMedia(media.filter(m => m.media_id !== mediaId));
        toast.success('Deleted!');
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleShare = async (item) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/media/${item.media_id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform: 'link' })
      });
      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}${data.share_link}`;
        await navigator.clipboard.writeText(fullUrl);
        setCopiedLink(item.media_id);
        setTimeout(() => setCopiedLink(null), 2000);
        toast.success('Share link copied! 🎉');
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const handleDownload = (item) => {
    if (item.file_data) {
      const a = document.createElement('a');
      a.href = item.file_data;
      a.download = `${item.title}.${item.format}`;
      a.click();
      toast.success('Download started!');
    }
  };

  const handleTogglePrivacy = async (item) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/media/${item.media_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_public: !item.is_public })
      });
      if (response.ok) {
        setMedia(media.map(m => m.media_id === item.media_id ? {...m, is_public: !m.is_public} : m));
        toast.success(item.is_public ? 'Set to private' : 'Set to public');
      }
    } catch (error) {
      toast.error('Failed to update privacy');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newFolderName })
      });
      if (response.ok) {
        const data = await response.json();
        setFolders([...folders, data]);
        setNewFolderName('');
        setShowNewFolder(false);
        toast.success('Folder created!');
      }
    } catch (error) {
      // Still close modal even if API fails
      setFolders([...folders, { folder_id: `local_${Date.now()}`, name: newFolderName, item_count: 0 }]);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrivacy = privacyFilter === 'all' || 
      (privacyFilter === 'public' && item.is_public) || 
      (privacyFilter === 'private' && !item.is_public);
    return matchesSearch && matchesPrivacy;
  });

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalCount = (stats?.total_screenshots || 0) + (stats?.total_recordings || 0);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFF', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .media-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.12) !important; }
        .media-card { transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .nav-btn:hover { background:rgba(255,107,107,0.08) !important; color:#FF6B6B !important; }
        .nav-btn.active { background:linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,142,83,0.1)) !important; color:#FF6B6B !important; }
        .action-btn:hover { background:#F1F5F9 !important; }
        .action-btn { transition:all 0.15s !important; }
        .folder-btn:hover { background:rgba(99,102,241,0.08) !important; border-color:rgba(99,102,241,0.3) !important; }
        .folder-btn { transition:all 0.2s !important; }
        .folder-btn.active { background:rgba(99,102,241,0.12) !important; border-color:rgba(99,102,241,0.4) !important; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:10px; }
        ::-webkit-scrollbar-thumb:hover { background:#94A3B8; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? 260 : 72, minWidth: sidebarOpen ? 260 : 72,
        background: 'white', borderRight: '1px solid #E8ECEF',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden', zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 36, height: 36, background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0
            }}>🎬</div>
            {sidebarOpen && <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>SnapRecord</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            width: 28, height: 28, border: 'none', background: '#F1F5F9',
            borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748B', flexShrink: 0, fontSize: 16
          }}>{sidebarOpen ? '◀' : '▶'}</button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {[
            { id: 'all', icon: Grid, label: 'All Media', count: totalCount },
            { id: 'screenshot', icon: Camera, label: 'Screenshots', count: stats?.total_screenshots || 0 },
            { id: 'recording', icon: Film, label: 'Recordings', count: stats?.total_recordings || 0 },
          ].map(({ id, icon: Icon, label, count }) => (
            <button key={id} className={`nav-btn ${filter === id ? 'active' : ''}`}
              onClick={() => setFilter(id)}
              style={{
                width: '100%', padding: sidebarOpen ? '10px 12px' : '10px 0',
                border: 'none', background: 'transparent',
                borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 10,
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                marginBottom: 4, color: '#64748B'
              }}>
              <Icon size={18} />
              {sidebarOpen && (
                <>
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1, textAlign: 'left' }}>{label}</span>
                  <span style={{
                    background: '#F1F5F9', color: '#64748B',
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100
                  }}>{count}</span>
                </>
              )}
            </button>
          ))}

          {sidebarOpen && (
            <>
              <div style={{ height: 1, background: '#F1F5F9', margin: '12px 4px' }} />
              
              {/* Folders */}
              <div style={{ padding: '4px 4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Folders</span>
                <button onClick={() => setShowNewFolder(true)} style={{
                  width: 22, height: 22, border: 'none', background: '#F1F5F9',
                  borderRadius: 6, cursor: 'pointer', color: '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Plus size={14} />
                </button>
              </div>

              {showNewFolder && (
                <div style={{ padding: '8px 4px', display: 'flex', gap: 6 }}>
                  <input
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                    placeholder="Folder name..."
                    autoFocus
                    style={{
                      flex: 1, padding: '6px 10px', borderRadius: 8,
                      border: '2px solid #FF6B6B', fontSize: 13,
                      fontFamily: 'inherit', outline: 'none'
                    }}
                  />
                  <button onClick={handleCreateFolder} style={{
                    background: '#FF6B6B', color: 'white', border: 'none',
                    borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700
                  }}>+</button>
                  <button onClick={() => setShowNewFolder(false)} style={{
                    background: '#F1F5F9', border: 'none', borderRadius: 8,
                    padding: '6px 8px', cursor: 'pointer', color: '#64748B'
                  }}>✕</button>
                </div>
              )}

              {folders.length === 0 ? (
                <div style={{ padding: '8px 12px', color: '#94A3B8', fontSize: 13 }}>No folders yet</div>
              ) : (
                folders.map(folder => (
                  <button key={folder.folder_id}
                    className={`folder-btn ${activeFolder === folder.folder_id ? 'active' : ''}`}
                    onClick={() => setActiveFolder(activeFolder === folder.folder_id ? null : folder.folder_id)}
                    style={{
                      width: '100%', padding: '8px 12px', border: '1px solid transparent',
                      background: 'transparent', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: 4, color: '#374151', fontSize: 14
                    }}>
                    <Folder size={16} color="#6366F1" />
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{folder.name}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{folder.item_count || 0}</span>
                  </button>
                ))
              )}

              <div style={{ height: 1, background: '#F1F5F9', margin: '12px 4px' }} />
              
              {/* Starred / Archived */}
              {[{ icon: Star, label: 'Starred', color: '#FBBF24' }, { icon: Archive, label: 'Archived', color: '#94A3B8' }].map(({ icon: Icon, label, color }) => (
                <button key={label} className="nav-btn" style={{
                  width: '100%', padding: '10px 12px', border: 'none', background: 'transparent',
                  borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, color: '#64748B'
                }}>
                  <Icon size={18} color={color} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Storage Bar */}
        {sidebarOpen && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Storage</span>
              <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 700 }}>{stats?.total_storage_mb || 0} MB</span>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                width: `${Math.min((stats?.total_storage_mb || 0) / 100 * 100, 100)}%`
              }} />
            </div>
          </div>
        )}

        {/* User */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=FF6B6B&color=fff`}
            alt="" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, objectFit: 'cover' }}
          />
          {sidebarOpen && (
            <>
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
              <button onClick={handleLogout} title="Logout" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94A3B8', padding: 4, borderRadius: 6
              }}>
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        
        {/* Top Bar */}
        <header style={{
          height: 64, background: 'white', borderBottom: '1px solid #E8ECEF',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0
        }}>
          {/* Search */}
          <div style={{
            flex: 1, maxWidth: 500, display: 'flex', alignItems: 'center', gap: 10,
            background: '#F8FAFF', border: '1px solid #E8ECEF', borderRadius: 12,
            padding: '10px 16px'
          }}>
            <Search size={16} color="#94A3B8" />
            <input
              type="text" placeholder="Search recordings & screenshots..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 14, color: '#374151', width: '100%', fontFamily: 'inherit'
              }}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>}
          </div>

          {/* Privacy Filter */}
          <select
            value={privacyFilter}
            onChange={e => setPrivacyFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 10, border: '1px solid #E8ECEF',
              fontSize: 14, fontFamily: 'inherit', color: '#374151', background: 'white', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="all">🔍 All items</option>
            <option value="public">🌎 Public</option>
            <option value="private">🔒 Private</option>
          </select>

          {/* View Toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
            {[{ mode: 'grid', Icon: Grid }, { mode: 'list', Icon: List }].map(({ mode, Icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '6px 10px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: viewMode === mode ? 'white' : 'transparent',
                color: viewMode === mode ? '#FF6B6B' : '#94A3B8',
                boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}>
                <Icon size={16} />
              </button>
            ))}
          </div>

          {/* User avatar */}
          <img
            src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=FF6B6B&color=fff`}
            alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', cursor: 'pointer' }}
          />
        </header>

        {/* Stats Banner */}
        <div style={{
          background: 'white', borderBottom: '1px solid #E8ECEF',
          padding: '16px 24px', display: 'flex', gap: 24, flexShrink: 0
        }}>
          {[
            { icon: '🎬', label: 'Total Recordings', value: stats?.total_recordings || 0, color: '#FF6B6B' },
            { icon: '📸', label: 'Screenshots', value: stats?.total_screenshots || 0, color: '#4ECDC4' },
            { icon: '💾', label: 'Storage Used', value: `${stats?.total_storage_mb || 0} MB`, color: '#6366F1' },
            { icon: '📁', label: 'Folders', value: folders.length, color: '#FBBF24' },
          ].map((stat, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#F8FAFF', padding: '10px 16px', borderRadius: 12,
              border: `1px solid ${stat.color}20`
            }}>
              <span style={{ fontSize: 22 }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
              <div style={{ fontSize: 48, animation: 'spin 1s linear infinite' }}>🎬</div>
              <p style={{ color: '#64748B', fontSize: 16, fontWeight: 500 }}>Loading your media...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: 400, gap: 16, textAlign: 'center'
            }}>
              <div style={{ fontSize: 80 }}>{filter === 'screenshot' ? '📸' : filter === 'recording' ? '🎬' : '📦'}</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {searchQuery ? 'No results found' : `No ${filter === 'all' ? 'captures' : filter + 's'} yet`}
              </h3>
              <p style={{ color: '#64748B', fontSize: 16, maxWidth: 400 }}>
                {searchQuery ? `Try a different search term` : 'Install the SnapRecord Chrome extension to start capturing'}
              </p>
              {!searchQuery && (
                <button onClick={() => navigate('/')} style={{
                  background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                  color: 'white', border: 'none', padding: '14px 28px',
                  borderRadius: 100, fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <Download size={18} /> Get Extension
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: viewMode === 'grid' ? 'grid' : 'flex',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : undefined,
              flexDirection: viewMode === 'list' ? 'column' : undefined,
              gap: 16, animation: 'fadeIn 0.3s ease'
            }}>
              {filteredMedia.map(item => (
                <MediaCard
                  key={item.media_id} item={item} viewMode={viewMode}
                  onDelete={handleDelete} onShare={handleShare} onDownload={handleDownload}
                  onTogglePrivacy={handleTogglePrivacy} onClick={() => setSelectedMedia(item)}
                  copiedLink={copiedLink} formatBytes={formatBytes}
                  formatDate={formatDate} formatDuration={formatDuration}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Media Preview Modal */}
      {selectedMedia && (
        <MediaModal
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={handleDelete}
          onTogglePrivacy={handleTogglePrivacy}
          formatDate={formatDate}
          formatBytes={formatBytes}
          formatDuration={formatDuration}
        />
      )}
    </div>
  );
}

function MediaCard({ item, viewMode, onDelete, onShare, onDownload, onTogglePrivacy, onClick, copiedLink, formatBytes, formatDate, formatDuration }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (viewMode === 'list') {
    return (
      <div className="media-card" style={{
        background: 'white', borderRadius: 14, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9',
        cursor: 'pointer'
      }}>
        <div onClick={onClick} style={{
          width: 56, height: 40, borderRadius: 8, overflow: 'hidden',
          background: item.type === 'screenshot' ? '#F0F4FF' : '#FFF0F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {item.file_data && item.type === 'screenshot' ? (
            <img src={item.file_data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 20 }}>{item.type === 'screenshot' ? '📸' : '🎬'}</span>
          )}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }} onClick={onClick}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', display: 'flex', gap: 12, marginTop: 2 }}>
            <span>{formatDate(item.created_at)}</span>
            {item.size_bytes && <span>{formatBytes(item.size_bytes)}</span>}
            {item.duration && <span>⏱ {formatDuration(item.duration)}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100,
            background: item.is_public ? '#DCFCE7' : '#F1F5F9',
            color: item.is_public ? '#16A34A' : '#64748B'
          }}>{item.is_public ? '🌎 Public' : '🔒 Private'}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onDownload(item)} className="action-btn" style={{
            width: 32, height: 32, border: 'none', background: 'transparent',
            borderRadius: 8, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><Download size={14} /></button>
          <button onClick={() => onShare(item)} className="action-btn" style={{
            width: 32, height: 32, border: 'none', background: 'transparent',
            borderRadius: 8, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{copiedLink === item.media_id ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}</button>
          <button onClick={() => onDelete(item.media_id)} className="action-btn" style={{
            width: 32, height: 32, border: 'none', background: 'transparent',
            borderRadius: 8, cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><Trash2 size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="media-card" style={{
      background: 'white', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9'
    }}>
      {/* Preview */}
      <div onClick={onClick} style={{
        height: 160, background: item.type === 'screenshot' ? 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' : 'linear-gradient(135deg, #0F172A, #1E293B)',
        position: 'relative', cursor: 'pointer', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {item.file_data && item.type === 'screenshot' ? (
          <img src={item.file_data} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 48 }}>{item.type === 'screenshot' ? '📸' : '🎬'}</span>
        )}
        
        {/* Type badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: item.type === 'screenshot' ? 'rgba(78,205,196,0.9)' : 'rgba(255,107,107,0.9)',
          color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
          backdropFilter: 'blur(4px)'
        }}>
          {item.type === 'screenshot' ? '📸 Screenshot' : '🎬 Recording'}
        </div>

        {/* Privacy badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: item.is_public ? 'rgba(34,197,94,0.9)' : 'rgba(0,0,0,0.5)',
          color: 'white', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100
        }}>
          {item.is_public ? '🌎' : '🔒'}
        </div>

        {item.type === 'recording' && item.duration && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.6)', color: 'white',
            fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 100
          }}>
            ⏱ {formatDuration(item.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{formatDate(item.created_at)}</span>
          {item.size_bytes && <span style={{ fontSize: 12, color: '#94A3B8' }}>{formatBytes(item.size_bytes)}</span>}
        </div>
        {item.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 100,
                background: '#F0F4FF', color: '#6366F1', fontWeight: 600
              }}># {tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid #F8FAFF',
        display: 'flex', gap: 4, justifyContent: 'flex-end'
      }}>
        <button onClick={() => onDownload(item)} title="Download" className="action-btn" style={{
          width: 32, height: 32, border: 'none', background: 'transparent',
          borderRadius: 8, cursor: 'pointer', color: '#64748B',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}><Download size={15} /></button>
        <button onClick={() => onShare(item)} title="Copy share link" className="action-btn" style={{
          width: 32, height: 32, border: 'none', background: 'transparent',
          borderRadius: 8, cursor: 'pointer', color: '#64748B',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{copiedLink === item.media_id ? <Check size={15} color="#16A34A" /> : <Copy size={15} />}</button>
        <button onClick={() => onTogglePrivacy(item)} title="Toggle privacy" className="action-btn" style={{
          width: 32, height: 32, border: 'none', background: 'transparent',
          borderRadius: 8, cursor: 'pointer', color: '#64748B',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{item.is_public ? <Lock size={15} /> : <Globe size={15} />}</button>
        <button onClick={() => onDelete(item.media_id)} title="Delete" className="action-btn" style={{
          width: 32, height: 32, border: 'none', background: 'transparent',
          borderRadius: 8, cursor: 'pointer', color: '#EF4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

function MediaModal({ item, onClose, onDownload, onShare, onDelete, onTogglePrivacy, formatDate, formatBytes, formatDuration }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(8px)'
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 24, overflow: 'hidden',
        maxWidth: 900, width: '100%', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.2s ease'
      }}>
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{item.type === 'screenshot' ? '📸' : '🎬'}</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>{formatDate(item.created_at)}{item.size_bytes ? ` • ${formatBytes(item.size_bytes)}` : ''}{item.duration ? ` • ⏱ ${formatDuration(item.duration)}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, border: 'none', background: '#F1F5F9',
            borderRadius: 10, cursor: 'pointer', fontSize: 18, color: '#64748B'
          }}>×</button>
        </div>

        {/* Media */}
        <div style={{ flex: 1, overflow: 'auto', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          {item.type === 'screenshot' && item.file_data ? (
            <img src={item.file_data} alt={item.title} style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }} />
          ) : item.type === 'recording' && item.file_data ? (
            <video src={item.file_data} controls autoPlay style={{ maxWidth: '100%', maxHeight: 500 }} />
          ) : (
            <div style={{ color: '#64748B', textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>{item.type === 'screenshot' ? '📸' : '🎬'}</div>
              <p>Preview not available</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={() => onTogglePrivacy(item)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', border: '2px solid #E2E8F0',
            borderRadius: 12, background: 'white', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, fontFamily: 'inherit', color: '#374151'
          }}>
            {item.is_public ? <><Lock size={16} /> Make Private</> : <><Globe size={16} /> Make Public</>}
          </button>
          <button onClick={() => onShare(item)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', border: 'none',
            borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', color: 'white'
          }}>
            <Copy size={16} /> Copy Share Link
          </button>
          <button onClick={() => onDownload(item)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', border: 'none',
            borderRadius: 12, background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', color: 'white'
          }}>
            <Download size={16} /> Download
          </button>
          <button onClick={() => { onDelete(item.media_id); onClose(); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', border: '2px solid #FEE2E2',
            borderRadius: 12, background: 'white', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, fontFamily: 'inherit', color: '#EF4444'
          }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
