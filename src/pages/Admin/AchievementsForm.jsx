// src/pages/Admin/AchievementsForm.jsx
import { useEffect, useState } from 'react';
import { Button, FormField, Input, Textarea, Select, useToast } from '../../components/common/UI';
import { useAuth } from '../../context/useAuth';
import { useData } from '../../context/DataContext';
import { Save } from 'lucide-react';
import { useLocalDraft } from '../../hooks/useLocalDraft';
import modernStyles from './ModernForm.module.css';

export default function AchievementsForm({ initial = {}, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  const { addAchievement, updateAchievement } = useData();
  const toast = useToast();
  const itemId = initial._id || initial.id;

  const [form, setForm] = useState({
    title: initial.title || '',
    achievementType: initial.achievementType || 'Award',
    name: initial.name || '',
    department: initial.department || user?.department || '',
    date: initial.date || '',
    shortDescription: initial.shortDescription || '',
    pdf: initial.pdf || null,
    thumbnail: initial.thumbnail || null,
    externalLink: initial.externalLink || '',
    status: initial.status || 'Draft',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const { clearDraft, lastSavedAt } = useLocalDraft({
    draftType: 'Achievement',
    itemId,
    userKey: user?.email || user?.username || user?._id,
    form,
    setForm,
    toast,
  });

  useEffect(() => {
    onPreviewChange?.({ ...form, type: 'Achievement' });
  }, [form, onPreviewChange]);

  const handleSubmit = async (publish = false) => {
    if (!form.title || (!form.pdf && !initial.pdf)) return toast('Title and supporting PDF are required', 'warning');
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
        <FormField label="Title *">
          <Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Enter achievement title" />
        </FormField>
        <FormField label="Achievement Type">
          <Select value={form.achievementType} onChange={e => setField('achievementType', e.target.value)}>
            <option>Award</option>
            <option>Recognition</option>
            <option>Rank</option>
            <option>Competition</option>
            <option>Certification</option>
            <option>Academic Achievement</option>
          </Select>
        </FormField>
        <FormField label="Student / Faculty Name">
          <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Name" />
        </FormField>
        <FormField label="Department">
          <Input value={form.department} onChange={e => setField('department', e.target.value)} />
        </FormField>
        <FormField label="Achievement Date">
          <Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
        </FormField>
        <FormField label="External Link">
          <Input value={form.externalLink} onChange={e => setField('externalLink', e.target.value)} placeholder="https://..." />
        </FormField>
        <div className={modernStyles.full}>
          <FormField label="Short Description">
            <Textarea value={form.shortDescription} onChange={e => setField('shortDescription', e.target.value)} rows={4} />
          </FormField>
        </div>
        <FormField label="Supporting PDF *">
          <input type="file" accept="application/pdf" onChange={e => setField('pdf', e.target.files[0])} />
          <div className={modernStyles.fileNote}>{form.pdf?.name || (typeof form.pdf === 'string' ? form.pdf : 'No file selected')}</div>
        </FormField>
        <FormField label="Thumbnail Image">
          <input type="file" accept="image/*" onChange={e => setField('thumbnail', e.target.files[0])} />
          <div className={modernStyles.fileNote}>{form.thumbnail?.name || (typeof form.thumbnail === 'string' ? form.thumbnail : 'No file selected')}</div>
        </FormField>
      </div>

      <div className={modernStyles.actions}>
        <Button variant="secondary" onClick={() => onClose && onClose()}>Cancel</Button>
        <Button onClick={() => handleSubmit(false)} loading={saving === 'draft'}>Save Draft</Button>
        <Button variant="success" icon={Save} onClick={() => handleSubmit(true)} loading={saving === 'publish'}>Publish</Button>
      </div>
    </div>
  );
}
