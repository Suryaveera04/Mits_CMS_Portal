// src/pages/Admin/PublicationsForm.jsx
import { useEffect, useState } from 'react';
import { Button, FormField, Input, Textarea, Select, useToast } from '../../components/common/UI';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/useAuth';
import { useLocalDraft } from '../../hooks/useLocalDraft';
import modernStyles from './ModernForm.module.css';

export default function PublicationsForm({ initial = {}, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  const { addPublication, updatePublication } = useData();
  const toast = useToast();
  const itemId = initial._id || initial.id;
  const [form, setForm] = useState({
    title: initial.title || '',
    authors: initial.authors || '',
    venue: initial.venue || '',
    publisher: initial.publisher || '',
    doi: initial.doi || '',
    issn: initial.issn || '',
    year: initial.year || '',
    indexing: initial.indexing || '',
    abstract: initial.abstract || '',
    tags: initial.tags || [],
    pdf: initial.pdf || null,
    externalLink: initial.externalLink || '',
    citationCount: initial.citationCount || 0,
    status: initial.status || 'Draft',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const { clearDraft, lastSavedAt } = useLocalDraft({
    draftType: 'Publication',
    itemId,
    userKey: user?.email || user?.username || user?._id,
    form,
    setForm,
    toast,
  });

  useEffect(() => {
    onPreviewChange?.({ ...form, type: 'Publication' });
  }, [form, onPreviewChange]);

  const handleSubmit = async (publish = false) => {
    if (!form.title) return toast('Title is required', 'warning');
    try {
      const payload = { ...form, status: publish ? 'Published' : 'Draft' };
      if (initial._id || initial.id) await updatePublication(initial._id || initial.id, payload);
      else await addPublication(payload);
      clearDraft();
      toast('Saved', 'success');
      onSave && onSave(payload);
      onClose && onClose();
    } catch (e) { toast('Failed to save', 'error'); }
  };

  return (
    <div className={modernStyles.shell}>
      <div className={modernStyles.topBar}>
        <div className={modernStyles.topLeft}>
          <span className={modernStyles.title}>Session draft only (not stored)</span>
          <span className={modernStyles.meta}>Last edit: {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'No edits yet'}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={clearDraft}>Reset status</Button>
      </div>

      <div className={modernStyles.grid}>
        <FormField label="Paper Title *"><Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Enter publication title" /></FormField>
        <FormField label="Authors"><Input value={form.authors} onChange={e => setField('authors', e.target.value)} placeholder="Author names" /></FormField>
        <FormField label="Journal / Conference"><Input value={form.venue} onChange={e => setField('venue', e.target.value)} /></FormField>
        <FormField label="Publisher"><Input value={form.publisher} onChange={e => setField('publisher', e.target.value)} /></FormField>
        <FormField label="DOI"><Input value={form.doi} onChange={e => setField('doi', e.target.value)} /></FormField>
        <FormField label="ISSN / ISBN"><Input value={form.issn} onChange={e => setField('issn', e.target.value)} /></FormField>
        <FormField label="Publication Year"><Input value={form.year} onChange={e => setField('year', e.target.value)} /></FormField>
        <FormField label="Indexing"><Input value={form.indexing} onChange={e => setField('indexing', e.target.value)} placeholder="Scopus / WoS / UGC Care" /></FormField>
        <FormField label="Citation Count"><Input type="number" value={form.citationCount} onChange={e => setField('citationCount', Number(e.target.value || 0))} /></FormField>
        <FormField label="External Link"><Input value={form.externalLink} onChange={e => setField('externalLink', e.target.value)} placeholder="https://..." /></FormField>
        <div className={modernStyles.full}>
          <FormField label="Abstract"><Textarea value={form.abstract} onChange={e => setField('abstract', e.target.value)} rows={4} /></FormField>
        </div>
        <div className={modernStyles.full}>
          <FormField label="PDF Upload"><input type="file" accept="application/pdf" onChange={e => setField('pdf', e.target.files[0])} />
            <div className={modernStyles.fileNote}>{form.pdf?.name || (typeof form.pdf === 'string' ? form.pdf : 'No file selected')}</div>
          </FormField>
        </div>
      </div>

      <div className={modernStyles.actions}>
        <Button variant="secondary" onClick={() => onClose && onClose()}>Cancel</Button>
        <Button onClick={() => handleSubmit(false)} loading={saving === 'draft'}>Save Draft</Button>
        <Button variant="success" onClick={() => handleSubmit(true)} loading={saving === 'publish'}>Publish</Button>
      </div>
    </div>
  );
}
