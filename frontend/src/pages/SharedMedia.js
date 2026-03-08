import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Monitor, Download, ExternalLink, Image, Film, Clock, AlertCircle } from 'lucide-react';

export default function SharedMedia() {
  const { shareLink } = useParams();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSharedMedia = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/share/${shareLink}`);
        
        if (!response.ok) {
          throw new Error('Media not found or not public');
        }
        
        const data = await response.json();
        setMedia(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedMedia();
  }, [shareLink]);
  
  const handleDownload = () => {
    if (media?.file_data) {
      const a = document.createElement('a');
      a.href = media.file_data;
      a.download = `${media.title}.${media.format}`;
      a.click();
    }
  };
  
  if (loading) {
    return (
      <div className="shared-page loading">
        <div className="loading-spinner"></div>
        <p>Loading shared content...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="shared-page error">
        <div className="error-content">
          <AlertCircle size={48} />
          <h2>Content Not Found</h2>
          <p>This content may have been deleted or is no longer public.</p>
          <Link to="/" className="home-link">Go to Home</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="shared-page">
      <header className="shared-header">
        <Link to="/" className="shared-logo">
          <Monitor size={24} />
          <span>Screen Master</span>
        </Link>
      </header>
      
      <main className="shared-content">
        <div className="shared-media-container">
          {media.type === 'screenshot' && media.file_data ? (
            <img src={media.file_data} alt={media.title} className="shared-image" />
          ) : media.type === 'recording' && media.file_data ? (
            <video src={media.file_data} controls className="shared-video" />
          ) : (
            <div className="no-preview">
              {media.type === 'screenshot' ? <Image size={64} /> : <Film size={64} />}
              <p>Preview not available</p>
            </div>
          )}
        </div>
        
        <div className="shared-info">
          <h1>{media.title}</h1>
          {media.description && <p className="description">{media.description}</p>}
          
          <div className="shared-meta">
            <span>
              {media.type === 'screenshot' ? <Image size={16} /> : <Film size={16} />}
              {media.type}
            </span>
            <span>
              <Clock size={16} />
              {new Date(media.created_at).toLocaleDateString()}
            </span>
            {media.format && <span className="format">.{media.format}</span>}
          </div>
          
          {media.tags?.length > 0 && (
            <div className="shared-tags">
              {media.tags.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          )}
          
          <div className="shared-actions">
            <button onClick={handleDownload} className="download-btn" data-testid="download-shared">
              <Download size={20} />
              Download
            </button>
          </div>
        </div>
      </main>
      
      <footer className="shared-footer">
        <p>Shared via <Link to="/">Screen Master</Link></p>
      </footer>
    </div>
  );
}
