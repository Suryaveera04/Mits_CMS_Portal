// src/pages/Admin/NewsReportForm.jsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/useAuth';
import { Button, FormField, Input, useToast } from '../../components/common/UI';
import ImageUploader from '../../components/common/ImageUploader';
import RichTextEditor from '../../components/common/RichTextEditor';
import {
  Plus, X, ChevronDown, ChevronUp, FileText, Image, Tags, Eye,
  Save, Send, CheckCircle, Globe, Building2, Star
} from 'lucide-react';
import styles from './NewsReportForm.module.css';

import { DEPARTMENTS } from '../../constants/departments';

const NEWS_CATEGORIES = ['Announcement', 'Achievement', 'Event Highlight', 'General News'];

function generateNewsId() {
  return 'NEWS-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Date.now().toString(36).toUpperCase();
}

function Section({ title, icon: Icon, color, children, expanded, onToggle, sectionNum, isComplete }) {
  return (
    <div className={`${styles.section} ${expanded ? styles.sectionExpanded : ''}`}>
      <div className={styles.sectionHeader} onClick={onToggle}>
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionNum}>{sectionNum}</span>
          <div className={styles.sectionIcon} style={{ background: color + '20', color }}>
            <Icon size={16} />
          </div>
          <span className={styles.sectionTitle}>{title}</span>
        </div>
        <div className={styles.sectionHeaderRight}>
          {isComplete && <span className={styles.completeBadge}><CheckCircle size={14} /></span>}
          <span className={styles.chevron}>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
        </div>
      </div>
      {expanded && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export default function NewsReportForm({ initial, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true, content: false, media: false, tagging: false, status: false
  });

  const [form, setForm] = useState({
    newsId: initial?.newsId || generateNewsId(),
    title: initial?.title || '',
    department: initial?.department || user?.department || DEPARTMENTS[0]?.code || '',
    category: initial?.category || '',
    date: initial?.date || new Date().toISOString().slice(0, 10),
    summary: initial?.summary || '',
    fullContent: initial?.fullContent || '',
    coverImage: initial?.coverImage || null,
    gallery: initial?.gallery || [],
    tags: initial?.tags || [],
    featured: initial?.featured || 'No',
    visibility: initial?.visibility || 'College Wide',
    status: initial?.status || 'Draft',
    ...initial
  });

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    onPreviewChange?.({ ...form, type: 'News' });
  }, [form, onPreviewChange]);

  const isAllSectionsComplete = useMemo(() => ({
    basic: !!(form.title && form.date),
    content: !!form.summary,
    media: !!form.coverImage,
    tagging: true,
    status: true
  }), [form]);

  const progress = Math.round(
    (Object.values(isAllSectionsComplete).filter(Boolean).length / 5) * 100
  );

  const canSubmit = form.title && form.date && form.coverImage;

  return (
    <div className={styles.formRoot}>
      <div className={styles.progressBar}>
        <div className={styles.progressLabel}>
          <span>Form Progress</span>
          <span>{progress}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: progress + '%' }} />
        </div>
      </div>

      <Section title="Basic Information" icon={FileText} color="#1E3A8A" sectionNum="01" expanded={expandedSections.basic} onToggle={() => toggleSection('basic')} isComplete={isAllSectionsComplete.basic}>
        <div className={styles.fieldGrid}>
          <FormField label="News ID">
            <Input value={form.newsId} readOnly className={styles.readOnly} />
          </FormField>
          <FormField label="Title *">
            <Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="News title..." />
          </FormField>
          <FormField label="Department">
            <select className={styles.selectInput} value={form.department} onChange={e => setField('department', e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Category">
            <select className={styles.selectInput} value={form.category} onChange={e => setField('category', e.target.value)}>
              <option value="">Select Category</option>
              {NEWS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Date *">
            <Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
          </FormField>
        </div>
      </Section>

      <Section title="Content" icon={FileText} color="#059669" sectionNum="02" expanded={expandedSections.content} onToggle={() => toggleSection('content')} isComplete={isAllSectionsComplete.content}>
        <div className={styles.contentGrid}>
          <FormField label="Short Summary (max 150 words)">
            <textarea 
              className={styles.textarea} 
              value={form.summary} 
              onChange={e => setField('summary', e.target.value)} 
              placeholder="Brief summary for cards and previews..."
              rows={3}
            />
            <span className={styles.charCount}>{form.summary?.split(/\s+/).filter(Boolean).length || 0} / 150 words</span>
          </FormField>
          <FormField label="Full Content">
            <RichTextEditor value={form.fullContent || ''} onChange={v => setField('fullContent', v)} placeholder="Write the full article content..." />
          </FormField>
        </div>
      </Section>

      <Section title="Media" icon={Image} color="#7C3AED" sectionNum="03" expanded={expandedSections.media} onToggle={() => toggleSection('media')} isComplete={isAllSectionsComplete.media}>
        <div className={styles.mediaGrid}>
          <FormField label="Cover Image (Landscape) *">
            <ImageUploader 
              images={form.coverImage ? [{ id: 'cover', url: form.coverImage }] : []} 
              onChange={imgs => setField('coverImage', imgs[0]?.url || null)} 
              multiple={false} 
            />
            <span className={styles.hint}>Recommended: 1200 × 600px</span>
          </FormField>
          <FormField label="Additional Images (Gallery)">
            <ImageUploader 
              images={form.gallery || []} 
              onChange={imgs => setField('gallery', imgs)} 
              multiple 
            />
          </FormField>
        </div>
      </Section>

      <Section title="Tagging & Visibility" icon={Tags} color="#4F46E5" sectionNum="04" expanded={expandedSections.tagging} onToggle={() => toggleSection('tagging')} isComplete={isAllSectionsComplete.tagging}>
        <div className={styles.taggingGrid}>
          <FormField label="Tags (comma separated)">
            <Input value={form.tags?.join(', ') || ''} onChange={e => setField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} placeholder="achievement, award, research" />
          </FormField>
          <FormField label="Featured News">
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input type="radio" name="featured" checked={form.featured === 'Yes'} onChange={() => setField('featured', 'Yes')} />
                <span>Yes</span>
              </label>
              <label className={styles.radioItem}>
                <input type="radio" name="featured" checked={form.featured === 'No'} onChange={() => setField('featured', 'No')} />
                <span>No</span>
              </label>
            </div>
          </FormField>
          <FormField label="Visibility">
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input type="radio" name="visibility" checked={form.visibility === 'College Wide'} onChange={() => setField('visibility', 'College Wide')} />
                <Globe size={14} /><span>College Wide</span>
              </label>
              <label className={styles.radioItem}>
                <input type="radio" name="visibility" checked={form.visibility === 'Department Only'} onChange={() => setField('visibility', 'Department Only')} />
                <Building2 size={14} /><span>Department Only</span>
              </label>
            </div>
          </FormField>
        </div>
      </Section>

      <Section title="Status" icon={CheckCircle} color="#EA580C" sectionNum="05" expanded={expandedSections.status} onToggle={() => toggleSection('status')} isComplete={isAllSectionsComplete.status}>
        <div className={styles.statusRow}>
          <div className={`${styles.statusBadge} ${styles[form.status?.toLowerCase() || 'draft']}`}>
            {form.status || 'Draft'}
          </div>
        </div>
      </Section>

      <div className={styles.formButtons}>
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="secondary" icon={Save} loading={saving === 'draft'} disabled={!canSubmit} onClick={() => onSave({ ...form, status: 'Draft', submittedBy: (user?._id || user?.id) })}>
          Save Draft
        </Button>
        <Button icon={Send} loading={saving === 'publish'} disabled={!canSubmit} onClick={() => onSave({ ...form, status: 'Published', submittedBy: (user?._id || user?.id) })}>
          Publish
        </Button>
      </div>
    </div>
  );
}
