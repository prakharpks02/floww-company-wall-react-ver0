import React, { useState } from 'react';
import PDFPreview from '../../Media/PDFPreview';
import DocumentViewer from '../../Media/DocumentViewer';

const MessageMediaAttachments = ({ fileUrls, isOwnMessage, isCompact = false }) => {
  const [fullscreenImage, setFullscreenImage] = useState(null);

  if (!fileUrls || fileUrls.length === 0) return null;

  // Support both string URLs and { url, name } objects
  const validFiles = fileUrls
    .map(f => {
      if (typeof f === 'string') return { url: f };
      if (f && typeof f.url === 'string') return f;
      return null;
    })
    .filter(f => f && f.url && f.url.trim() !== '');

  if (validFiles.length === 0) return null;

  const getFileType = (file) => {
    const url = file.url;
    if (!url || typeof url !== 'string') return 'document';
    const ext = url.split('.').pop().toLowerCase().split('?')[0];
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video';
    if (['pdf'].includes(ext)) return 'pdf';
    return 'document';
  };

  const images = validFiles.filter(file => getFileType(file) === 'image');
  const videos = validFiles.filter(file => getFileType(file) === 'video');
  const pdfs = validFiles.filter(file => getFileType(file) === 'pdf');
  const documents = validFiles.filter(file => getFileType(file) === 'document');

  return (
    <div style={{ padding: isCompact ? '6px' : '10px' }}>
      {/* Images */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '6px' : '10px' }}>
          {images.map((file, index) => (
            <div key={index} style={{ background: 'white', borderRadius: isCompact ? '6px' : '8px', overflow: 'hidden' }}>
              <img
                src={file.url}
                alt={`Attachment ${index + 1}`}
                onError={() => {
                  console.error('Failed to load image:', file.url);
                }}
                onClick={() => setFullscreenImage(file.url)}
                style={{
                  width: '100%',
                  maxWidth: isCompact ? '200px' : '300px',
                  height: 'auto',
                  display: 'block',
                  cursor: 'pointer'
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.map((file, index) => (
        <video
          key={`video-${index}`}
          src={file.url}
          controls
          style={{ 
            maxWidth: isCompact ? '200px' : '300px', 
            marginBottom: isCompact ? '6px' : '10px', 
            display: 'block', 
            borderRadius: isCompact ? '6px' : '8px' 
          }}
        />        
      ))}

      {/* PDFs - WhatsApp Style */}
      {pdfs.map((file, index) => {
        const fileName = file.name || (file.url.split('/').pop().split('?')[0]) || `Document ${index + 1}.pdf`;
        const maxWidth = isCompact ? '200px' : '280px';
        const previewHeight = isCompact ? '80px' : '120px';
        return (
          <div key={`pdf-${index}`} style={{ 
            marginBottom: isCompact ? '6px' : '8px',
            maxWidth: maxWidth,
            backgroundColor: '#f0f2f5',
            borderRadius: isCompact ? '6px' : '8px',
            overflow: 'hidden',
            border: '1px solid #e4e6ea'
          }}>
            {/* WhatsApp-style PDF Header */}
            <div 
              onClick={() => window.open(file.url, '_blank')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: isCompact ? '8px' : '12px',
                cursor: 'pointer',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e4e6ea',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.closest('div').style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.target.closest('div').style.backgroundColor = '#ffffff'}
            >
              <div style={{
                width: isCompact ? '32px' : '40px',
                height: isCompact ? '32px' : '40px',
                backgroundColor: '#dc3545',
                borderRadius: isCompact ? '6px' : '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: isCompact ? '8px' : '12px',
                flexShrink: 0
              }}>
                <svg width={isCompact ? '16' : '20'} height={isCompact ? '16' : '20'} viewBox="0 0 24 24" fill="white">
                  <path d="M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H8V4H20V16Z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isCompact ? '12px' : '14px',
                  fontWeight: '500',
                  color: '#1f2937',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {isCompact ? fileName.substring(0, 15) + (fileName.length > 15 ? '...' : '') : fileName}
                </div>
                <div style={{
                  fontSize: isCompact ? '10px' : '12px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>PDF</span>
                  <span>•</span>
                  <span>Document</span>
                </div>
              </div>
              <div style={{
                width: isCompact ? '24px' : '32px',
                height: isCompact ? '24px' : '32px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '8px'
              }}>
                <svg width={isCompact ? '12' : '16'} height={isCompact ? '12' : '16'} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </div>
            {/* PDF Preview Thumbnail */}
            <div style={{ 
              height: previewHeight, 
              backgroundColor: '#f8f9fa',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PDFPreview url={file.url} />
              </div>
              {/* Download overlay */}
              <div 
                onClick={() => window.open(file.url, '_blank')}
                style={{
                  position: 'absolute',
                  bottom: isCompact ? '4px' : '8px',
                  right: isCompact ? '4px' : '8px',
                  width: isCompact ? '24px' : '32px',
                  height: isCompact ? '24px' : '32px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  e.target.style.transform = 'scale(1)';
                }}
                title="Download PDF"
              >
                <svg width={isCompact ? '12' : '16'} height={isCompact ? '12' : '16'} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
            </div>
          </div>
        );
      })}

      {/* Other Documents */}
      {documents.map((url, index) => (
        <div key={`doc-${index}`} style={{ marginBottom: '10px', maxWidth: '300px' }}>
          <DocumentViewer
            file={{
              name: `Document ${index + 1}`,
              url: url,
              size: 0,
              type: 'document'
            }}
          />
        </div>
      ))}

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
        >
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default MessageMediaAttachments;
