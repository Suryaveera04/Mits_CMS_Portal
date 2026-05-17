// src/pages/Admin/ContentStudio.jsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useData } from '../../context/DataContext';
import {
  Badge, Button, EmptyState, PageHeader, useToast,
} from '../../components/common/UI';
import {
  Plus, Calendar, Handshake, Search, Pencil, Trash2,
  Play, Newspaper, TrendingUp, ExternalLink,
  Tag, Eye, X, Globe, AlertTriangle, MapPin, Building,
  Award, FileText, BookOpen, Briefcase, Code, ClipboardList,
} from 'lucide-react';
import styles from './ContentStudio.module.css';
import SubjectsCurriculum from './SubjectsCurriculum';

const TABS = ['Events', 'MoUs', 'News', 'Trending', 'Achievements', 'Patents', 'Publications', 'Placements', 'Projects', 'Subjects'];

const TAB_META = {
  Events:   { icon: Calendar,   color: '#DB2777', bg: '#FDF2F8', type: 'Event'    },
  MoUs:     { icon: Handshake,  color: '#0891B2', bg: '#ECFEFF', type: 'MoU'      },
  News:     { icon: Newspaper,  color: '#0F766E', bg: '#F0FDFA', type: 'News'     },
  Trending: { icon: TrendingUp, color: '#7C3AED', bg: '#F5F3FF', type: 'Trending' },
  Achievements: { icon: Award,      color: '#0EA5A4', bg: '#ECFEFF', type: 'Achievement' },
  Patents:      { icon: FileText,   color: '#7C3AED', bg: '#F5F3FF', type: 'Patent'      },
  Publications: { icon: BookOpen,   color: '#1E40AF', bg: '#EEF2FF', type: 'Publication' },
  Placements:   { icon: Briefcase,  color: '#DC2626', bg: '#FFEDEE', type: 'Placement'   },
  Projects:     { icon: Code,       color: '#2563EB', bg: '#EFF6FF', type: 'Project'     },
  Subjects:     { icon: ClipboardList, color: '#065F46', bg: '#ECFDF5', type: 'Subject'   },
};

