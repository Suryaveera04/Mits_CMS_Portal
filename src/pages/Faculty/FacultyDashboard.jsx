// src/pages/Faculty/FacultyDashboard.jsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useData } from '../../context/DataContext';

const EMPTY_PROFILE = {
  education: [], postDoctoral: [], researchInterest: '',
  researchProfile: {}, researchDetails: '',
  consultancyProjects: [], fundedProjects: [], patents: [],
  booksChapters: [], awardsRecognition: [], industryCollaboration: [],
  academicExposure: [], eventsOrganised: [], eventsAttended: [],
  professionalAffiliations: [], invitations: [], academicVisit: [],
  outreachActivities: [], otherInfo: '',
};
import { Badge } from '../../components/common/UI';
import {
  Edit3, Eye, FileText, Clock, CheckCircle, XCircle,
  AlertTriangle, Activity, ChevronRight, RotateCcw, Send,
  BookOpen, Award, Layers, TrendingUp, User,
  GraduationCap, FlaskConical, Lightbulb, FolderOpen,
  Calendar, Info, Building2, Briefcase, Globe, Users,
  FileText as FileText2, Link, Target, ChevronDown, ChevronUp,
} from 'lucide-react';
import styles from './FacultyDashboard.module.css';
import Avatar from '../../components/common/Avatar';

