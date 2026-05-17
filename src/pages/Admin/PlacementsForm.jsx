// src/pages/Admin/PlacementsForm.jsx
import { useEffect, useState, useMemo } from 'react';
import { Button, FormField, Input, Textarea, Select, useToast } from '../../components/common/UI';
import { useAuth } from '../../context/useAuth';
import { useData } from '../../context/DataContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './EventReportForm.module.css';
import modernStyles from './ModernForm.module.css';
import { useLocalDraft } from '../../hooks/useLocalDraft';

const PLACEMENT_TYPES = ['On Campus', 'Off Campus'];
const TRAINING_TYPES = ['Skill Development', 'Workshop', 'Seminar', 'Online Course', 'Corporate Training', 'Industry Visit'];

function Section({ title, children, expanded, onToggle, sectionNum, isComplete }) {
  return (
    <div className={`${styles.section} ${expanded ? styles.sectionExpanded : ''}`}>
      <div className={styles.sectionHeader} onClick={onToggle}>
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionNum}>{sectionNum}</span>
          <span className={styles.sectionTitle}>{title}</span>
        </div>
        <div className={styles.sectionHeaderRight}>
          {isComplete && <span className={styles.completeBadge} style={{color:'#22C55E'}}>✓</span>}
          <span className={styles.chevron}>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
        </div>
      </div>
      {expanded && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export default function PlacementsForm({ initial = {}, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  const { addPlacement, updatePlacement } = useData();
  const toast = useToast();
  const itemId = initial._id || initial.id;

  const [subTab, setSubTab] = useState(initial.subtype || 'Placement');
  const [expandedSections, setExpandedSections] = useState({ info: true, files: false });

  const [form, setForm] = useState({
    // Common
    subtype: initial.subtype || 'Placement',
    department: initial.department || user?.department || '',
    status: initial.status || 'Draft',

    // Placement/Internship
    studentName: initial.studentName || '',
    rollNumber: initial.rollNumber || '',
    companyName: initial.companyName || '',
    package: initial.package || '',
    role: initial.role || '',
    placementType: initial.placementType || 'On Campus',
    year: initial.year || new Date().getFullYear().toString(),
    offerLetterUrl: initial.offerLetterUrl || null,
    studentPhotoUrl: initial.studentPhotoUrl || null,

    // Training
    programTitle: initial.programTitle || '',
    trainingType: initial.trainingType || '',
    conductedBy: initial.conductedBy || '',
    startDate: initial.startDate || '',
    endDate: initial.endDate || '',
    numberOfStudents: initial.numberOfStudents || '',
    description: initial.description || '',
    certificateUrl: initial.certificateUrl || null,
    galleryImages: initial.galleryImages || [],
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleSection = (k) => setExpandedSections(prev => ({ ...prev, [k]: !prev[k] }));

  const { clearDraft, lastSavedAt } = useLocalDraft({
    draftType: 'Placement',
    itemId,
    userKey: user?.email || user?.username || user?._id,
    form,
    setForm,
    toast,
  });

  useEffect(() => {
    onPreviewChange?.({ ...form, subtype: subTab, type: 'Placement' });
  }, [form, subTab, onPreviewChange]);

  const isPlacement = subTab === 'Placement' || subTab === 'Internship';
  const isTraining = subTab === 'Training';

  const canSubmit = useMemo(() => {
    if (isPlacement) return form.studentName && form.rollNumber && form.companyName && form.package && form.role;
    if (isTraining) return form.programTitle && form.trainingType && form.conductedBy && form.startDate;
    return false;
  }, [form, isPlacement, isTraining]);

  const handleSubmit = async (publish = false) => {
    if (!canSubmit) return toast('Please fill required fields', 'warning');
    try {
      const payload = { ...form, subtype: subTab, status: publish ? 'Published' : 'Draft', department: user?.department };
      if (initial._id || initial.id) await updatePlacement(initial._id || initial.id, payload);
      else await addPlacement(payload);
      clearDraft();
      toast(initial._id ? 'Updated successfully' : 'Saved successfully', 'success');
      onSave && onSave(payload);
      onClose && onClose();
    } catch (e) {
      toast('Failed to save', 'error');
    }
  };

  const subTabStyle = (tab) => ({
    padding: '8px 16px',
    border: subTab === tab ? '2px solid #1E3A8A' : '1px solid #d1d5db',
    borderRadius: '6px',
    background: subTab === tab ? '#EFF6FF' : 'white',
    cursor: 'pointer',
    fontWeight: subTab === tab ? 600 : 400,
    fontSize: '13px',
  });

  return (
    <div className={styles.formRoot}>
      <div className={modernStyles.topBar}>
        <div className={modernStyles.topLeft}>
          <span className={modernStyles.title}>Session draft only (not stored)</span>
          <span className={modernStyles.meta}>Last edit: {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'No edits yet'}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={clearDraft}>Reset status</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Type</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={subTabStyle('Placement')} onClick={() => { setSubTab('Placement'); setField('subtype', 'Placement'); }}>Placement</button>
          <button style={subTabStyle('Internship')} onClick={() => { setSubTab('Internship'); setField('subtype', 'Internship'); }}>Internship</button>
          <button style={subTabStyle('Training')} onClick={() => { setSubTab('Training'); setField('subtype', 'Training'); }}>Training Program</button>
        </div>
      </div>

      {isPlacement && (
        <>
          <Section title={`${subTab} Information`} sectionNum="01" expanded={expandedSections.info} onToggle={() => toggleSection('info')} isComplete={canSubmit}>
            <div className={styles.fieldGrid}>
              <FormField label="Student Name *">
                <Input value={form.studentName} onChange={e => setField('studentName', e.target.value)} placeholder="Full name" />
              </FormField>
              <FormField label="Roll Number *">
                <Input value={form.rollNumber} onChange={e => setField('rollNumber', e.target.value)} placeholder="e.g., 21AIM123" />
              </FormField>
              <FormField label="Company Name *">
                <Input value={form.companyName} onChange={e => setField('companyName', e.target.value)} placeholder="Company name" />
              </FormField>
              <FormField label="Package *">
                <Input value={form.package} onChange={e => setField('package', e.target.value)} placeholder="e.g., 6.5 LPA" />
              </FormField>
              <FormField label="Role *">
                <Input value={form.role} onChange={e => setField('role', e.target.value)} placeholder="Job title" />
              </FormField>
              <FormField label="Placement Type">
                <Select value={form.placementType} onChange={e => setField('placementType', e.target.value)}>
                  {PLACEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </FormField>
              <FormField label="Year">
                <Input type="number" value={form.year} onChange={e => setField('year', e.target.value)} />
              </FormField>
            </div>
          </Section>

          <Section title="Documents" sectionNum="02" expanded={expandedSections.files} onToggle={() => toggleSection('files')} isComplete={!!form.offerLetterUrl}>
            <FormField label="Offer Letter PDF">
              <input type="file" accept="application/pdf" onChange={e => setField('offerLetterUrl', e.target.files[0]?.name || form.offerLetterUrl)} />
              <div className={modernStyles.fileNote}>{form.offerLetterUrl || 'No file selected'}</div>
            </FormField>
            <FormField label="Student Photo">
              <input type="file" accept="image/*" onChange={e => setField('studentPhotoUrl', e.target.files[0]?.name || form.studentPhotoUrl)} />
              <div className={modernStyles.fileNote}>{form.studentPhotoUrl || 'No file selected'}</div>
            </FormField>
          </Section>
        </>
      )}

      {isTraining && (
        <>
          <Section title="Training Program Details" sectionNum="01" expanded={expandedSections.info} onToggle={() => toggleSection('info')} isComplete={canSubmit}>
            <div className={styles.fieldGrid}>
              <FormField label="Program Title *">
                <Input value={form.programTitle} onChange={e => setField('programTitle', e.target.value)} placeholder="e.g., AI/ML Bootcamp" />
              </FormField>
              <FormField label="Training Type *">
                <Select value={form.trainingType} onChange={e => setField('trainingType', e.target.value)}>
                  <option value="">Select Type</option>
                  {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </FormField>
              <FormField label="Conducted By *">
                <Input value={form.conductedBy} onChange={e => setField('conductedBy', e.target.value)} placeholder="Organization/Institute name" />
              </FormField>
              <FormField label="Start Date *">
                <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
              </FormField>
              <FormField label="End Date">
                <Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
              </FormField>
              <FormField label="Number of Students">
                <Input type="number" value={form.numberOfStudents} onChange={e => setField('numberOfStudents', e.target.value)} />
              </FormField>
            </div>
            <FormField label="Description">
              <Textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Training objectives, outcomes, etc." rows={4} />
            </FormField>
          </Section>

          <Section title="Files & Gallery" sectionNum="02" expanded={expandedSections.files} onToggle={() => toggleSection('files')}>
            <FormField label="Certificate PDF">
              <input type="file" accept="application/pdf" onChange={e => setField('certificateUrl', e.target.files[0]?.name || form.certificateUrl)} />
              <div className={modernStyles.fileNote}>{form.certificateUrl || 'No file selected'}</div>
            </FormField>
            <FormField label="Gallery Images">
              <input type="file" accept="image/*" multiple onChange={e => setField('galleryImages', Array.from(e.target.files || []))} />
              <div className={modernStyles.fileNote}>
                {Array.isArray(form.galleryImages) && form.galleryImages.length > 0
                  ? `${form.galleryImages.length} image(s) selected`
                  : 'No images selected'}
              </div>
            </FormField>
          </Section>
        </>
      )}

      <div className={modernStyles.actions}>
        <Button variant="secondary" onClick={() => onClose && onClose()}>Cancel</Button>
        <Button onClick={() => handleSubmit(false)} loading={saving === 'draft'}>Save Draft</Button>
        <Button variant="success" onClick={() => handleSubmit(true)} loading={saving === 'publish'}>Publish</Button>
      </div>
    </div>
  );
}