const STATUS_STYLE = {
  Published: { color: '#15803D', bg: '#DCFCE7', dot: '#22C55E' },
  Approved:  { color: '#15803D', bg: '#DCFCE7', dot: '#22C55E' },
  Draft:     { color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' },
  Pending:   { color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Draft;
  return (
    <span className={styles.statusPill} style={{ background: s.bg, color: s.color }}>
      <span className={styles.statusDot} style={{ background: s.dot }} />
      {status}
    </span>
  );
}

/* ── View Modal ── */
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

function InfoSection({ title, children }) {
  return (
    <div className={styles.infoSection}>
      <div className={styles.infoSectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function EventPreview({ item }) {
  return (
    <>
      {item.poster && (
        <div className={styles.viewImgWrap}>
          <img src={item.poster} alt={item.title} className={styles.viewImg} />
        </div>
      )}
      {!item.poster && item.images?.[0]?.url && (
        <div className={styles.viewImgWrap}>
          <img src={item.images[0].url} alt={item.title} className={styles.viewImg} />
        </div>
      )}
      <h1 className={styles.viewTitle}>{item.title}</h1>
      <div className={styles.viewMeta}>
        {item.eventType  && <span><Tag size={13} /> {item.eventType}</span>}
        {item.fromDate   && <span><Calendar size={13} /> {item.fromDate}{item.toDate ? ` → ${item.toDate}` : ''}</span>}
        {item.mode       && <span><Globe size={13} /> {item.mode}</span>}
        {item.venue      && <span><MapPin size={13} /> {item.venue}</span>}
        {item.department && <span><Building size={13} /> {item.department}</span>}
      </div>

      <InfoSection title="Event Details">
        <InfoRow label="Event ID"         value={item.eventId} />
        <InfoRow label="Duration"         value={item.duration} />
        <InfoRow label="Address"          value={item.address} />
        <InfoRow label="Collaboration"    value={item.collaborationDept} />
        <InfoRow label="Registration"     value={item.registrationLink} />
      </InfoSection>

      {item.description && (
        <InfoSection title="Description">
          <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.description }} />
        </InfoSection>
      )}

      {item.resourcePersons?.length > 0 && (
        <InfoSection title={`Resource Persons (${item.resourcePersons.length})`}>
          {item.resourcePersons.map((rp, i) => (
            <div key={i} className={styles.personCard}>
              <div className={styles.personName}>{rp.name}</div>
              <div className={styles.personMeta}>
                {rp.designation && <span>{rp.designation}</span>}
                {rp.institute   && <span>{rp.institute}</span>}
                {rp.experience  && <span>{rp.experience} yrs exp</span>}
              </div>
            </div>
          ))}
        </InfoSection>
      )}

      {(item.participantTypes?.length > 0 || item.totalRegistered) && (
        <InfoSection title="Participants">
          {item.participantTypes?.length > 0 && (
            <InfoRow label="Types" value={item.participantTypes.join(', ')} />
          )}
          <InfoRow label="Registered" value={item.totalRegistered} />
          <InfoRow label="Attended"   value={item.totalAttended} />
          {item.gradLevels?.length > 0 && <InfoRow label="Level" value={item.gradLevels.join(', ')} />}
          {item.studentYears?.length > 0 && <InfoRow label="Years" value={item.studentYears.join(', ')} />}
        </InfoSection>
      )}

      {item.outcome && (
        <InfoSection title="Outcome / Summary">
          <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.outcome }} />
        </InfoSection>
      )}

      {item.coordinators?.length > 0 && (
        <InfoSection title={`Coordinators (${item.coordinators.length})`}>
          {item.coordinators.map((c, i) => (
            <div key={i} className={styles.personCard}>
              <div className={styles.personName}>{c.name}</div>
              <div className={styles.personMeta}>
                {c.email   && <span>{c.email}</span>}
                {c.contact && <span>{c.contact}</span>}
              </div>
            </div>
          ))}
        </InfoSection>
      )}

      {(item.approvedBudget || item.expenditure || item.sponsorOrg) && (
        <InfoSection title="Budget & Sponsorship">
          <InfoRow label="Approved Budget" value={item.approvedBudget ? `₹${item.approvedBudget}` : null} />
          <InfoRow label="Expenditure"     value={item.expenditure    ? `₹${item.expenditure}`    : null} />
          <InfoRow label="Sponsor Org"     value={item.sponsorOrg} />
          <InfoRow label="Sponsor Amount"  value={item.sponsorAmount  ? `₹${item.sponsorAmount}`  : null} />
        </InfoSection>
      )}

      {item.feedbackLink && (
        <InfoSection title="Feedback">
          <a href={item.feedbackLink} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
            <ExternalLink size={13} /> Feedback Form
          </a>
        </InfoSection>
      )}

      {item.geoPhotos?.length > 0 && (
        <InfoSection title={`Geo-tagged Photos (${item.geoPhotos.length})`}>
          <div className={styles.viewGalleryGrid}>
            {item.geoPhotos.map((img, i) => (
              <img key={i} src={img.url} alt="" className={styles.viewGalleryImg} />
            ))}
          </div>
        </InfoSection>
      )}

      {item.images?.length > 0 && (
        <InfoSection title={`Gallery (${item.images.length})`}>
          <div className={styles.viewGalleryGrid}>
            {item.images.map((img, i) => (
              <img key={i} src={img.url} alt="" className={styles.viewGalleryImg} />
            ))}
          </div>
        </InfoSection>
      )}

      {item.tags?.length > 0 && (
        <div className={styles.viewTags}>
          {item.tags.map(t => <span key={t} className={styles.viewTag}><Tag size={11} />{t}</span>)}
        </div>
      )}
    </>
  );
}

function MoUPreview({ item }) {
  return (
    <>
      {item.signingImages?.[0]?.url && (
        <div className={styles.viewImgWrap}>
          <img src={item.signingImages[0].url} alt={item.title} className={styles.viewImg} />
        </div>
      )}
      <h1 className={styles.viewTitle}>{item.title}</h1>
      <div className={styles.viewMeta}>
        {item.partnerOrg && <span><Handshake size={13} /> {item.partnerOrg}</span>}
        {item.country    && <span><Globe size={13} /> {item.country}</span>}
        {item.orgType    && <span><Building size={13} /> {item.orgType}</span>}
        {item.startDate  && <span><Calendar size={13} /> {item.startDate}{item.endDate ? ` → ${item.endDate}` : ''}</span>}
      </div>

      <InfoSection title="MoU Details">
        <InfoRow label="MoU ID"       value={item.mouId} />
        <InfoRow label="Category"     value={item.mouCategory} />
        <InfoRow label="Duration"     value={item.duration} />
        <InfoRow label="Renewal"      value={item.renewalOption} />
        <InfoRow label="Department"   value={item.department} />
      </InfoSection>

      {item.purpose && (
        <InfoSection title="Purpose">
          <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.purpose }} />
        </InfoSection>
      )}
      {item.scope && (
        <InfoSection title="Scope">
          <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.scope }} />
        </InfoSection>
      )}
      {item.objectives && (
        <InfoSection title="Objectives">
          <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.objectives }} />
        </InfoSection>
      )}

      {item.collabAreas?.length > 0 && (
        <InfoSection title="Areas of Collaboration">
          <div className={styles.tagList}>
            {item.collabAreas.map(a => <span key={a} className={styles.viewTag}>{a}</span>)}
          </div>
        </InfoSection>
      )}

      {(item.studentBenefits || item.facultyBenefits || item.expectedOutcomes) && (
        <InfoSection title="Benefits & Outcomes">
          {item.studentBenefits && (
            <><div className={styles.subLabel}>Students</div>
            <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.studentBenefits }} /></>)}
          {item.facultyBenefits && (
            <><div className={styles.subLabel}>Faculty</div>
            <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.facultyBenefits }} /></>)}
          {item.expectedOutcomes && (
            <><div className={styles.subLabel}>Expected Outcomes</div>
            <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.expectedOutcomes }} /></>)}
        </InfoSection>
      )}

      {(item.internalCoordinators?.length > 0 || item.externalCoordinators?.length > 0) && (
        <InfoSection title="Coordinators">
          {item.internalCoordinators?.map((c, i) => (
            <div key={i} className={styles.personCard}>
              <div className={styles.personName}>{c.name} <span className={styles.coordType}>Internal</span></div>
              <div className={styles.personMeta}>{c.email && <span>{c.email}</span>}{c.contact && <span>{c.contact}</span>}</div>
            </div>
          ))}
          {item.externalCoordinators?.map((c, i) => (
            <div key={i} className={styles.personCard}>
              <div className={styles.personName}>{c.name} <span className={styles.coordType}>External</span></div>
              <div className={styles.personMeta}>{c.designation && <span>{c.designation}</span>}{c.email && <span>{c.email}</span>}</div>
            </div>
          ))}
        </InfoSection>
      )}

      {(item.activitiesConducted || item.studentsBenefited || item.internshipsProvided || item.jointEvents) && (
        <InfoSection title="Implementation Tracking">
          <InfoRow label="Activities Conducted"  value={item.activitiesConducted} />
          <InfoRow label="Students Benefited"    value={item.studentsBenefited} />
          <InfoRow label="Internships Provided"  value={item.internshipsProvided} />
          <InfoRow label="Joint Events"          value={item.jointEvents} />
        </InfoSection>
      )}

      {item.signingImages?.length > 0 && (
        <InfoSection title={`Signing Images (${item.signingImages.length})`}>
          <div className={styles.viewGalleryGrid}>
            {item.signingImages.map((img, i) => (
              <img key={i} src={img.url} alt="" className={styles.viewGalleryImg} />
            ))}
          </div>
        </InfoSection>
      )}
    </>
  );
}

