// src/pages/Admin/MoUReportForm.jsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/useAuth';
import { Button, FormField, Input, useToast } from '../../components/common/UI';
import ImageUploader from '../../components/common/ImageUploader';
import RichTextEditor from '../../components/common/RichTextEditor';
import {
  Plus, X, ChevronDown, ChevronUp, FileText, Users, Calendar, Briefcase,
  Target, Save, Send, CheckCircle, Building2, Globe, Mail, Phone,
  User, Link2, FolderOpen, TrendingUp, Clock
} from 'lucide-react';
import styles from './MoUReportForm.module.css';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Chemistry'];

const ORG_TYPES = ['Industry', 'University', 'Research Lab', 'NGO', 'Government', 'Institute', 'Corporate'];

const MOU_CATEGORIES = ['Academic', 'Research', 'Internship', 'Placement', 'Collaboration', 'Consultancy', 'Training'];

const COLLAB_AREAS = [
  'Internships', 'Research Collaboration', 'Student Exchange', 
  'Faculty Exchange', 'Workshops / Seminars', 'Consultancy', 'Placement Support'
];

const COUNTRIES = ['India', 'USA', 'UK', 'Germany', 'Australia', 'Canada', 'Japan', 'Singapore', 'UAE', 'Other'];

function generateMoUId() {
  return 'MOU-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Date.now().toString(36).toUpperCase();
}

function calculateDuration(start, end) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  const years = Math.floor(diff / 365);
  const months = Math.floor((diff % 365) / 30);
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
  return `${diff} days`;
}

