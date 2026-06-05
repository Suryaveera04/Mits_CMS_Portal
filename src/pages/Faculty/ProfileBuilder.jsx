// src/pages/Faculty/ProfileBuilder.jsx
import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useData } from '../../context/DataContext';
import { Button, Badge, PageHeader, useToast } from '../../components/common/UI';
import ImageUploader from '../../components/common/ImageUploader';
import {
  GraduationCap, FlaskConical, Lightbulb, Trophy, FolderOpen,
  Calendar, Info, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Send, Save, CheckCircle2, BookOpen, User, Building2, Award,
  Briefcase, Globe, Users, FileText, Link, Target, Activity, X
} from 'lucide-react';
import styles from './ProfileBuilder.module.css';
import { profileAPI, facultyAPI } from '../../services/api';

/* ======== TABLE SECTION COMPONENT ======== */
function TableSection({ title, icon: IconComponent, color, columns, entries = [], isEditing, onEditToggle, onAddEntry, onUpdateEntry, onDeleteEntry }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={styles.section}>
      <div className={`${styles.sectionHeader} ${expanded ? styles.sectionHeaderOpen : ''}`} onClick={() => setExpanded(e => !e)}>
        <div className={styles.sectionTitle}>
          <div className={styles.sectionIcon} style={{ background: color + '18', color }}>
            <IconComponent size={18} />
          </div>
          <span>{title}</span>
          <span className={styles.entryCount}>{entries.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          {isEditing ? (
            <>
              <Button variant="secondary" size="sm" icon={Plus} onClick={onAddEntry}>Add Row</Button>
              <Button variant="secondary" size="sm" icon={X} onClick={onEditToggle}>Done</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" icon={Pencil} onClick={onEditToggle}>Edit</Button>
          )}
          <button className={styles.chevronBtn}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.sectionBody}>
          {entries.length === 0 ? (
            <div className={styles.emptyState}>
              <IconComponent size={32} color="var(--gray-300)" />
              <div>No entries yet</div>
              {isEditing && <div className={styles.emptySub}>Click '+ Add Row' to add your first entry</div>}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    {isEditing && <th className={styles.actionCol}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id}>
                      {columns.map(col => (
                        <td key={col.key}>
                          {isEditing ? (
                            <input
                              type={col.type === 'textarea' ? 'text' : (col.type || 'text')}
                              className={styles.tableInput}
                              value={entry[col.key] || ''}
                              onChange={e => onUpdateEntry(entry.id, col.key, e.target.value)}
                              placeholder={col.placeholder}
                            />
                          ) : (
                            entry[col.key] || '-'
                          )}
                        </td>
                      ))}
                      {isEditing && (
                        <td className={styles.actionCol}>
                          <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => onDeleteEntry(entry.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ======== TEXT SECTION COMPONENT ======== */
function TextSection({ title, icon: Icon, color, value, isEditing, onEditToggle, onChange }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={styles.section}>
      <div className={`${styles.sectionHeader} ${expanded ? styles.sectionHeaderOpen : ''}`} onClick={() => setExpanded(e => !e)}>
        <div className={styles.sectionTitle}>
          <div className={styles.sectionIcon} style={{ background: color + '18', color }}>
            <Icon size={18} />
          </div>
          <span>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          {isEditing ? (
            <Button variant="secondary" size="sm" icon={X} onClick={onEditToggle}>Done</Button>
          ) : (
            <Button variant="secondary" size="sm" icon={Pencil} onClick={onEditToggle}>Edit</Button>
          )}
          <button className={styles.chevronBtn}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.sectionBody}>
          {isEditing ? (
            <textarea
              className={styles.textarea}
              value={value || ''}
              onChange={e => onChange(e.target.value)}
              placeholder={`Enter ${title.toLowerCase()}...`}
              rows={4}
            />
          ) : (
            <div className={styles.textContent}>
              {value || <span className={styles.placeholder}>No information provided</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ======== KEY-VALUE SECTION COMPONENT ======== */
function KeyValueSection({ title, icon: Icon, color, fields, value, isEditing, onEditToggle, onChange }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={styles.section}>
      <div className={`${styles.sectionHeader} ${expanded ? styles.sectionHeaderOpen : ''}`} onClick={() => setExpanded(e => !e)}>
        <div className={styles.sectionTitle}>
          <div className={styles.sectionIcon} style={{ background: color + '18', color }}>
            <Icon size={18} />
          </div>
          <span>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          {isEditing ? (
            <Button variant="secondary" size="sm" icon={X} onClick={onEditToggle}>Done</Button>
          ) : (
            <Button variant="secondary" size="sm" icon={Pencil} onClick={onEditToggle}>Edit</Button>
          )}
          <button className={styles.chevronBtn}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.sectionBody}>
          {isEditing ? (
            <div className={styles.keyValueEdit}>
              {fields.map(field => (
                <div key={field.key} className={styles.formRow}>
                  <label className={styles.formLabel}>{field.label}</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={value?.[field.key] || ''}
                    onChange={e => onChange({ ...value, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.keyValueDisplay}>
              {fields.map(field => (
                <div key={field.key} className={styles.keyValueRow}>
                  <span className={styles.keyLabel}>{field.label}</span>
                  <span className={styles.keyValue}>
                    {value?.[field.key] ? (
                      field.key.includes('Link') ? (
                        <a href={value[field.key]} target="_blank" rel="noopener noreferrer" className={styles.link}>
                          <Link size={14} /> {value[field.key]}
                        </a>
                      ) : (
                        value[field.key]
                      )
                    ) : (
                      <span className={styles.placeholder}>Not provided</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ======== SECTION CONFIGURATIONS ======== */
const EDUCATION_COLUMNS = [
  { key: 'course', label: 'Course / Degree', placeholder: 'B.Tech, M.Tech, Ph.D...' },
  { key: 'specialization', label: 'Specialization', placeholder: 'Computer Science, ML...' },
  { key: 'branch', label: 'Branch', placeholder: 'Computer Science...' },
  { key: 'college', label: 'College / University', placeholder: 'IIT Madras...' },
  { key: 'year', label: 'Year of Passing', placeholder: '2020' },
];

const POST_DOCTORAL_COLUMNS = [
  { key: 'institution', label: 'Institution', placeholder: 'MIT, Stanford...' },
  { key: 'researchArea', label: 'Research Area', placeholder: 'Deep Learning...' },
  { key: 'duration', label: 'Duration', placeholder: '2015-2017' },
  { key: 'description', label: 'Description', placeholder: 'Research description...', type: 'textarea' },
];

const CONSULTANCY_COLUMNS = [
  { key: 'title', label: 'Project Title', placeholder: 'AI for Smart City...' },
  { key: 'fundingAgency', label: 'Funding Agency', placeholder: 'City Municipal Corporation...' },
  { key: 'amount', label: 'Amount', placeholder: '25 Lakhs' },
  { key: 'duration', label: 'Duration', placeholder: '2023-2024' },
  { key: 'role', label: 'Role', placeholder: 'Principal Investigator' },
  { key: 'status', label: 'Status', placeholder: 'Ongoing / Completed' },
];

const FUNDED_PROJECTS_COLUMNS = [
  { key: 'title', label: 'Project Title', placeholder: 'Deep Learning for Medical...' },
  { key: 'fundingAgency', label: 'Funding Agency', placeholder: 'DST-SERB...' },
  { key: 'amount', label: 'Amount', placeholder: '15 Lakhs' },
  { key: 'duration', label: 'Duration', placeholder: '2022-2024' },
  { key: 'role', label: 'Role', placeholder: 'Principal Investigator' },
  { key: 'status', label: 'Status', placeholder: 'Ongoing / Completed' },
];

const PATENTS_COLUMNS = [
  { key: 'title', label: 'Title', placeholder: 'Smart Traffic Monitoring...' },
  { key: 'patentNumber', label: 'Patent Number', placeholder: 'IN202341012345' },
  { key: 'status', label: 'Status', placeholder: 'Filed / Published / Granted' },
  { key: 'filingDate', label: 'Filing Date', placeholder: '2023-01-15' },
  { key: 'grantDate', label: 'Grant Date', placeholder: '2024-01-15' },
];

const BOOKS_CHAPTERS_COLUMNS = [
  { key: 'title', label: 'Title', placeholder: 'Machine Learning in Healthcare' },
  { key: 'publisher', label: 'Publisher', placeholder: 'Springer' },
  { key: 'isbn', label: 'ISBN', placeholder: '978-3-030-12345-6' },
  { key: 'year', label: 'Year', placeholder: '2023' },
  { key: 'authors', label: 'Authors', placeholder: 'Dr. Priya Sharma, Dr. Rajesh Kumar' },
];

const AWARDS_COLUMNS = [
  { key: 'awardName', label: 'Award Name', placeholder: 'Best Faculty Award' },
  { key: 'organization', label: 'Organization', placeholder: 'MITS' },
  { key: 'year', label: 'Year', placeholder: '2022' },
  { key: 'description', label: 'Description', placeholder: 'Award description...', type: 'textarea' },
];

const INDUSTRY_COLUMNS = [
  { key: 'organization', label: 'Organization', placeholder: 'TCS Research' },
  { key: 'type', label: 'Type of Collaboration', placeholder: 'Research Collaboration' },
  { key: 'duration', label: 'Duration', placeholder: '2022-2024' },
  { key: 'outcome', label: 'Outcome', placeholder: 'Joint publication...', type: 'textarea' },
];

const ACADEMIC_EXPOSURE_COLUMNS = [
  { key: 'program', label: 'Program', placeholder: 'International Conference...' },
  { key: 'institution', label: 'Institution', placeholder: 'Columbia University' },
  { key: 'country', label: 'Country', placeholder: 'USA' },
  { key: 'year', label: 'Year', placeholder: '2023' },
];

const EVENTS_ORGANISED_COLUMNS = [
  { key: 'eventName', label: 'Event Name', placeholder: 'National Conference on AI' },
  { key: 'role', label: 'Role', placeholder: 'Organizer / Speaker' },
  { key: 'location', label: 'Location', placeholder: 'MITS Campus' },
  { key: 'date', label: 'Date', placeholder: '2024-01-20' },
];

const EVENTS_ATTENDED_COLUMNS = [
  { key: 'eventName', label: 'Event Name', placeholder: 'IEEE International Conference...' },
  { key: 'role', label: 'Role', placeholder: 'Attendee / Participant' },
  { key: 'location', label: 'Location', placeholder: 'Bangalore' },
  { key: 'date', label: 'Date', placeholder: '2023-11-15' },
];

const AFFILIATIONS_COLUMNS = [
  { key: 'organizationName', label: 'Organization Name', placeholder: 'IEEE' },
  { key: 'membershipType', label: 'Membership Type', placeholder: 'Senior Member' },
  { key: 'duration', label: 'Duration', placeholder: '2015-Present' },
];

const INVITATIONS_COLUMNS = [
  { key: 'eventName', label: 'Event Name', placeholder: 'International AI Summit' },
  { key: 'role', label: 'Role (Speaker/Guest)', placeholder: 'Keynote Speaker' },
  { key: 'organization', label: 'Organization', placeholder: 'IIT Bombay' },
  { key: 'date', label: 'Date', placeholder: '2024-02-15' },
];

const ACADEMIC_VISIT_COLUMNS = [
  { key: 'institution', label: 'Institution', placeholder: 'Stanford University' },
  { key: 'purpose', label: 'Purpose', placeholder: 'Research Collaboration' },
  { key: 'duration', label: 'Duration', placeholder: '2023-06-01 to 2023-07-31' },
  { key: 'outcome', label: 'Outcome', placeholder: 'Joint research paper...', type: 'textarea' },
];

const OUTREACH_COLUMNS = [
  { key: 'activityName', label: 'Activity Name', placeholder: 'AI Workshop for Students' },
  { key: 'description', label: 'Description', placeholder: 'Workshop description...', type: 'textarea' },
  { key: 'location', label: 'Location', placeholder: 'Local High School' },
  { key: 'date', label: 'Date', placeholder: '2023-09-10' },
];

const RESEARCH_PROFILE_FIELDS = [
  { key: 'scopusLink', label: 'Scopus Link', placeholder: 'https://www.scopus.com/...' },
  { key: 'vidwanLink', label: 'Vidwan Link', placeholder: 'https://vidwan.inflibnet.ac.in/...' },
  { key: 'googleScholarLink', label: 'Google Scholar Link', placeholder: 'https://scholar.google.com/...' },
  { key: 'orcid', label: 'ORCID', placeholder: '0000-0001-2345-6789' },
  { key: 'hIndex', label: 'h-index', placeholder: '15' },
];

/* ======== MAIN PROFILE BUILDER ======== */
export default function ProfileBuilder() {
  const { user, updateUser, updateAvatar } = useAuth();
  const { profileSections, profileStatus, updateProfileSection, addProfileEntry, updateProfileEntry, deleteProfileEntry, saveDraft, submitProfileForApproval } = useData();
  const toast = useToast();
  const [avatarImages, setAvatarImages] = useState(user.avatar ? [{ id: 'av', url: user.avatar }] : []);
  const [submitted, setSubmitted] = useState(false);
  const [changeDescription, setChangeDescription] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [editingSections, setEditingSections] = useState({});
  const [editingBasic, setEditingBasic] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [basicForm, setBasicForm] = useState({
    name: user.name || '',
    designation: user.designation || '',
    email: user.email || '',
    qualification: user.qualification || '',
  });
  // pendingBasic holds changes not yet approved — shown as draft
  const [pendingBasic, setPendingBasic] = useState(null);

  const isHOD = user?.role === 'HOD';

  const handleAvatarChange = async (imgs) => {
    setAvatarImages(imgs);
    const avatarUrl = imgs[0]?.url || null;
    // Always update the user object in AuthContext so the avatar shows immediately
    updateUser({ avatar: avatarUrl });
    if (!isHOD) {
      // For faculty, also stage it in pendingBasic so it's included in the approval snapshot
      setPendingBasic(prev => ({ ...(prev || basicForm), avatar: avatarUrl }));
    }
  };

  const handleBasicSave = async () => {
    const avatarUrl = avatarImages[0]?.url || user.avatar || '';
    if (isHOD) {
      const updated = { ...basicForm, avatar: avatarUrl };
      updateUser(updated);
      try {
        await facultyAPI.update(user._id || user.id, updated);
        toast('Profile info saved', 'success');
      } catch (e) { 
        console.error('HOD basic save error:', e.message); 
        toast('Error saving profile', 'error');
      }
    } else {
      setPendingBasic({ ...basicForm, avatar: avatarUrl });
      toast('Basic info staged — submit for approval to apply', 'info');
    }
    setEditingBasic(false);
  };

  const handleBasicCancel = () => {
    setBasicForm({
      name: user.name || '',
      designation: user.designation || '',
      email: user.email || '',
      qualification: user.qualification || '',
    });
    setEditingBasic(false);
  };

  const toggleSectionEdit = (sectionKey) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleAddEntry = (sectionKey) => {
    const newEntry = { id: sectionKey[0] + Date.now() };
    addProfileEntry(sectionKey, newEntry);
  };

  const handleUpdateEntry = (sectionKey, entryId, field, value) => {
    updateProfileEntry(sectionKey, entryId, { [field]: value });
  };

  const handleDeleteEntry = (sectionKey, entryId) => {
    deleteProfileEntry(sectionKey, entryId);
  };

  const handleSubmit = () => {
    if (!changeDescription.trim()) {
      toast('Please describe the changes you made', 'warning');
      return;
    }
    setSubmitting(true);
    
    const basicInfoToSubmit = pendingBasic || {
      name: user.name,
      designation: user.designation,
      email: user.email,
      qualification: user.qualification,
      avatar: avatarImages[0]?.url || user.avatar || ''
    };
    
    setTimeout(() => {
      submitProfileForApproval(changeDescription, basicInfoToSubmit);
      setSubmitted(true);
      setChangeDescription('');
      setShowSubmitModal(false);
      setPendingBasic(null);
      setSubmitting(false);
      toast('Profile submitted for HOD approval', 'success');
      setTimeout(() => setSubmitted(false), 3000);
    }, 500);
  };

  return (
    <div className={styles.root}>
      {/* TOP PROFILE HEADER */}
      <div className={styles.profileHero}>
        <div className={styles.heroBanner} />
        <div className={styles.heroBody}>
        <div className={styles.avatarWrapper}>
          <ImageUploader
            images={avatarImages}
            onChange={handleAvatarChange}
            circular
            multiple={false}
            facultyId={user?._id || user?.id}
            userRole={user?.role}
          />
        </div>
        <div className={styles.profileInfo}>
          {editingBasic ? (
            <div className={styles.basicEditGrid}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Full Name</label>
                <input className={styles.formInput} value={basicForm.name} onChange={e => setBasicForm(p => ({ ...p, name: e.target.value }))} placeholder="Dr. Full Name" />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Designation</label>
                <select className={styles.formInput} value={basicForm.designation} onChange={e => setBasicForm(p => ({ ...p, designation: e.target.value }))}>
                  <option value="">Select Designation</option>
                  <option>Professor & HOD</option>
                  <option>Professor</option>
                  <option>Associate Professor</option>
                  <option>Assistant Professor</option>
                  <option>Senior Lecturer</option>
                  <option>Lecturer</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} type="email" value={basicForm.email} onChange={e => setBasicForm(p => ({ ...p, email: e.target.value }))} placeholder="name@mits.ac.in" />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Qualification</label>
                <input className={styles.formInput} value={basicForm.qualification} onChange={e => setBasicForm(p => ({ ...p, qualification: e.target.value }))} placeholder="Ph.D. (Bharathiar University)" />
              </div>
              <div className={styles.basicEditActions}>
                <Button variant="secondary" size="sm" onClick={handleBasicCancel}>Cancel</Button>
                <Button size="sm" onClick={handleBasicSave}>Save</Button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.profileName}>{user.name}</div>
              {user.designation && <div className={styles.profileDesignation}>{user.designation}</div>}
              {user.qualification && <div className={styles.profileMeta}>{user.qualification}</div>}
              {user.email && <div className={styles.profileMeta}>{user.email}</div>}
              {pendingBasic && !isHOD && (
                <div className={styles.pendingBadge}>⏳ Basic info changes pending approval</div>
              )}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {!isHOD && <Badge status={profileStatus}>{profileStatus}</Badge>}
                <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditingBasic(true)}>Edit Info</Button>
              </div>
            </>
          )}
        </div>
        <div className={styles.profileActions}>
          {submitted && (
            <div className={styles.successMsg}><CheckCircle2 size={16} /> Submitted for approval!</div>
          )}
        </div>
        </div>
      </div>

      {/* ALL PROFILE SECTIONS */}
      <div className={styles.sections}>
        {/* EDUCATION */}
        <TableSection
          title="Education"
          icon={GraduationCap}
          color="#1E3A8A"
          columns={EDUCATION_COLUMNS}
          entries={profileSections.education || []}
          sectionKey="education"
          isEditing={editingSections.education}
          onEditToggle={() => toggleSectionEdit('education')}
          onAddEntry={() => handleAddEntry('education')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('education', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('education', id)}
        />

        {/* POST DOCTORAL EXPERIENCE */}
        <TableSection
          title="Post Doctoral Experience"
          icon={FlaskConical}
          color="#7C3AED"
          columns={POST_DOCTORAL_COLUMNS}
          entries={profileSections.postDoctoral || []}
          sectionKey="postDoctoral"
          isEditing={editingSections.postDoctoral}
          onEditToggle={() => toggleSectionEdit('postDoctoral')}
          onAddEntry={() => handleAddEntry('postDoctoral')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('postDoctoral', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('postDoctoral', id)}
        />

        {/* RESEARCH INTEREST */}
        <TextSection
          title="Research Interest"
          icon={Target}
          color="#059669"
          value={profileSections.researchInterest}
          sectionKey="researchInterest"
          isEditing={editingSections.researchInterest}
          onEditToggle={() => toggleSectionEdit('researchInterest')}
          onChange={(val) => updateProfileSection('researchInterest', val)}
        />

        {/* RESEARCH PROFILE */}
        <KeyValueSection
          title="Research Profile"
          icon={Link}
          color="#D97706"
          fields={RESEARCH_PROFILE_FIELDS}
          value={profileSections.researchProfile}
          sectionKey="researchProfile"
          isEditing={editingSections.researchProfile}
          onEditToggle={() => toggleSectionEdit('researchProfile')}
          onChange={(val) => updateProfileSection('researchProfile', val)}
        />

        {/* RESEARCH DETAILS */}
        <TextSection
          title="Research Details"
          icon={FileText}
          color="#0891B2"
          value={profileSections.researchDetails}
          sectionKey="researchDetails"
          isEditing={editingSections.researchDetails}
          onEditToggle={() => toggleSectionEdit('researchDetails')}
          onChange={(val) => updateProfileSection('researchDetails', val)}
        />

        {/* CONSULTANCY PROJECTS */}
        <TableSection
          title="Consultancy Projects"
          icon={Briefcase}
          color="#B45309"
          columns={CONSULTANCY_COLUMNS}
          entries={profileSections.consultancyProjects || []}
          sectionKey="consultancyProjects"
          isEditing={editingSections.consultancyProjects}
          onEditToggle={() => toggleSectionEdit('consultancyProjects')}
          onAddEntry={() => handleAddEntry('consultancyProjects')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('consultancyProjects', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('consultancyProjects', id)}
        />

        {/* FUNDED PROJECTS */}
        <TableSection
          title="Funded Projects"
          icon={FolderOpen}
          color="#DC2626"
          columns={FUNDED_PROJECTS_COLUMNS}
          entries={profileSections.fundedProjects || []}
          sectionKey="fundedProjects"
          isEditing={editingSections.fundedProjects}
          onEditToggle={() => toggleSectionEdit('fundedProjects')}
          onAddEntry={() => handleAddEntry('fundedProjects')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('fundedProjects', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('fundedProjects', id)}
        />

        {/* PATENTS */}
        <TableSection
          title="Patents"
          icon={Lightbulb}
          color="#4F46E5"
          columns={PATENTS_COLUMNS}
          entries={profileSections.patents || []}
          sectionKey="patents"
          isEditing={editingSections.patents}
          onEditToggle={() => toggleSectionEdit('patents')}
          onAddEntry={() => handleAddEntry('patents')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('patents', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('patents', id)}
        />

        {/* BOOKS/CHAPTERS PUBLISHED */}
        <TableSection
          title="Books/Chapters Published"
          icon={BookOpen}
          color="#0D9488"
          columns={BOOKS_CHAPTERS_COLUMNS}
          entries={profileSections.booksChapters || []}
          sectionKey="booksChapters"
          isEditing={editingSections.booksChapters}
          onEditToggle={() => toggleSectionEdit('booksChapters')}
          onAddEntry={() => handleAddEntry('booksChapters')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('booksChapters', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('booksChapters', id)}
        />

        {/* AWARDS & RECOGNITION */}
        <TableSection
          title="Awards & Recognition"
          icon={Award}
          color="#EA580C"
          columns={AWARDS_COLUMNS}
          entries={profileSections.awardsRecognition || []}
          sectionKey="awardsRecognition"
          isEditing={editingSections.awardsRecognition}
          onEditToggle={() => toggleSectionEdit('awardsRecognition')}
          onAddEntry={() => handleAddEntry('awardsRecognition')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('awardsRecognition', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('awardsRecognition', id)}
        />

        {/* INDUSTRY COLLABORATION */}
        <TableSection
          title="Industry Collaboration"
          icon={Building2}
          color="#2563EB"
          columns={INDUSTRY_COLUMNS}
          entries={profileSections.industryCollaboration || []}
          sectionKey="industryCollaboration"
          isEditing={editingSections.industryCollaboration}
          onEditToggle={() => toggleSectionEdit('industryCollaboration')}
          onAddEntry={() => handleAddEntry('industryCollaboration')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('industryCollaboration', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('industryCollaboration', id)}
        />

        {/* ACADEMIC EXPOSURE */}
        <TableSection
          title="Academic Exposure"
          icon={Globe}
          color="#7C3AED"
          columns={ACADEMIC_EXPOSURE_COLUMNS}
          entries={profileSections.academicExposure || []}
          sectionKey="academicExposure"
          isEditing={editingSections.academicExposure}
          onEditToggle={() => toggleSectionEdit('academicExposure')}
          onAddEntry={() => handleAddEntry('academicExposure')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('academicExposure', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('academicExposure', id)}
        />

        {/* EVENTS ORGANISED */}
        <TableSection
          title="Events Organised"
          icon={Calendar}
          color="#059669"
          columns={EVENTS_ORGANISED_COLUMNS}
          entries={profileSections.eventsOrganised || []}
          sectionKey="eventsOrganised"
          isEditing={editingSections.eventsOrganised}
          onEditToggle={() => toggleSectionEdit('eventsOrganised')}
          onAddEntry={() => handleAddEntry('eventsOrganised')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('eventsOrganised', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('eventsOrganised', id)}
        />

        {/* EVENTS ATTENDED */}
        <TableSection
          title="Events Attended"
          icon={Users}
          color="#0891B2"
          columns={EVENTS_ATTENDED_COLUMNS}
          entries={profileSections.eventsAttended || []}
          sectionKey="eventsAttended"
          isEditing={editingSections.eventsAttended}
          onEditToggle={() => toggleSectionEdit('eventsAttended')}
          onAddEntry={() => handleAddEntry('eventsAttended')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('eventsAttended', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('eventsAttended', id)}
        />

        {/* PROFESSIONAL AFFILIATIONS */}
        <TableSection
          title="Professional Affiliations"
          icon={Users}
          color="#4F46E5"
          columns={AFFILIATIONS_COLUMNS}
          entries={profileSections.professionalAffiliations || []}
          sectionKey="professionalAffiliations"
          isEditing={editingSections.professionalAffiliations}
          onEditToggle={() => toggleSectionEdit('professionalAffiliations')}
          onAddEntry={() => handleAddEntry('professionalAffiliations')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('professionalAffiliations', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('professionalAffiliations', id)}
        />

        {/* INVITATIONS */}
        <TableSection
          title="Invitations"
          icon={Calendar}
          color="#DC2626"
          columns={INVITATIONS_COLUMNS}
          entries={profileSections.invitations || []}
          sectionKey="invitations"
          isEditing={editingSections.invitations}
          onEditToggle={() => toggleSectionEdit('invitations')}
          onAddEntry={() => handleAddEntry('invitations')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('invitations', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('invitations', id)}
        />

        {/* ACADEMIC VISIT */}
        <TableSection
          title="Academic Visit"
          icon={Globe}
          color="#B45309"
          columns={ACADEMIC_VISIT_COLUMNS}
          entries={profileSections.academicVisit || []}
          sectionKey="academicVisit"
          isEditing={editingSections.academicVisit}
          onEditToggle={() => toggleSectionEdit('academicVisit')}
          onAddEntry={() => handleAddEntry('academicVisit')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('academicVisit', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('academicVisit', id)}
        />

        {/* OUTREACH ACTIVITIES */}
        <TableSection
          title="Outreach Activities"
          icon={Activity}
          color="#0D9488"
          columns={OUTREACH_COLUMNS}
          entries={profileSections.outreachActivities || []}
          sectionKey="outreachActivities"
          isEditing={editingSections.outreachActivities}
          onEditToggle={() => toggleSectionEdit('outreachActivities')}
          onAddEntry={() => handleAddEntry('outreachActivities')}
          onUpdateEntry={(id, field, value) => handleUpdateEntry('outreachActivities', id, field, value)}
          onDeleteEntry={(id) => handleDeleteEntry('outreachActivities', id)}
        />

        {/* OTHER INFORMATION */}
        <TextSection
          title="Other Information"
          icon={Info}
          color="#6366F1"
          value={profileSections.otherInfo}
          sectionKey="otherInfo"
          isEditing={editingSections.otherInfo}
          onEditToggle={() => toggleSectionEdit('otherInfo')}
          onChange={(val) => updateProfileSection('otherInfo', val)}
        />
      </div>

      {/* STICKY BOTTOM BAR */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyBarInner}>
          <div className={styles.stickyBarLeft}>
            {!isHOD && <><span>Status:</span><Badge status={profileStatus}>{profileStatus}</Badge></>}
          </div>
          <div className={styles.stickyBarRight}>
            <button className={styles.btnSaveDraft} onClick={() => {
              setSavingDraft(true);
              setTimeout(() => { saveDraft(); setSavingDraft(false); toast('Draft saved', 'success'); }, 400);
            }} disabled={savingDraft}>
              {savingDraft ? '...' : <><Save size={15} /> Save Draft</>}
            </button>
            {isHOD ? (
              <button className={styles.btnSaveChanges} onClick={async () => {
                const uid = user?._id || user?.id;
                const basicToSave = pendingBasic || {
                  name: user.name,
                  designation: user.designation,
                  email: user.email,
                  qualification: user.qualification,
                  avatar: avatarImages[0]?.url || user.avatar || ''
                };
                updateUser(basicToSave);
                try { 
                  await facultyAPI.update(uid, basicToSave); 
                  await profileAPI.save(uid, { ...profileSections, status: 'Approved', basicInfo: basicToSave }, 'HOD'); 
                } catch (e) { console.error(e.message); }
                setPendingBasic(null);
                setSubmitted(true);
                toast('Profile saved successfully', 'success');
                setTimeout(() => setSubmitted(false), 3000);
              }}>
                <Save size={15} /> Save Changes
              </button>
            ) : (
              <button
                className={styles.btnSubmitApproval}
                onClick={() => setShowSubmitModal(true)}
                disabled={profileStatus === 'Pending'}
              >
                <Send size={15} />
                {profileStatus === 'Pending' ? 'Awaiting Approval…' : 'Submit for Approval'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUBMIT MODAL */}
      {showSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Submit Profile for Approval</h3>
              <button className={styles.modalClose} onClick={() => setShowSubmitModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Description of Changes *</label>
                <textarea
                  className={styles.textarea}
                  value={changeDescription}
                  onChange={e => setChangeDescription(e.target.value)}
                  placeholder="Please describe the changes you made to your profile (e.g., 'Added new research paper', 'Updated education details', 'Added new award')..."
                  rows={4}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
              <Button loading={submitting} onClick={handleSubmit}>Submit for Approval</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}