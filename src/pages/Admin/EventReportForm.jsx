// src/pages/Admin/EventReportForm.jsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/useAuth';
import { Button, FormField, Input, useToast } from '../../components/common/UI';
import ImageUploader from '../../components/common/ImageUploader';
import RichTextEditor from '../../components/common/RichTextEditor';
import {
  Plus, X, ChevronDown, ChevronUp, Calendar, User, Users, MapPin, FileText,
  DollarSign, Link2, Image, Save, Send, CheckCircle, AlertCircle,
  Building2, GraduationCap, Briefcase, Globe, Clock, Phone, Mail
} from 'lucide-react';
import styles from './EventReportForm.module.css';

import { DEPARTMENTS } from '../../constants/departments';

const EVENT_TYPES = [
  'Workshop', 'Seminar', 'Guest Lecture', 'FDP', 'Conference', 
  'Symposium', 'Training', 'Hackathon', 'Tech Talk', 'Webinar', 'Other'
];

const DESIGNATIONS = [
  'Professor', 'Associate Professor', 'Assistant Professor', 'HOD', 
  'Director', 'Dean', 'Dr.', 'Mr.', 'Mrs.', 'Ms.'
];

const PARTICIPANT_TYPES = ['Students', 'Faculty', 'Industry', 'Research Scholars'];
const GRADUATION_LEVELS = ['UG', 'PG'];
const STUDENT_YEARS = ['1st', '2nd', '3rd', '4th', 'Final'];
const SEMESTERS = ['1st', '2nd'];