function NewsPreview({ item }) {
  return (
    <>
      {item.coverImage && (
        <div className={styles.viewImgWrap}>
          <img src={item.coverImage} alt={item.title} className={styles.viewImg} />
        </div>
      )}
      <h1 className={styles.viewTitle}>{item.title}</h1>
      <div className={styles.viewMeta}>
        {item.category   && <span><Tag size={13} /> {item.category}</span>}
        {item.date       && <span><Calendar size={13} /> {item.date}</span>}
        {item.department && <span><Building size={13} /> {item.department}</span>}
        {item.featured === 'Yes' && <span style={{color:'#D97706',fontWeight:700}}>⭐ Featured</span>}
      </div>

      {item.summary && (
        <InfoSection title="Summary">
          <p className={styles.summaryText}>{item.summary}</p>
        </InfoSection>
      )}

      {item.fullContent && (
        <InfoSection title="Full Article">
          <div className={styles.richText} dangerouslySetInnerHTML={{ __html: item.fullContent }} />
        </InfoSection>
      )}

      {item.tags?.length > 0 && (
        <div className={styles.viewTags}>
          {item.tags.map(t => <span key={t} className={styles.viewTag}><Tag size={11} />{t}</span>)}
        </div>
      )}

      {item.gallery?.length > 0 && (
        <InfoSection title={`Gallery (${item.gallery.length})`}>
          <div className={styles.viewGalleryGrid}>
            {item.gallery.map((img, i) => (
              <img key={i} src={img.url} alt="" className={styles.viewGalleryImg} />
            ))}
          </div>
        </InfoSection>
      )}
    </>
  );
}

