// src/pages/Admin/ContentTrendingForm.jsx
import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { Button, FormField, Input } from '../../components/common/UI';
import ImageUploader from '../../components/common/ImageUploader';
import { Save, Send, Play } from 'lucide-react';
import styles from './ContentTrendingForm.module.css';

export default function ContentTrendingForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    title: '',
    reelUrl: '',
    date: '',
    coverImage: null,
    ...initial,
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const canSubmit = form.title?.trim() && form.reelUrl?.trim();

  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {/* Left — form fields */}
        <div className={styles.fields}>
          <FormField label="Title *">
            <Input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Trending content title…"
            />
          </FormField>

          <FormField label="Reel URL (Instagram / YouTube Shorts) *">
            <Input
              value={form.reelUrl || ''}
              onChange={e => set('reelUrl', e.target.value)}
              placeholder="https://www.instagram.com/reel/…"
            />
          </FormField>

          <FormField label="Date">
            <Input
              type="date"
              value={form.date || ''}
              onChange={e => set('date', e.target.value)}
            />
          </FormField>

          <FormField label="Cover Image (Portrait 9:16 — e.g. 1080×1920)">
            <ImageUploader
              images={form.coverImage ? [{ id: 'cover', url: form.coverImage }] : []}
              onChange={imgs => set('coverImage', imgs[0]?.url || null)}
              multiple={false}
            />
            <p className={styles.hint}>⚠ Must be portrait (9:16). Recommended: 1080×1920px</p>
          </FormField>
        </div>

        {/* Right — live preview */}
        <div className={styles.preview}>
          <p className={styles.previewLabel}>Live Preview</p>
          <div className={styles.previewCard}>
            {form.coverImage
              ? <img src={form.coverImage} alt="Preview" className={styles.previewImg} />
              : <div className={styles.previewPlaceholder}><Play size={36} color="white" /></div>
            }
            <div className={styles.previewOverlay}><Play size={28} color="white" /></div>
            <div className={styles.previewInfo}>
              <p className={styles.previewTitle}>{form.title || 'Title will appear here'}</p>
              {form.date && <p className={styles.previewDate}>{form.date}</p>}
            </div>
          </div>
          {form.reelUrl && (
            <a href={form.reelUrl} target="_blank" rel="noopener noreferrer" className={styles.reelLink}>
              Open Reel ↗
            </a>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} disabled={!!saving}>Cancel</Button>
        <Button
          variant="secondary"
          icon={Save}
          loading={saving === 'draft'}
          disabled={!!saving || !form.title?.trim()}
          onClick={() => onSave({ ...form, status: 'Draft', submittedBy: (user?._id || user?.id) })}
        >
          Save Draft
        </Button>
        <Button
          icon={Send}
          loading={saving === 'publish'}
          disabled={!!saving || !canSubmit}
          onClick={() => onSave({ ...form, status: 'Published', submittedBy: (user?._id || user?.id) })}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
