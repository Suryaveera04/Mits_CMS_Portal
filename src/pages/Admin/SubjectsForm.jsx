// src/pages/Admin/SubjectsForm.jsx
import { useEffect, useState } from 'react';
import { Button, FormField, Input, Textarea, useToast } from '../../components/common/UI';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/useAuth';
import { useLocalDraft } from '../../hooks/useLocalDraft';
import modernStyles from './ModernForm.module.css';

export default function SubjectsForm({ initial = {}, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  const { addSubject, updateSubject } = useData();
  const toast = useToast();
  const itemId = initial._id || initial.id;
  const [form, setForm] = useState({
    code: initial.code || '',
    name: initial.name || '',
    regulation: initial.regulation || '',
    semester: initial.semester || '',
    credits: initial.credits || '',
    faculty: initial.faculty || '',
    syllabus: initial.syllabus || null,
    lectureNotes: initial.lectureNotes || null,
    labManual: initial.labManual || null,
    questionBank: initial.questionBank || null,
    resources: initial.resources || '',
    status: initial.status || 'Draft',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const { clearDraft, lastSavedAt } = useLocalDraft({
    draftType: 'Subject',
    itemId,
    userKey: user?.email || user?.username || user?._id,
    form,
    setForm,
    toast,
  });

  useEffect(() => {
    onPreviewChange?.({ ...form, type: 'Subject' });
  }, [form, onPreviewChange]);

  const handleSubmit = async (publish = false) => {
    if (!form.code || !form.name) return toast('Subject code and name are required', 'warning');
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
        <FormField label="Subject Code *"><Input value={form.code} onChange={e => setField('code', e.target.value)} placeholder="e.g., CS301" /></FormField>
        <FormField label="Subject Name *"><Input value={form.name} onChange={e => setField('name', e.target.value)} /></FormField>
        <FormField label="Regulation"><Input value={form.regulation} onChange={e => setField('regulation', e.target.value)} placeholder="R22" /></FormField>
        <FormField label="Semester"><Input value={form.semester} onChange={e => setField('semester', e.target.value)} placeholder="V" /></FormField>
        <FormField label="Credits"><Input value={form.credits} onChange={e => setField('credits', e.target.value)} placeholder="3" /></FormField>
        <FormField label="Faculty Name"><Input value={form.faculty} onChange={e => setField('faculty', e.target.value)} /></FormField>
        <FormField label="Syllabus PDF"><input type="file" accept="application/pdf" onChange={e => setField('syllabus', e.target.files[0])} />
          <div className={modernStyles.fileNote}>{form.syllabus?.name || (typeof form.syllabus === 'string' ? form.syllabus : 'No file selected')}</div>
        </FormField>
        <FormField label="Lecture Notes PDF"><input type="file" accept="application/pdf" onChange={e => setField('lectureNotes', e.target.files[0])} />
          <div className={modernStyles.fileNote}>{form.lectureNotes?.name || (typeof form.lectureNotes === 'string' ? form.lectureNotes : 'No file selected')}</div>
        </FormField>
        <FormField label="Lab Manual PDF"><input type="file" accept="application/pdf" onChange={e => setField('labManual', e.target.files[0])} />
          <div className={modernStyles.fileNote}>{form.labManual?.name || (typeof form.labManual === 'string' ? form.labManual : 'No file selected')}</div>
        </FormField>
        <FormField label="Question Bank PDF"><input type="file" accept="application/pdf" onChange={e => setField('questionBank', e.target.files[0])} />
          <div className={modernStyles.fileNote}>{form.questionBank?.name || (typeof form.questionBank === 'string' ? form.questionBank : 'No file selected')}</div>
        </FormField>
        <div className={modernStyles.full}>
          <FormField label="Additional Resources (comma separated links)"><Textarea value={form.resources} onChange={e => setField('resources', e.target.value)} rows={4} /></FormField>
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