/* ── helpers ── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7)  return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function calcCompletion(s, user) {
  const checks = [
    user?.avatar,
    user?.designation,
    s.education?.length,
    s.postDoctoral?.length,
    s.researchInterest,
    s.researchProfile?.googleScholarLink,
    s.researchDetails,
    s.fundedProjects?.length,
    s.consultancyProjects?.length,
    s.patents?.length,
    s.booksChapters?.length,
    s.awardsRecognition?.length,
    s.professionalAffiliations?.length,
    s.eventsOrganised?.length,
    s.industryCollaboration?.length,
    s.outreachActivities?.length,
  ];
  const filled = checks.filter(Boolean).length;
  const total  = checks.length;
  const pct    = Math.round((filled / total) * 100);
  const color  = pct >= 80 ? '#15803D' : pct >= 50 ? '#D97706' : '#DC2626';
  const hint   = pct >= 80 ? 'Great profile!' : pct >= 50 ? 'Keep filling sections' : 'Profile needs attention';
  return { pct, color, hint, filled, total };
}

const STATUS_CFG = {
  Draft:    { color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', icon: FileText },
  Pending:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: Clock },
  Approved: { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', icon: CheckCircle },
  Rejected: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: XCircle },
};

const TYPE_ICON = { Profile: User, Research: BookOpen, Education: Award, Patent: Layers, Project: TrendingUp };

/* ── profile section components ── */
function TableSection({ title, icon: Icon, color, columns, entries = [] }) {
  const [expanded, setExpanded] = useState(true);
  if (!entries.length) return null;
  return (
    <div className={styles.pvSection}>
      <div className={`${styles.pvHeader} ${expanded ? styles.pvHeaderOpen : ''}`} onClick={() => setExpanded(e => !e)}>
        <div className={styles.pvTitle}>
          <div className={styles.pvIcon} style={{ background: color + '18', color }}><Icon size={18} /></div>
          <span>{title}</span>
          <span className={styles.pvCount}>{entries.length}</span>
        </div>
        <button className={styles.pvChevron}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>
      {expanded && (
        <div className={styles.pvBody}>
          <div className={styles.pvTableWrap}>
            <table className={styles.pvTable}>
              <thead><tr><th>S.No</th>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
              <tbody>{entries.map((e, i) => (
                <tr key={e.id}><td>{i + 1}</td>{columns.map(c => <td key={c.key}>{e[c.key] || '—'}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TextSection({ title, icon: Icon, color, value }) {
  const [expanded, setExpanded] = useState(true);
  if (!value || !String(value).trim()) return null;
  return (
    <div className={styles.pvSection}>
      <div className={`${styles.pvHeader} ${expanded ? styles.pvHeaderOpen : ''}`} onClick={() => setExpanded(e => !e)}>
        <div className={styles.pvTitle}>
          <div className={styles.pvIcon} style={{ background: color + '18', color }}><Icon size={18} /></div>
          <span>{title}</span>
        </div>
        <button className={styles.pvChevron}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>
      {expanded && <div className={styles.pvBody}><div className={styles.pvText}>{value}</div></div>}
    </div>
  );
}

function KeyValueSection({ title, icon: Icon, color, fields, value }) {
  const [expanded, setExpanded] = useState(true);
  if (!value || typeof value !== 'object') return null;
  if (!fields.some(f => value[f.key])) return null;
  return (
    <div className={styles.pvSection}>
      <div className={`${styles.pvHeader} ${expanded ? styles.pvHeaderOpen : ''}`} onClick={() => setExpanded(e => !e)}>
        <div className={styles.pvTitle}>
          <div className={styles.pvIcon} style={{ background: color + '18', color }}><Icon size={18} /></div>
          <span>{title}</span>
        </div>
        <button className={styles.pvChevron}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>
      {expanded && (
        <div className={styles.pvBody}>
          <div className={styles.pvKV}>
            {fields.map(field => value[field.key] && (
              <div key={field.key} className={styles.pvKVRow}>
                <span className={styles.pvKVLabel}>{field.label}</span>
                <span className={styles.pvKVValue}>
                  {field.key.includes('Link')
                    ? <a href={value[field.key]} target="_blank" rel="noopener noreferrer" className={styles.pvLink}><Link size={13} />{value[field.key]}</a>
                    : value[field.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── column configs ── */
const EDUCATION_COLS         = [{key:'course',label:'Course / Degree'},{key:'specialization',label:'Specialization'},{key:'branch',label:'Branch'},{key:'college',label:'College / University'},{key:'year',label:'Year'}];
const POST_DOCTORAL_COLS     = [{key:'institution',label:'Institution'},{key:'researchArea',label:'Research Area'},{key:'duration',label:'Duration'},{key:'description',label:'Description'}];
const CONSULTANCY_COLS       = [{key:'title',label:'Project Title'},{key:'fundingAgency',label:'Funding Agency'},{key:'amount',label:'Amount'},{key:'duration',label:'Duration'},{key:'role',label:'Role'},{key:'status',label:'Status'}];
const FUNDED_COLS            = [{key:'title',label:'Project Title'},{key:'fundingAgency',label:'Funding Agency'},{key:'amount',label:'Amount'},{key:'duration',label:'Duration'},{key:'role',label:'Role'},{key:'status',label:'Status'}];
const PATENTS_COLS           = [{key:'title',label:'Title'},{key:'patentNumber',label:'Patent No.'},{key:'status',label:'Status'},{key:'filingDate',label:'Filing Date'},{key:'grantDate',label:'Grant Date'}];
const BOOKS_COLS             = [{key:'title',label:'Title'},{key:'publisher',label:'Publisher'},{key:'isbn',label:'ISBN'},{key:'year',label:'Year'},{key:'authors',label:'Authors'}];
const AWARDS_COLS            = [{key:'awardName',label:'Award Name'},{key:'organization',label:'Organization'},{key:'year',label:'Year'},{key:'description',label:'Description'}];
const INDUSTRY_COLS          = [{key:'organization',label:'Organization'},{key:'type',label:'Type'},{key:'duration',label:'Duration'},{key:'outcome',label:'Outcome'}];
const ACADEMIC_EXPOSURE_COLS = [{key:'program',label:'Program'},{key:'institution',label:'Institution'},{key:'country',label:'Country'},{key:'year',label:'Year'}];
const EVENTS_ORG_COLS        = [{key:'eventName',label:'Event Name'},{key:'role',label:'Role'},{key:'location',label:'Location'},{key:'date',label:'Date'}];
const EVENTS_ATT_COLS        = [{key:'eventName',label:'Event Name'},{key:'role',label:'Role'},{key:'location',label:'Location'},{key:'date',label:'Date'}];
const AFFILIATIONS_COLS      = [{key:'organizationName',label:'Organization'},{key:'membershipType',label:'Membership Type'},{key:'duration',label:'Duration'}];
const INVITATIONS_COLS       = [{key:'eventName',label:'Event Name'},{key:'role',label:'Role'},{key:'organization',label:'Organization'},{key:'date',label:'Date'}];
const ACADEMIC_VISIT_COLS    = [{key:'institution',label:'Institution'},{key:'purpose',label:'Purpose'},{key:'duration',label:'Duration'},{key:'outcome',label:'Outcome'}];
const OUTREACH_COLS          = [{key:'activityName',label:'Activity Name'},{key:'description',label:'Description'},{key:'location',label:'Location'},{key:'date',label:'Date'}];
const RESEARCH_PROFILE_FIELDS= [{key:'scopusLink',label:'Scopus'},{key:'vidwanLink',label:'Vidwan'},{key:'googleScholarLink',label:'Google Scholar'},{key:'orcid',label:'ORCID'},{key:'hIndex',label:'h-index'}];

/* ── SVG ring ── */
const RING_R = 23;
const RING_C = 2 * Math.PI * RING_R;

function CompletionRing({ pct, color }) {
  const offset = RING_C * (1 - pct / 100);
  return (
    <div className={styles.completionRing}>
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
        <circle className={styles.completionRingBg} cx="28" cy="28" r={RING_R} />
        <circle
          className={styles.completionRingFill}
          cx="28" cy="28" r={RING_R}
          stroke={color}
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.completionRingText}>{pct}%</div>
    </div>
  );
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { submissions, profileSections, approvedProfile, profileStatus } = useData();
  const navigate = useNavigate();

  const userId = user?._id || user?.id;

  // Dashboard shows only approved data — draft/pending changes are not displayed
  const displayProfile = approvedProfile || EMPTY_PROFILE;

  const mySubs = useMemo(
    () => submissions.filter(s => s.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [submissions, userId]
  );

  const counts = useMemo(() => ({
    Draft:    mySubs.filter(s => s.status === 'Draft').length,
    Pending:  mySubs.filter(s => s.status === 'Pending').length,
    Approved: mySubs.filter(s => s.status === 'Approved').length,
    Rejected: mySubs.filter(s => s.status === 'Rejected').length,
  }), [mySubs]);

  const rejected    = useMemo(() => mySubs.filter(s => s.status === 'Rejected'), [mySubs]);
  const drafts      = useMemo(() => mySubs.filter(s => s.status === 'Draft'),    [mySubs]);
  const recent      = useMemo(() => mySubs.slice(0, 5), [mySubs]);
  const completion  = useMemo(() => calcCompletion(displayProfile, user), [displayProfile, user]);
  const { pct, color: pctColor, hint, filled, total } = completion;
  const needsAction = rejected.length + drafts.length;

  return (
    <div className={styles.root}>

      {/* ══ HERO PROFILE CARD ══ */}
      <div className={styles.hero}>
        <div className={styles.heroBanner}>
          <div className={styles.heroBannerPattern} />
          <div className={styles.heroStatusRow}>
            {Object.entries(STATUS_CFG).map(([status, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button key={status} className={styles.statusPill}
                  style={{ borderColor: cfg.border }}
                  onClick={() => navigate('/submissions')}
                >
                  <Icon size={13} color={cfg.color} />
                  <span className={styles.statusCount} style={{ color: cfg.color }}>{counts[status]}</span>
                  <span className={styles.statusLabel}>{status}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className={styles.heroBody}>
          <div className={styles.heroAvatarWrap}>
            <Avatar name={user?.name} avatar={user?.avatar} size={148} />
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.heroName}>{user?.name}</h1>
            {user?.designation && <p className={styles.heroDesig}>{user.designation}</p>}
            <p className={styles.heroDept}>{user?.department} Department</p>
            <div className={styles.heroMeta}>
              <div className={styles.completionWrap}>
                <CompletionRing pct={pct} color={pctColor} />
                <div className={styles.completionInfo}>
                  <div className={styles.completionLabel} style={{ color: pctColor }}>
                    Profile Complete
                  </div>
                  <div className={styles.completionTrack}>
                    <div className={styles.completionFill} style={{ width: `${pct}%`, background: pctColor }} />
                  </div>
                  <div className={styles.completionHint}>
                    {hint} · {filled}/{total} sections filled
                  </div>
                </div>
                <Badge status={profileStatus}>{profileStatus}</Badge>
              </div>
            </div>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/profile')}>
              <Edit3 size={14} /> Edit Profile
            </button>
            <button className={styles.btnOutline} onClick={() => navigate('/submissions')}>
              <Eye size={14} /> View Submissions
            </button>
          </div>
        </div>
      </div>

      {/* ══ ACTIVITY + ATTENTION ══ */}
      <div className={styles.panels}>

        {/* Recent Activity */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <Activity size={15} className={styles.panelIcon} />
            <span className={styles.panelTitle}>Recent Activity</span>
            <button className={styles.panelLink} onClick={() => navigate('/submissions')}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          {recent.length === 0 ? (
            <div className={styles.empty}>
              <FileText size={24} color="#CBD5E1" />
              <span>No activity yet — edit your profile or create a submission.</span>
            </div>
          ) : (
            <div className={styles.actList}>
              {recent.map(sub => {
                const cfg  = STATUS_CFG[sub.status] || STATUS_CFG.Draft;
                const Icon = TYPE_ICON[sub.type] || FileText;
                return (
                  <div key={sub.id} className={styles.actItem}>
                    <div className={styles.actIconWrap} style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <Icon size={13} color={cfg.color} />
                    </div>
                    <div className={styles.actBody}>
                      <p className={styles.actTitle}>{sub.title}</p>
                      <div className={styles.actMeta}>
                        <span>{sub.type}</span>
                        <span className={styles.dot} />
                        <span>{timeAgo(sub.date)}</span>
                      </div>
                    </div>
                    <Badge status={sub.status}>{sub.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attention Required */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <AlertTriangle size={15} className={styles.panelIconWarn} />
            <span className={styles.panelTitle}>Attention Required</span>
            {needsAction > 0 && <span className={styles.warnBadge}>{needsAction}</span>}
          </div>
          {needsAction === 0 ? (
            <div className={styles.empty}>
              <CheckCircle size={24} color="#BBF7D0" />
              <span>All clear — no pending actions.</span>
            </div>
          ) : (
            <div className={styles.attList}>
              {rejected.map(sub => (
                <div key={sub.id} className={styles.attItem} style={{ borderLeftColor: '#DC2626' }}>
                  <div className={styles.attTop}>
                    <XCircle size={13} color="#DC2626" />
                    <span className={styles.attTag} style={{ color: '#DC2626', background: '#FEF2F2' }}>Rejected</span>
                    <span className={styles.attDate}>{timeAgo(sub.date)}</span>
                  </div>
                  <p className={styles.attTitle}>{sub.title}</p>
                  {sub.comments?.length > 0 && (
                    <p className={styles.attComment}>"{sub.comments[sub.comments.length - 1]}"</p>
                  )}
                  <button className={styles.attBtn} onClick={() => navigate('/profile')}>
                    <RotateCcw size={11} /> Revise & Resubmit
                  </button>
                </div>
              ))}
              {drafts.map(sub => (
                <div key={sub.id} className={styles.attItem} style={{ borderLeftColor: '#D97706' }}>
                  <div className={styles.attTop}>
                    <FileText size={13} color="#D97706" />
                    <span className={styles.attTag} style={{ color: '#D97706', background: '#FFFBEB' }}>Draft</span>
                    <span className={styles.attDate}>{timeAgo(sub.date)}</span>
                  </div>
                  <p className={styles.attTitle}>{sub.title}</p>
                  <button className={styles.attBtn}
                    style={{ color: '#D97706', borderColor: '#FDE68A', background: '#FFFBEB' }}
                    onClick={() => navigate('/submissions')}>
                    <Send size={11} /> Submit Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ══ PROFILE SECTIONS ══ */}
      <div className={styles.profileSections}>
        {profileStatus === 'Pending' && (
          <div style={{ padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#92400E' }}>
            ⏳ Your profile update is <strong>pending HOD approval</strong>. The sections below show your last approved data.
          </div>
        )}
        {profileStatus === 'Draft' && (
          <div style={{ padding: '12px 16px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#475569' }}>
            📝 Your profile is in <strong>Draft</strong> state. Submit for HOD approval to display your data here.
          </div>
        )}
        {!approvedProfile && profileStatus === 'Approved' && (
          <div style={{ padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#15803D' }}>
            ✅ Profile approved — data is displayed below.
          </div>
        )}
        <TableSection title="Education" icon={GraduationCap} color="#1E3A8A" columns={EDUCATION_COLS} entries={displayProfile.education} />
        <TableSection title="Post Doctoral Experience" icon={FlaskConical} color="#7C3AED" columns={POST_DOCTORAL_COLS} entries={displayProfile.postDoctoral} />
        <TextSection title="Research Interest" icon={Target} color="#059669" value={displayProfile.researchInterest} />
        <KeyValueSection title="Research Profile" icon={Link} color="#D97706" fields={RESEARCH_PROFILE_FIELDS} value={displayProfile.researchProfile} />
        <TextSection title="Research Details" icon={FileText2} color="#0891B2" value={displayProfile.researchDetails} />
        <TableSection title="Consultancy Projects" icon={Briefcase} color="#B45309" columns={CONSULTANCY_COLS} entries={displayProfile.consultancyProjects} />
        <TableSection title="Funded Projects" icon={FolderOpen} color="#DC2626" columns={FUNDED_COLS} entries={displayProfile.fundedProjects} />
        <TableSection title="Patents" icon={Lightbulb} color="#4F46E5" columns={PATENTS_COLS} entries={displayProfile.patents} />
        <TableSection title="Books / Chapters Published" icon={BookOpen} color="#0D9488" columns={BOOKS_COLS} entries={displayProfile.booksChapters} />
        <TableSection title="Awards & Recognition" icon={Award} color="#EA580C" columns={AWARDS_COLS} entries={displayProfile.awardsRecognition} />
        <TableSection title="Industry Collaboration" icon={Building2} color="#2563EB" columns={INDUSTRY_COLS} entries={displayProfile.industryCollaboration} />
        <TableSection title="Academic Exposure" icon={Globe} color="#7C3AED" columns={ACADEMIC_EXPOSURE_COLS} entries={displayProfile.academicExposure} />
        <TableSection title="Events Organised" icon={Calendar} color="#059669" columns={EVENTS_ORG_COLS} entries={displayProfile.eventsOrganised} />
        <TableSection title="Events Attended" icon={Users} color="#0891B2" columns={EVENTS_ATT_COLS} entries={displayProfile.eventsAttended} />
        <TableSection title="Professional Affiliations" icon={Users} color="#4F46E5" columns={AFFILIATIONS_COLS} entries={displayProfile.professionalAffiliations} />
        <TableSection title="Invitations" icon={Calendar} color="#DC2626" columns={INVITATIONS_COLS} entries={displayProfile.invitations} />
        <TableSection title="Academic Visit" icon={Globe} color="#B45309" columns={ACADEMIC_VISIT_COLS} entries={displayProfile.academicVisit} />
        <TableSection title="Outreach Activities" icon={Activity} color="#0D9488" columns={OUTREACH_COLS} entries={displayProfile.outreachActivities} />
        <TextSection title="Other Information" icon={Info} color="#6366F1" value={displayProfile.otherInfo} />
      </div>
      
    </div>
  );
}