function generateEventId() {
  return 'EVT-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Date.now().toString(36).toUpperCase();
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

function ResourcePersonCard({ person, index, onUpdate, onRemove }) {
  return (
    <div className={styles.resourceCard}>
      <div className={styles.resourceCardHeader}>
        <span className={styles.resourceNum}>Resource Person #{index + 1}</span>
        <button className={styles.removeBtn} onClick={onRemove}><X size={14} /></button>
      </div>
      <div className={styles.resourceGrid}>
        <FormField label="Name *">
          <Input value={person.name} onChange={e => onUpdate({ ...person, name: e.target.value.toUpperCase() })} placeholder="DR. NAME" />
        </FormField>
        <FormField label="Qualification">
          <Input value={person.qualification} onChange={e => onUpdate({ ...person, qualification: e.target.value })} placeholder="Ph.D., M.Tech, etc." />
        </FormField>
        <FormField label="Experience (Years)">
          <Input type="number" value={person.experience} onChange={e => onUpdate({ ...person, experience: e.target.value })} placeholder="0" />
        </FormField>
        <FormField label="Designation">
          <select className={styles.selectInput} value={person.designation || ''} onChange={e => onUpdate({ ...person, designation: e.target.value })}>
            <option value="">Select</option>
            {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>
        <FormField label="Institute / Organization">
          <Input value={person.institute} onChange={e => onUpdate({ ...person, institute: e.target.value })} placeholder="Institute name" />
        </FormField>
        <FormField label="Department">
          <Input value={person.department} onChange={e => onUpdate({ ...person, department: e.target.value })} placeholder="Department" />
        </FormField>
      </div>
    </div>
  );
}

function CoordinatorCard({ coord, index, onUpdate, onRemove }) {
  return (
    <div className={styles.resourceCard}>
      <div className={styles.resourceCardHeader}>
        <span className={styles.resourceNum}>Coordinator #{index + 1}</span>
        <button className={styles.removeBtn} onClick={onRemove}><X size={14} /></button>
      </div>
      <div className={styles.coordGrid}>
        <FormField label="Name *">
          <Input value={coord.name} onChange={e => onUpdate({ ...coord, name: e.target.value })} placeholder="Coordinator name" />
        </FormField>
        <FormField label="Official Email *">
          <Input type="email" value={coord.email} onChange={e => onUpdate({ ...coord, email: e.target.value })} placeholder="name@mits.edu.in" />
        </FormField>
        <FormField label="Contact Number *">
          <Input type="tel" value={coord.contact} onChange={e => onUpdate({ ...coord, contact: e.target.value })} placeholder="+91 98765 43210" />
        </FormField>
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
          <label key={opt} className={styles.checkboxItem}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={e => {
                if (e.target.checked) onChange([...selected, opt]);
                else onChange(selected.filter(x => x !== opt));
              }}
            />
            <span className={styles.checkboxBox} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FileUploadField({ label, value, onChange, accept, required, maxSize }) {
  const handleFile = (file) => {
    if (file.size > maxSize * 1024) {
      alert(`File size must be less than ${maxSize}KB`);
      return;
    }
    onChange(file);
  };
  return (
    <div className={styles.fileUpload}>
      <label>{label}{required && <span className={styles.required}>*</span>}</label>
      <input type="file" accept={accept} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
      {value && <span className={styles.fileName}>{value.name}</span>}
    </div>
  );
}

export default function EventReportForm({ initial, onSave, onClose, saving, onPreviewChange }) {
  const { user } = useAuth();
  const toast = useToast();
  
  const [expandedSections, setExpandedSections] = useState({
    general: true, resource: false, details: false, outcome: false, 
    participants: false, coordinator: false, documents: false, budget: false, feedback: false, sponsorship: false
  });

  const [form, setForm] = useState({
    eventId: initial?.eventId || generateEventId(),
    title: initial?.title || '',
    department: initial?.department || user?.department || 'Computer Science',
    collaborationDept: initial?.collaborationDept || '',
    eventType: initial?.eventType || '',
    description: initial?.description || '',
    resourcePersons: initial?.resourcePersons || [],
    fromDate: initial?.fromDate || '',
    toDate: initial?.toDate || '',
    mode: initial?.mode || 'Offline',
    venue: initial?.venue || '',
    address: initial?.address || '',
    duration: initial?.duration || '',
    registrationLink: initial?.registrationLink || '',
    outcome: initial?.outcome || '',
    participantTypes: initial?.participantTypes || [],
    gradLevels: initial?.gradLevels || [],
    studentYears: initial?.studentYears || [],
    semesters: initial?.semesters || [],
    totalRegistered: initial?.totalRegistered || '',
    totalAttended: initial?.totalAttended || '',
    coordinators: initial?.coordinators || [],
    poster: initial?.poster || null,
    geoPhotos: initial?.geoPhotos || [],
    attendanceSheet: initial?.attendanceSheet || null,
    registrationList: initial?.registrationList || null,
    budgetLetter: initial?.budgetLetter || null,
    approvedBudget: initial?.approvedBudget || '',
    expenditure: initial?.expenditure || '',
    feedbackLink: initial?.feedbackLink || '',
    analysisReport: initial?.analysisReport || null,
    sponsorOrg: initial?.sponsorOrg || '',
    sponsorAmount: initial?.sponsorAmount || '',
    ...initial
  });

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    onPreviewChange?.({ ...form, type: 'Event' });
  }, [form, onPreviewChange]);

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const isAllSectionsComplete = useMemo(() => {
    return {
      general: !!(form.title && form.department && form.eventType),
      resource: form.resourcePersons.length > 0,
      details: !!(form.fromDate && form.venue),
      outcome: !!form.outcome,
      participants: !!(form.participantTypes.length && form.totalRegistered),
      coordinator: form.coordinators.length > 0,
      documents: !!form.poster,
      budget: true,
      feedback: true,
      sponsorship: true
    };
  }, [form]);

  const progress = Math.round(
    (Object.values(isAllSectionsComplete).filter(Boolean).length / 10) * 100
  );

  const addResourcePerson = () => {
    setForm(prev => ({
      ...prev,
      resourcePersons: [...prev.resourcePersons, { name: '', qualification: '', experience: '', designation: '', institute: '', department: '' }]
    }));
  };

  const updateResourcePerson = (idx, data) => {
    setForm(prev => ({
      ...prev,
      resourcePersons: prev.resourcePersons.map((rp, i) => i === idx ? data : rp)
    }));
  };

  const removeResourcePerson = (idx) => {
    setForm(prev => ({
      ...prev,
      resourcePersons: prev.resourcePersons.filter((_, i) => i !== idx)
    }));
  };

  const addCoordinator = () => {
    setForm(prev => ({
      ...prev,
      coordinators: [...prev.coordinators, { name: '', email: '', contact: '' }]
    }));
  };

  const updateCoordinator = (idx, data) => {
    setForm(prev => ({
      ...prev,
      coordinators: prev.coordinators.map((c, i) => i === idx ? data : c)
    }));
  };

  const removeCoordinator = (idx) => {
    setForm(prev => ({
      ...prev,
      coordinators: prev.coordinators.filter((_, i) => i !== idx)
    }));
  };

  const canSubmit = form.title && form.department && form.eventType && form.fromDate && form.venue;

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

      <Section title="General Information" icon={FileText} color="#1E3A8A" sectionNum="01" expanded={expandedSections.general} onToggle={() => toggleSection('general')} isComplete={isAllSectionsComplete.general}>
        <div className={styles.fieldGrid}>
          <FormField label="Event ID">
            <Input value={form.eventId} readOnly className={styles.readOnly} />
          </FormField>
          <FormField label="Event Title *">
            <Input value={form.title} onChange={e => setField('title', e.target.value.toUpperCase())} placeholder="EVENT TITLE IN UPPERCASE" />
          </FormField>
          <FormField label="Department *">
            <select className={styles.selectInput} value={form.department} onChange={e => setField('department', e.target.value)}>
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Collaboration with">
            <select className={styles.selectInput} value={form.collaborationDept} onChange={e => setField('collaborationDept', e.target.value)}>
              <option value="">Select (Optional)</option>
              {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Event Type *">
            <select className={styles.selectInput} value={form.eventType} onChange={e => setField('eventType', e.target.value)}>
              <option value="">Select Type</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
        <div className={styles.descriptionSection}>
          <FormField label="Description">
            <RichTextEditor value={form.description || ''} onChange={v => setField('description', v)} placeholder="Describe the event (max 200 words)..." />
          </FormField>
        </div>
      </Section>

      <Section title="Resource Person Information" icon={User} color="#7C3AED" sectionNum="02" expanded={expandedSections.resource} onToggle={() => toggleSection('resource')} isComplete={isAllSectionsComplete.resource}>
        {form.resourcePersons.map((rp, idx) => (
          <ResourcePersonCard key={idx} person={rp} index={idx} onUpdate={d => updateResourcePerson(idx, d)} onRemove={() => removeResourcePerson(idx)} />
        ))}
        <button className={styles.addBtn} onClick={addResourcePerson}><Plus size={16} /> Add Resource Person</button>
      </Section>

      <Section title="Event Information" icon={Calendar} color="#059669" sectionNum="03" expanded={expandedSections.details} onToggle={() => toggleSection('details')} isComplete={isAllSectionsComplete.details}>
        <div className={styles.fieldGrid}>
          <FormField label="From Date *">
            <Input type="date" value={form.fromDate} onChange={e => setField('fromDate', e.target.value)} />
          </FormField>
          <FormField label="To Date">
            <Input type="date" value={form.toDate} onChange={e => setField('toDate', e.target.value)} />
          </FormField>
          <FormField label="Mode">
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input type="radio" name="mode" checked={form.mode === 'Online'} onChange={() => setField('mode', 'Online')} />
                <span>Online</span>
              </label>
              <label className={styles.radioItem}>
                <input type="radio" name="mode" checked={form.mode === 'Offline'} onChange={() => setField('mode', 'Offline')} />
                <span>Offline</span>
              </label>
              <label className={styles.radioItem}>
                <input type="radio" name="mode" checked={form.mode === 'Hybrid'} onChange={() => setField('mode', 'Hybrid')} />
                <span>Hybrid</span>
              </label>
            </div>
          </FormField>
          <FormField label="Venue *">
            <Input value={form.venue} onChange={e => setField('venue', e.target.value)} placeholder="Room No. / Hall Name" />
          </FormField>
          <FormField label="Address">
            <textarea className={styles.textarea} value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Full address..." rows={2} />
          </FormField>
          <FormField label="Duration">
            <Input value={form.duration} onChange={e => setField('duration', e.target.value)} placeholder="e.g., 2 days, 6 hours" />
          </FormField>
          <FormField label="Registration Link">
            <Input type="url" value={form.registrationLink} onChange={e => setField('registrationLink', e.target.value)} placeholder="https://..." />
          </FormField>
        </div>
      </Section>

      <Section title="Outcome / Summary" icon={Briefcase} color="#0891B2" sectionNum="04" expanded={expandedSections.outcome} onToggle={() => toggleSection('outcome')} isComplete={isAllSectionsComplete.outcome}>
        <RichTextEditor value={form.outcome || ''} onChange={v => setField('outcome', v)} placeholder="Describe the outcome and summary of the event..." />
      </Section>

      <Section title="Participants Information" icon={Users} color="#4F46E5" sectionNum="05" expanded={expandedSections.participants} onToggle={() => toggleSection('participants')} isComplete={isAllSectionsComplete.participants}>
        <div className={styles.participantGrid}>
          <CheckboxGroup label="Nature of Participants" options={PARTICIPANT_TYPES} selected={form.participantTypes} onChange={v => setField('participantTypes', v)} />
          <CheckboxGroup label="Graduation Level" options={GRADUATION_LEVELS} selected={form.gradLevels} onChange={v => setField('gradLevels', v)} />
          <CheckboxGroup label="Year of Students" options={STUDENT_YEARS} selected={form.studentYears} onChange={v => setField('studentYears', v)} />
          <CheckboxGroup label="Semester" options={SEMESTERS} selected={form.semesters} onChange={v => setField('semesters', v)} />
        </div>
        <div className={styles.numbersRow}>
          <FormField label="Total Registered *">
            <Input type="number" value={form.totalRegistered} onChange={e => setField('totalRegistered', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Total Attended">
            <Input type="number" value={form.totalAttended} onChange={e => setField('totalAttended', e.target.value)} placeholder="0" />
          </FormField>
        </div>
      </Section>

      <Section title="Coordinator Information" icon={Building2} color="#EA580C" sectionNum="06" expanded={expandedSections.coordinator} onToggle={() => toggleSection('coordinator')} isComplete={isAllSectionsComplete.coordinator}>
        {form.coordinators.map((coord, idx) => (
          <CoordinatorCard key={idx} coord={coord} index={idx} onUpdate={d => updateCoordinator(idx, d)} onRemove={() => removeCoordinator(idx)} />
        ))}
        <button className={styles.addBtn} onClick={addCoordinator}><Plus size={16} /> Add Coordinator</button>
      </Section>

      <Section title="Supporting Documents" icon={Image} color="#0D9488" sectionNum="07" expanded={expandedSections.documents} onToggle={() => toggleSection('documents')} isComplete={isAllSectionsComplete.documents}>
        <div className={styles.docGrid}>
          <FormField label="Event Poster / Banner *">
            <ImageUploader images={form.poster ? [{ id: 'poster', url: form.poster }] : []} onChange={imgs => setField('poster', imgs[0]?.url || null)} multiple={false} />
          </FormField>
          <FormField label="Geo-tagged Photos">
            <ImageUploader images={form.geoPhotos || []} onChange={imgs => setField('geoPhotos', imgs)} multiple />
          </FormField>
          <FormField label="Attendance Sheet">
            <input type="file" accept=".pdf,.jpg,.png" onChange={e => setField('attendanceSheet', e.target.files[0])} />
          </FormField>
          <FormField label="Registration List">
            <input type="file" accept=".pdf,.xlsx,.xls" onChange={e => setField('registrationList', e.target.files[0])} />
          </FormField>
        </div>
      </Section>

      <Section title="Budget Information" icon={DollarSign} color="#DC2626" sectionNum="08" expanded={expandedSections.budget} onToggle={() => toggleSection('budget')} isComplete={isAllSectionsComplete.budget}>
        <div className={styles.budgetGrid}>
          <FormField label="Budget Approval Letter">
            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setField('budgetLetter', e.target.files[0])} />
          </FormField>
          <FormField label="Approved Budget (₹)">
            <Input type="number" value={form.approvedBudget} onChange={e => setField('approvedBudget', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Expenditure (₹)">
            <Input type="number" value={form.expenditure} onChange={e => setField('expenditure', e.target.value)} placeholder="0" />
          </FormField>
        </div>
      </Section>

      <Section title="Feedback" icon={Link2} color="#9333EA" sectionNum="09" expanded={expandedSections.feedback} onToggle={() => toggleSection('feedback')} isComplete={isAllSectionsComplete.feedback}>
        <div className={styles.fieldGrid}>
          <FormField label="Feedback Form Link">
            <Input type="url" value={form.feedbackLink} onChange={e => setField('feedbackLink', e.target.value)} placeholder="https://..." />
          </FormField>
          <FormField label="Analysis Report">
            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setField('analysisReport', e.target.files[0])} />
          </FormField>
        </div>
      </Section>

      <Section title="Sponsorship (Optional)" icon={Globe} color="#6366F1" sectionNum="10" expanded={expandedSections.sponsorship} onToggle={() => toggleSection('sponsorship')} isComplete={isAllSectionsComplete.sponsorship}>
        <div className={styles.fieldGrid}>
          <FormField label="Organization Name">
            <Input value={form.sponsorOrg} onChange={e => setField('sponsorOrg', e.target.value)} placeholder="Organization name" />
          </FormField>
          <FormField label="Amount Received (₹)">
            <Input type="number" value={form.sponsorAmount} onChange={e => setField('sponsorAmount', e.target.value)} placeholder="0" />
          </FormField>
        </div>
      </Section>

      <div className={styles.formButtons}>
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="secondary" icon={Save} loading={saving === 'draft'} disabled={!canSubmit} onClick={() => onSave({ ...form, status: 'Draft', submittedBy: (user?._id || user?.id) })}>
          Save Draft
        </Button>
        <Button icon={Send} loading={saving === 'publish'} disabled={!canSubmit} onClick={() => onSave({ ...form, status: 'Approved', submittedBy: (user?._id || user?.id) })}>
          Submit
        </Button>
      </div>
    </div>
  );
}