function getMoUStatus(endDate) {
  if (!endDate) return 'Active';
  const end = new Date(endDate);
  const today = new Date();
  return end >= today ? 'Active' : 'Expired';
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

function CoordinatorCard({ coord, index, type, onUpdate, onRemove }) {
  return (
    <div className={styles.coordCard}>
      <div className={styles.coordCardHeader}>
        <span className={styles.coordType}>{type} Coordinator #{index + 1}</span>
        <button className={styles.removeBtn} onClick={onRemove}><X size={14} /></button>
      </div>
      <div className={styles.coordGrid}>
        <FormField label="Name *">
          <Input value={coord.name} onChange={e => onUpdate({ ...coord, name: e.target.value })} placeholder="Name" />
        </FormField>
        {type === 'Internal' ? (
          <>
            <FormField label="Official Email *">
              <Input type="email" value={coord.email} onChange={e => onUpdate({ ...coord, email: e.target.value })} placeholder="name@mits.edu.in" />
            </FormField>
            <FormField label="Contact Number *">
              <Input type="tel" value={coord.contact} onChange={e => onUpdate({ ...coord, contact: e.target.value })} placeholder="+91 98765 43210" />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Designation">
              <Input value={coord.designation} onChange={e => onUpdate({ ...coord, designation: e.target.value })} placeholder="Designation" />
            </FormField>
            <FormField label="Email *">
              <Input type="email" value={coord.email} onChange={e => onUpdate({ ...coord, email: e.target.value })} placeholder="email@org.com" />
            </FormField>
            <FormField label="Contact Number">
              <Input type="tel" value={coord.contact} onChange={e => onUpdate({ ...coord, contact: e.target.value })} placeholder="+91 98765 43210" />
            </FormField>
          </>
        )}
      </div>
    </div>
  );
}

function CheckboxGroup({ options, selected, onChange, label }) {
  return (
    <div className={styles.checkboxGroup}>
      {label && <label className={styles.checkboxLabel}>{label}</label>}
      <div className={styles.checkboxGrid}>
        {options.map(opt => (
          <label key={opt} className={`${styles.checkboxItem} ${selected.includes(opt) ? styles.checked : ''}`}>
            <input type="checkbox" checked={selected.includes(opt)} onChange={e => {
              if (e.target.checked) onChange([...selected, opt]);
              else onChange(selected.filter(x => x !== opt));
            }} />
            <span className={styles.checkboxBox} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function MoUReportForm({ initial, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true, agreement: false, purpose: false, collaboration: false, 
    coordinator: false, benefits: false, documents: false, tracking: false
  });

  const [form, setForm] = useState({
    mouId: initial?.mouId || generateMoUId(),
    title: initial?.title || '',
    department: initial?.department || user?.department || 'Computer Science',
    partnerOrg: initial?.partnerOrg || '',
    orgType: initial?.orgType || '',
    country: initial?.country || 'India',
    mouCategory: initial?.mouCategory || '',
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
    duration: initial?.duration || '',
    status: initial?.status || 'Active',
    renewalOption: initial?.renewalOption || 'No',
    purpose: initial?.purpose || '',
    scope: initial?.scope || '',
    objectives: initial?.objectives || '',
    collabAreas: initial?.collabAreas || [],
    internalCoordinators: initial?.internalCoordinators || [],
    externalCoordinators: initial?.externalCoordinators || [],
    studentBenefits: initial?.studentBenefits || '',
    facultyBenefits: initial?.facultyBenefits || '',
    expectedOutcomes: initial?.expectedOutcomes || '',
    signedDocument: initial?.signedDocument || null,
    approvalLetter: initial?.approvalLetter || null,
    supportingDocs: initial?.supportingDocs || [],
    signingImages: initial?.signingImages || [],
    activitiesConducted: initial?.activitiesConducted || '',
    studentsBenefited: initial?.studentsBenefited || '',
    internshipsProvided: initial?.internshipsProvided || '',
    jointEvents: initial?.jointEvents || '',
    approvalStatus: initial?.approvalStatus || 'Draft',
    reviewerRemarks: initial?.reviewerRemarks || '',
    ...initial
  });

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    onPreviewChange?.({ ...form, type: 'MoU' });
  }, [form, onPreviewChange]);

  const computedDuration = useMemo(() => calculateDuration(form.startDate, form.endDate), [form.startDate, form.endDate]);
  const computedStatus = useMemo(() => getMoUStatus(form.endDate), [form.endDate]);

  const isAllSectionsComplete = useMemo(() => ({
    basic: !!(form.title && form.department && form.partnerOrg && form.orgType),
    agreement: !!(form.startDate && form.endDate),
    purpose: !!form.purpose,
    collaboration: form.collabAreas.length > 0,
    coordinator: form.internalCoordinators.length > 0 || form.externalCoordinators.length > 0,
    benefits: !!form.studentBenefits,
    documents: !!form.signedDocument,
    tracking: true
  }), [form]);

  const progress = Math.round(
    (Object.values(isAllSectionsComplete).filter(Boolean).length / 8) * 100
  );

  const addInternalCoord = () => setForm(prev => ({
    ...prev, internalCoordinators: [...prev.internalCoordinators, { name: '', email: '', contact: '' }]
  }));

  const updateInternalCoord = (idx, data) => setForm(prev => ({
    ...prev, internalCoordinators: prev.internalCoordinators.map((c, i) => i === idx ? data : c)
  }));

  const removeInternalCoord = (idx) => setForm(prev => ({
    ...prev, internalCoordinators: prev.internalCoordinators.filter((_, i) => i !== idx)
  }));

  const addExternalCoord = () => setForm(prev => ({
    ...prev, externalCoordinators: [...prev.externalCoordinators, { name: '', designation: '', email: '', contact: '' }]
  }));

  const updateExternalCoord = (idx, data) => setForm(prev => ({
    ...prev, externalCoordinators: prev.externalCoordinators.map((c, i) => i === idx ? data : c)
  }));

  const removeExternalCoord = (idx) => setForm(prev => ({
    ...prev, externalCoordinators: prev.externalCoordinators.filter((_, i) => i !== idx)
  }));

  const canSubmit = form.title && form.department && form.partnerOrg && form.startDate && form.endDate && form.signedDocument;

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

      <Section title="MoU Basic Information" icon={FileText} color="#1E3A8A" sectionNum="01" expanded={expandedSections.basic} onToggle={() => toggleSection('basic')} isComplete={isAllSectionsComplete.basic}>
        <div className={styles.fieldGrid}>
          <FormField label="MoU ID">
            <Input value={form.mouId} readOnly className={styles.readOnly} />
          </FormField>
          <FormField label="MoU Title *">
            <Input value={form.title} onChange={e => setField('title', e.target.value.toUpperCase())} placeholder="MOU TITLE" />
          </FormField>
          <FormField label="Department *">
            <select className={styles.selectInput} value={form.department} onChange={e => setField('department', e.target.value)}>
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Partner Organization *">
            <Input value={form.partnerOrg} onChange={e => setField('partnerOrg', e.target.value)} placeholder="Organization name" />
          </FormField>
          <FormField label="Organization Type *">
            <select className={styles.selectInput} value={form.orgType} onChange={e => setField('orgType', e.target.value)}>
              <option value="">Select Type</option>
              {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Country">
            <select className={styles.selectInput} value={form.country} onChange={e => setField('country', e.target.value)}>
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="MoU Category">
            <select className={styles.selectInput} value={form.mouCategory} onChange={e => setField('mouCategory', e.target.value)}>
              <option value="">Select Category</option>
              {MOU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
        </div>
      </Section>

      <Section title="Agreement Details" icon={Calendar} color="#059669" sectionNum="02" expanded={expandedSections.agreement} onToggle={() => toggleSection('agreement')} isComplete={isAllSectionsComplete.agreement}>
        <div className={styles.fieldGrid}>
          <FormField label="Start Date *">
            <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
          </FormField>
          <FormField label="End Date *">
            <Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
          </FormField>
          <FormField label="Duration">
            <Input value={computedDuration || form.duration} readOnly className={styles.readOnly} />
          </FormField>
          <FormField label="Status">
            <Input value={computedStatus || form.status} readOnly className={`${styles.readOnly} ${computedStatus === 'Active' ? styles.statusActive : styles.statusExpired}`} />
          </FormField>
          <FormField label="Renewal Option">
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input type="radio" name="renewal" checked={form.renewalOption === 'Yes'} onChange={() => setField('renewalOption', 'Yes')} />
                <span>Yes</span>
              </label>
              <label className={styles.radioItem}>
                <input type="radio" name="renewal" checked={form.renewalOption === 'No'} onChange={() => setField('renewalOption', 'No')} />
                <span>No</span>
              </label>
            </div>
          </FormField>
        </div>
      </Section>

      <Section title="Purpose & Description" icon={Briefcase} color="#7C3AED" sectionNum="03" expanded={expandedSections.purpose} onToggle={() => toggleSection('purpose')} isComplete={isAllSectionsComplete.purpose}>
        <div className={styles.purposeGrid}>
          <FormField label="Purpose of MoU *">
            <RichTextEditor value={form.purpose || ''} onChange={v => setField('purpose', v)} placeholder="Describe the purpose of this MoU..." />
          </FormField>
          <FormField label="Scope of Collaboration">
            <RichTextEditor value={form.scope || ''} onChange={v => setField('scope', v)} placeholder="Describe the scope of collaboration..." />
          </FormField>
          <FormField label="Key Objectives">
            <RichTextEditor value={form.objectives || ''} onChange={v => setField('objectives', v)} placeholder="List key objectives..." />
          </FormField>
        </div>
      </Section>

      <Section title="Areas of Collaboration" icon={Target} color="#4F46E5" sectionNum="04" expanded={expandedSections.collaboration} onToggle={() => toggleSection('collaboration')} isComplete={isAllSectionsComplete.collaboration}>
        <CheckboxGroup label="Select Areas of Collaboration" options={COLLAB_AREAS} selected={form.collabAreas} onChange={v => setField('collabAreas', v)} />
      </Section>

      <Section title="Coordinator Information" icon={Users} color="#EA580C" sectionNum="05" expanded={expandedSections.coordinator} onToggle={() => toggleSection('coordinator')} isComplete={isAllSectionsComplete.coordinator}>
        <div className={styles.coordSection}>
          <h4 className={styles.coordSectionTitle}>Internal Coordinator (College)</h4>
          {form.internalCoordinators.map((coord, idx) => (
            <CoordinatorCard key={idx} coord={coord} index={idx} type="Internal" onUpdate={d => updateInternalCoord(idx, d)} onRemove={() => removeInternalCoord(idx)} />
          ))}
          <button className={styles.addBtn} onClick={addInternalCoord}><Plus size={16} /> Add Internal Coordinator</button>
        </div>
        <div className={styles.coordSection}>
          <h4 className={styles.coordSectionTitle}>External Coordinator (Partner Organization)</h4>
          {form.externalCoordinators.map((coord, idx) => (
            <CoordinatorCard key={idx} coord={coord} index={idx} type="External" onUpdate={d => updateExternalCoord(idx, d)} onRemove={() => removeExternalCoord(idx)} />
          ))}
          <button className={styles.addBtn} onClick={addExternalCoord}><Plus size={16} /> Add External Coordinator</button>
        </div>
      </Section>

      <Section title="Benefits & Expected Outcomes" icon={TrendingUp} color="#0891B2" sectionNum="06" expanded={expandedSections.benefits} onToggle={() => toggleSection('benefits')} isComplete={isAllSectionsComplete.benefits}>
        <div className={styles.benefitsGrid}>
          <FormField label="Benefits to Students">
            <RichTextEditor value={form.studentBenefits || ''} onChange={v => setField('studentBenefits', v)} placeholder="Describe benefits to students..." />
          </FormField>
          <FormField label="Benefits to Faculty">
            <RichTextEditor value={form.facultyBenefits || ''} onChange={v => setField('facultyBenefits', v)} placeholder="Describe benefits to faculty..." />
          </FormField>
          <FormField label="Expected Outcomes">
            <RichTextEditor value={form.expectedOutcomes || ''} onChange={v => setField('expectedOutcomes', v)} placeholder="Describe expected outcomes..." />
          </FormField>
        </div>
      </Section>

      <Section title="Document Uploads" icon={FolderOpen} color="#0D9488" sectionNum="07" expanded={expandedSections.documents} onToggle={() => toggleSection('documents')} isComplete={isAllSectionsComplete.documents}>
        <div className={styles.docGrid}>
          <FormField label="Signed MoU Document *">
            <input type="file" accept=".pdf" className={styles.fileInput} onChange={e => setField('signedDocument', e.target.files[0])} />
            {form.signedDocument && <span className={styles.fileName}>{form.signedDocument.name}</span>}
          </FormField>
          <FormField label="Approval Letter">
            <input type="file" accept=".pdf,.doc,.docx" className={styles.fileInput} onChange={e => setField('approvalLetter', e.target.files[0])} />
            {form.approvalLetter && <span className={styles.fileName}>{form.approvalLetter.name}</span>}
          </FormField>
          <FormField label="Supporting Documents">
            <input type="file" accept=".pdf,.doc,.docx" className={styles.fileInput} multiple onChange={e => setField('supportingDocs', Array.from(e.target.files))} />
          </FormField>
          <FormField label="MoU Signing Images">
            <ImageUploader images={form.signingImages || []} onChange={imgs => setField('signingImages', imgs)} multiple />
          </FormField>
        </div>
      </Section>

      <Section title="Implementation Tracking" icon={TrendingUp} color="#9333EA" sectionNum="08" expanded={expandedSections.tracking} onToggle={() => toggleSection('tracking')} isComplete={isAllSectionsComplete.tracking}>
        <div className={styles.trackingGrid}>
          <FormField label="Number of Activities Conducted">
            <Input type="number" value={form.activitiesConducted} onChange={e => setField('activitiesConducted', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Number of Students Benefited">
            <Input type="number" value={form.studentsBenefited} onChange={e => setField('studentsBenefited', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Number of Internships Provided">
            <Input type="number" value={form.internshipsProvided} onChange={e => setField('internshipsProvided', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Number of Joint Events Conducted">
            <Input type="number" value={form.jointEvents} onChange={e => setField('jointEvents', e.target.value)} placeholder="0" />
          </FormField>
        </div>
      </Section>

      <div className={styles.formButtons}>
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="secondary" icon={Save} loading={saving === 'draft'} disabled={!canSubmit} onClick={() => onSave({ ...form, status: 'Draft', approvalStatus: 'Draft' })}>
          Save Draft
        </Button>
        <Button icon={Send} loading={saving === 'publish'} disabled={!canSubmit} onClick={() => onSave({ ...form, status: 'Approved', approvalStatus: 'Approved' })}>
          Submit
        </Button>
      </div>
    </div>
  );
}