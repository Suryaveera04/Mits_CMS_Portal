// src/components/common/ImageUploader.jsx
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, ArrowUp, ArrowDown, Image, AlertTriangle } from 'lucide-react';
import styles from './ImageUploader.module.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/backend';

export default function ImageUploader({
  images = [], onChange, multiple = true, circular = false,
  facultyId = null, userRole = 'FACULTY'
}) {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState('');
  const [coverIndex, setCoverIndex] = useState(0);
  const inputRef = useRef();

  // ── Upload file to server, get back a URL ──────────────────────────────────
  const uploadToServer = async (file) => {
    // If no facultyId provided, fall back to local base64 (e.g. content images)
    if (!facultyId) {
      return await readAsDataURL(file);
    }

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('faculty_id', facultyId);
    formData.append('user_role', userRole);

    const response = await fetch(`${API_URL}/upload_avatar.php`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    // Add cache-bust so browser shows the new image immediately
    return result.avatarUrl + '&t=' + Date.now();
  };

  const readAsDataURL = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

  // ── Validate then upload ───────────────────────────────────────────────────
  const validateAndUpload = useCallback(async (files) => {
    setError('');
    const validFiles = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError(`Invalid type: ${f.name}. Only JPG, PNG, WEBP allowed.`);
        return;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Too large: ${f.name}. Max ${MAX_SIZE_MB}MB.`);
        return;
      }
      validFiles.push(f);
    }
    if (!validFiles.length) return;

    setUploading(true);
    setProgress(10);

    try {
      const results = [];
      for (let i = 0; i < validFiles.length; i++) {
        const url = await uploadToServer(validFiles[i]);
        results.push({ id: 'img' + Date.now() + i, url, name: validFiles[i].name });
        setProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }
      onChange(multiple ? [...images, ...results] : results);
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [images, multiple, facultyId, userRole]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    validateAndUpload(e.dataTransfer.files);
  }, [validateAndUpload]);

  const removeImage = (id) => {
    const newImgs = images.filter(img => img.id !== id);
    onChange(newImgs);
    if (coverIndex >= newImgs.length) setCoverIndex(0);
  };

  const moveImage = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    const arr = [...images];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    onChange(arr);
    if (coverIndex === fromIdx) setCoverIndex(toIdx);
  };

  // ── Circular (avatar) mode ─────────────────────────────────────────────────
  if (circular) {
    const img = images[0];
    return (
      <div className={styles.circularWrapper}>
        <div className={styles.circularPreview} onClick={() => inputRef.current.click()}>
          {img ? (
            <>
              <img src={img.url} alt="" className={styles.circularImg} />
              <div className={styles.circularOverlay}>
                {uploading
                  ? <span className={styles.circularUploadingText}>{progress}%</span>
                  : <><Upload size={24} /><span>Change Photo</span></>
                }
              </div>
            </>
          ) : (
            <div className={styles.circularPlaceholder}>
              {uploading
                ? <span className={styles.circularUploadingText}>{progress}%</span>
                : <><Upload size={28} /><span>Upload Photo</span></>
              }
            </div>
          )}
        </div>
        <input
          ref={inputRef} type="file" accept="image/*" hidden
          onChange={e => validateAndUpload(e.target.files)}
        />
        {error && (
          <div className={styles.uploadError} style={{ position: 'absolute', bottom: -28, left: 0, right: 0, justifyContent: 'center' }}>
            <AlertTriangle size={12} />{error}
          </div>
        )}
      </div>
    );
  }

  // ── Multi-image (content) mode ─────────────────────────────────────────────
  return (
    <div className={styles.uploaderRoot}>
      {(multiple || images.length === 0) && (
        <div
          className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
        >
          <div className={styles.dropIcon}><Image size={32} /></div>
          <div className={styles.dropText}>
            <span className={styles.dropBold}>Click to browse</span> or drag & drop
          </div>
          <div className={styles.dropSub}>JPG, PNG, WEBP — Max {MAX_SIZE_MB}MB each</div>
          <input ref={inputRef} type="file" accept="image/*" multiple={multiple} hidden
            onChange={e => validateAndUpload(e.target.files)} />
        </div>
      )}

      {uploading && (
        <div className={styles.progressWrap}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: 6 }}>
            <span>Uploading...</span><span>{progress}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary-light), var(--primary))', transition: 'width 0.1s' }} />
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={14} />
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={12} /></button>
        </div>
      )}

      {images.length > 0 && (
        <div className={styles.imageGrid}>
          {images.map((img, idx) => (
            <div key={img.id} className={`${styles.imageCard} ${idx === coverIndex ? styles.imageCardCover : ''}`}>
              <img src={img.url} alt="" className={styles.imageThumb} />
              {idx === coverIndex && (
                <div className={styles.coverBadge}><Star size={10} fill="currentColor" />Cover</div>
              )}
              <div className={styles.imageActions}>
                <button title="Set as cover" onClick={() => setCoverIndex(idx)}>
                  <Star size={14} fill={idx === coverIndex ? '#F59E0B' : 'none'} color={idx === coverIndex ? '#F59E0B' : '#fff'} />
                </button>
                <button title="Move up" onClick={() => moveImage(idx, idx - 1)} disabled={idx === 0}><ArrowUp size={12} /></button>
                <button title="Move down" onClick={() => moveImage(idx, idx + 1)} disabled={idx === images.length - 1}><ArrowDown size={12} /></button>
                <button title="Remove" className={styles.removeBtn} onClick={() => removeImage(img.id)}><X size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
