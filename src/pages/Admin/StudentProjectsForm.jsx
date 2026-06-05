// src/pages/Admin/StudentProjectsForm.jsx
import { useEffect, useState } from 'react';
import { Button, FormField, Input, Textarea, useToast } from '../../components/common/UI';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/useAuth';
import { useLocalDraft } from '../../hooks/useLocalDraft';
import modernStyles from './ModernForm.module.css';

export default function StudentProjectsForm({ initial = {}, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  const { addProject, updateProject } = useData();
  const toast = useToast();
  const itemId = initial._id || initial.id;
  const [form, setForm] = useState({
    title: initial.title || '',
    team: initial.team || '',
    guide: initial.guide || '',
    academicYear: initial.academicYear || '',
    stack: initial.stack || '',
    abstract: initial.abstract || '',
    github: initial.github || '',
    demo: initial.demo || '',
    report: initial.report || null,
    images: initial.images || [],
    status: initial.status || 'Draft',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const { clearDraft, lastSavedAt } = useLocalDraft({
    draftType: 'Project',
    itemId,
    userKey: user?.email || user?.username || user?._id,
    form,
    setForm,
    toast,
  });

  useEffect(() => {
    onPreviewChange?.({ ...form, type: 'Project' });
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
        <FormField label="Project Title *"><Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Enter project title" /></FormField>
        <FormField label="Academic Year"><Input value={form.academicYear} onChange={e => setField('academicYear', e.target.value)} placeholder="2025-26" /></FormField>
        <FormField label="Team Members"><Input value={form.team} onChange={e => setField('team', e.target.value)} placeholder="Comma separated names" /></FormField>
        <FormField label="Guide Name"><Input value={form.guide} onChange={e => setField('guide', e.target.value)} /></FormField>
        <FormField label="Tech Stack"><Input value={form.stack} onChange={e => setField('stack', e.target.value)} placeholder="React, Node, MongoDB" /></FormField>
        <FormField label="GitHub Link"><Input value={form.github} onChange={e => setField('github', e.target.value)} placeholder="https://github.com/..." /></FormField>
        <FormField label="Demo Link"><Input value={form.demo} onChange={e => setField('demo', e.target.value)} placeholder="https://..." /></FormField>
        <div className={modernStyles.full}>
          <FormField label="Abstract"><Textarea value={form.abstract} onChange={e => setField('abstract', e.target.value)} rows={4} /></FormField>
        </div>
        <div className={modernStyles.full}>
          <FormField label="Report PDF"><input type="file" accept="application/pdf" onChange={e => setField('report', e.target.files[0])} />
            <div className={modernStyles.fileNote}>{form.report?.name || (typeof form.report === 'string' ? form.report : 'No file selected')}</div>
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