function TrendingPreview({ item }) {
  return (
    <div className={styles.viewTrendingWrap}>
      <div className={styles.viewTrendingCard}>
        {item.coverImage
          ? <img src={item.coverImage} alt={item.title} className={styles.viewTrendingImg} />
          : <div className={styles.viewTrendingPlaceholder}><Play size={48} color="white" /></div>}
        <div className={styles.viewTrendingOverlay}><Play size={40} color="white" /></div>
        <div className={styles.viewTrendingInfo}>
          <h2>{item.title}</h2>
          {item.date && <p>{item.date}</p>}
        </div>
      </div>
      {item.reelUrl && (
        <a href={item.reelUrl} target="_blank" rel="noopener noreferrer" className={styles.viewReelBtn}>
          <ExternalLink size={15} /> Open Reel
        </a>
      )}
    </div>
  );
}

function ViewModal({ item, onClose, onEdit }) {
  if (!item) return null;
  const tabKey = { Event: 'Events', MoU: 'MoUs', News: 'News', Trending: 'Trending' }[item.type];
  const meta = TAB_META[tabKey] || TAB_META.Events;

  return (
    <div className={styles.viewBackdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.viewModal}>
        <div className={styles.viewHeader}>
          <div className={styles.viewHeaderLeft}>
            <span className={styles.viewTypePill} style={{ background: meta.bg, color: meta.color }}>
              <meta.icon size={12} /> {item.type}
            </span>
            <StatusPill status={item.status} />
          </div>
          <div className={styles.viewHeaderRight}>
            <button className={styles.viewActionBtn} onClick={() => { onClose(); onEdit(item); }} title="Edit">
              <Pencil size={14} />
            </button>
            <button className={styles.viewClose} onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className={styles.viewBody}>
          {item.type === 'Event'    && <EventPreview    item={item} />}
          {item.type === 'MoU'      && <MoUPreview      item={item} />}
          {item.type === 'News'     && <NewsPreview      item={item} />}
          {item.type === 'Trending' && <TrendingPreview  item={item} />}
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm ── */
function DeleteConfirm({ item, onConfirm, onCancel }) {
  return (
    <div className={styles.confirmOverlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.confirmBox}>
        <div className={styles.confirmIcon}><AlertTriangle size={26} color="#DC2626" /></div>
        <h3 className={styles.confirmTitle}>Delete this item?</h3>
        <p className={styles.confirmSub}>
          <strong>"{item.title}"</strong> will be permanently removed. This cannot be undone.
        </p>
        <div className={styles.confirmActions}>
          <button className={styles.confirmCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.confirmDelete} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Content Card ── */
function ContentCard({ item, onEdit, onDelete, onView, tabMeta }) {
  const isTrending  = item.type === 'Trending';
  const isPublished = item.status === 'Published' || item.status === 'Approved';

  return (
    <div className={`${styles.contentCard} ${isPublished ? styles.contentCardPublished : ''}`}>
      <div
        className={`${styles.cardThumb} ${isTrending ? styles.cardThumbTrending : ''}`}
        onClick={() => onView(item)}
      >
        {item.images?.[0]?.url ? (
          <img src={item.images[0].url} alt="" className={styles.cardThumbImg} />
        ) : item.coverImage ? (
          <img src={item.coverImage} alt="" className={styles.cardThumbImg} style={{ objectPosition: 'top' }} />
        ) : (
          <div className={styles.cardThumbPlaceholder} style={{ background: tabMeta.bg }}>
            <tabMeta.icon size={32} color={tabMeta.color} style={{ opacity: 0.5 }} />
          </div>
        )}
        <div className={styles.cardThumbOverlay}>
          <button className={styles.cardViewBtn}><Eye size={14} /> Preview</button>
        </div>
        {isPublished && <div className={styles.cardPublishedStripe} />}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTopRow}>
          <StatusPill status={item.status} />
          {item.date && <span className={styles.cardDate}><Calendar size={11} />{item.date}</span>}
        </div>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        {item.organization && (
          <div className={styles.cardOrg}><Handshake size={11} />{item.organization}{item.duration ? ` · ${item.duration}` : ''}</div>
        )}
        {item.reelUrl && (
          <a href={item.reelUrl} target="_blank" rel="noopener noreferrer" className={styles.cardReelLink}>
            <ExternalLink size={11} /> View Reel
          </a>
        )}
        {item.tags?.length > 0 && (
          <div className={styles.cardTags}>
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className={styles.tagPill}><Tag size={9} />{t}</span>
            ))}
            {item.tags.length > 3 && <span className={styles.tagMore}>+{item.tags.length - 3}</span>}
          </div>
        )}
        <div className={styles.cardActions}>
          <button className={styles.cardActionBtn} onClick={() => onView(item)} title="Preview">
            <Eye size={14} />
          </button>
          <button className={`${styles.cardActionBtn} ${styles.cardActionEdit}`} onClick={() => onEdit(item)} title="Edit">
            <Pencil size={14} />
          </button>
          <button className={`${styles.cardActionBtn} ${styles.cardActionDelete}`} onClick={() => onDelete(item)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function ContentStudio() {
  const { user } = useAuth();
  const {
    events, deleteEvent,
    trending, deleteTrending,
    achievements, deleteAchievement,
    patents, deletePatent,
    publications, deletePublication,
    placements, deletePlacement,
    projects, deleteProject,
    subjects, deleteSubject,
    faculty,
  } = useData();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab,    setActiveTab]    = useState('Events');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter,   setDeptFilter]   = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewItem,     setViewItem]     = useState(null);

  const isAdmin       = user?.role === 'ADMIN';
  const isTrendingTab = activeTab === 'Trending';
  const tabMeta       = TAB_META[activeTab] || TAB_META.Events;

  const departments = useMemo(
    () => ['All', ...new Set(faculty.map(f => f.department).filter(Boolean))],
    [faculty]
  );

  const allItems = useMemo(() => {
    switch (activeTab) {
      case 'Trending':
        return trending.filter(t => isAdmin || t.department === user?.department);
      case 'Events': case 'MoUs': case 'News':
        return events.filter(e => e.type === tabMeta.type);
      case 'Achievements':
        return achievements.filter(a => isAdmin || a.department === user?.department);
      case 'Patents':
        return patents.filter(p => isAdmin || p.department === user?.department);
      case 'Publications':
        return publications.filter(p => isAdmin || p.department === user?.department);
      case 'Placements':
        return placements.filter(p => isAdmin || p.department === user?.department);
      case 'Projects':
        return projects.filter(p => isAdmin || p.department === user?.department);
      case 'Subjects':
        return subjects.filter(s => isAdmin || s.department === user?.department);
      default:
        return [];
    }
  }, [activeTab, events, trending, achievements, patents, publications, placements, projects, subjects, isAdmin, user?.department]);

  const items = useMemo(() => allItems.filter(item =>
    (statusFilter === 'All' || item.status === statusFilter) &&
    (deptFilter   === 'All' || item.department === deptFilter) &&
    (!search || item.title?.toLowerCase().includes(search.toLowerCase()) ||
                item.organization?.toLowerCase().includes(search.toLowerCase()))
  ), [allItems, statusFilter, deptFilter, search]);

  const tabCounts = useMemo(() => ({
    Events:       events.filter(e => e.type === 'Event').length,
    MoUs:         events.filter(e => e.type === 'MoU').length,
    News:         events.filter(e => e.type === 'News').length,
    Trending:     trending.length,
    Achievements: achievements.length,
    Patents:      patents.length,
    Publications: publications.length,
    Placements:   placements.length,
    Projects:     projects.length,
    Subjects:     subjects.length,
  }), [events, trending, achievements, patents, publications, placements, projects, subjects]);

  const handleEdit = (item) => {
    const type = item.type;
    const id   = item._id || item.id;
    navigate(`/content/edit?type=${type}&id=${id}`);
  };

  const handleNew = () => {
    navigate(`/content/edit?type=${tabMeta.type}`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id || deleteTarget.id;
    switch (activeTab) {
      case 'Trending': deleteTrending(id); break;
      case 'Events': case 'MoUs': case 'News': deleteEvent(id); break;
      case 'Achievements': deleteAchievement(id); break;
      case 'Patents': deletePatent(id); break;
      case 'Publications': deletePublication(id); break;
      case 'Placements': deletePlacement(id); break;
      case 'Projects': deleteProject(id); break;
      case 'Subjects': deleteSubject(id); break;
      default: break;
    }
    if (viewItem && (viewItem._id || viewItem.id) === id) setViewItem(null);
    setDeleteTarget(null);
    toast('Item deleted', 'warning');
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearch('');
    setStatusFilter('All');
    setDeptFilter('All');
  };

  const newLabel = activeTab === 'MoUs' ? 'New MoU' : `New ${activeTab.replace(/s$/, '')}`;

  return (
    <div className={styles.root}>
      <PageHeader
        title="Content Studio"
        subtitle="View and manage events, MoUs, news and trending content"
        actions={
          <Button icon={Plus} onClick={handleNew}>{newLabel}</Button>
        }
      />

      {/* TABS */}
      <div className={styles.tabsWrap}>
        <div className={styles.tabs}>
          {TABS.map(tab => {
            const m = TAB_META[tab];
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                className={`${styles.tabBtn} ${active ? styles.tabBtnActive : ''}`}
                style={active ? { '--tc': m.color, '--tb': m.bg } : {}}
                onClick={() => switchTab(tab)}
              >
                <m.icon size={15} />
                <span>{tab}</span>
                <span className={styles.tabCount} style={active ? { background: m.bg, color: m.color } : {}}>
                  {tabCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={14} color="var(--gray-400)" />
            <input
              placeholder={`Search ${activeTab}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}><X size={12} /></button>
            )}
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Approved">Approved</option>
            <option value="Draft">Draft</option>
          </select>
          {isAdmin && (
            <select className={styles.filterSelect} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* STATS BAR */}
      <div className={styles.statsBar}>
        <span className={styles.statsBarCount}>
          <span style={{ color: tabMeta.color, fontWeight: 800 }}>{items.length}</span>
          {' '}of {allItems.length} {activeTab.toLowerCase()}
        </span>
        <span className={styles.statsBarPublished}>
          <span className={styles.statsDot} style={{ background: '#22C55E' }} />
          {allItems.filter(i => i.status === 'Published' || i.status === 'Approved').length} published
        </span>
        <span className={styles.statsBarDraft}>
          <span className={styles.statsDot} style={{ background: '#94A3B8' }} />
          {allItems.filter(i => i.status === 'Draft').length} drafts
        </span>
      </div>

      {/* GRID */}
      {activeTab === 'Subjects' ? (
        <div>
          <SubjectsCurriculum department={isAdmin ? null : user?.department} />
        </div>
      ) : (items.length === 0 ? (
        <div className={styles.emptyWrap}>
          <EmptyState
            icon={tabMeta.icon}
            title={`No ${activeTab} found`}
            subtitle={search || statusFilter !== 'All' ? 'Try adjusting your filters.' : `Click "${newLabel}" to create your first ${activeTab.toLowerCase().replace(/s$/, '')}.`}
            action={
              !search && statusFilter === 'All' && (
                <Button icon={Plus} onClick={handleNew}>{newLabel}</Button>
              )
            }
          />
        </div>
      ) : (
        <div className={`${styles.grid} ${isTrendingTab ? styles.trendingGrid : ''}`}>
          {items.map(item => (
            <ContentCard
              key={item._id || item.id}
              item={item}
              tabMeta={tabMeta}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onView={setViewItem}
            />
          ))}
        </div>
      ))}

      {/* VIEW MODAL */}
      {viewItem && (
        <ViewModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={(item) => { setViewItem(null); handleEdit(item); }}
        />
      )}

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <DeleteConfirm
          item={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
