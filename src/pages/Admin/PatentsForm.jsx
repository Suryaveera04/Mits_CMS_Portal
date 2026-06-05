// src/pages/Admin/PatentsForm.jsx
import { useEffect, useState } from 'react';
import { Button, FormField, Input, Textarea, useToast } from '../../components/common/UI';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/useAuth';
import { useLocalDraft } from '../../hooks/useLocalDraft';
import modernStyles from './ModernForm.module.css';

export default function PatentsForm({ initial = {}, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  const { addPatent, updatePatent } = useData();
  const toast = useToast();
  const itemId = initial._id || initial.id;
  const [form, setForm] = useState({
    title: initial.title || '',
    patentType: initial.patentType || 'Published',
    inventors: initial.inventors || '',
    department: initial.department || '',
    patentNumber: initial.patentNumber || '',
    applicationNumber: initial.applicationNumber || '',
    filingDate: initial.filingDate || '',
    publishedDate: initial.publishedDate || '',
    office: initial.office || '',
    abstract: initial.abstract || '',
    document: initial.document || null,
    images: initial.images || [],
    externalLink: initial.externalLink || '',
    status: initial.status || 'Draft',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const { clearDraft, lastSavedAt } = useLocalDraft({
    draftType: 'Patent',
    itemId,
    userKey: user?.email || user?.username || user?._id,
    form,
    setForm,
    toast,
  });

  useEffect(() => {
    onPreviewChange?.({ ...form, type: 'Patent' });
  }, [form, onPreviewChange]);

  const handleSubmit = async (publish = false) => {
    if (!form.title) return toast('Title is required', 'warning');
    const payload = { ...form, status: publish ? 'Published' : 'Draft', submittedBy: (user?._id || user?.id) };
    if (onSave) onSave(payload);
    clearDraft();
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
        <FormField label="Patent Title *"><Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Enter patent title" /></FormField>
        <FormField label="Patent Type"><Input value={form.patentType} onChange={e => setField('patentType', e.target.value)} placeholder="Published / Granted" /></FormField>
        <FormField label="Inventors"><Input value={form.inventors} onChange={e => setField('inventors', e.target.value)} placeholder="Comma separated names" /></FormField>
        <FormField label="Department"><Input value={form.department} onChange={e => setField('department', e.target.value)} /></FormField>
        <FormField label="Patent Number"><Input value={form.patentNumber} onChange={e => setField('patentNumber', e.target.value)} /></FormField>
        <FormField label="Application Number"><Input value={form.applicationNumber} onChange={e => setField('applicationNumber', e.target.value)} /></FormField>
        <FormField label="Filing Date"><Input type="date" value={form.filingDate} onChange={e => setField('filingDate', e.target.value)} /></FormField>
        <FormField label="Published Date"><Input type="date" value={form.publishedDate} onChange={e => setField('publishedDate', e.target.value)} /></FormField>
        <FormField label="Patent Office / Country"><Input value={form.office} onChange={e => setField('office', e.target.value)} /></FormField>
        <FormField label="External Link"><Input value={form.externalLink} onChange={e => setField('externalLink', e.target.value)} placeholder="https://..." /></FormField>
        <div className={modernStyles.full}>
          <FormField label="Abstract / Description"><Textarea value={form.abstract} onChange={e => setField('abstract', e.target.value)} rows={4} /></FormField>
        </div>
        <div className={modernStyles.full}>
          <FormField label="Patent Document PDF"><input type="file" accept="application/pdf" onChange={e => setField('document', e.target.files[0])} />
            <div className={modernStyles.fileNote}>{form.document?.name || (typeof form.document === 'string' ? form.document : 'No file selected')}</div>
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
