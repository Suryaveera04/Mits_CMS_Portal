// src/pages/Admin/ContentEditor.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/common/UI';
import EventReportForm from './EventReportForm';
import MoUReportForm from './MoUReportForm';
import NewsReportForm from './NewsReportForm';
import ContentTrendingForm from './ContentTrendingForm';
import AchievementsForm from './AchievementsForm';
import PatentsForm from './PatentsForm';
import PublicationsForm from './PublicationsForm';
import PlacementsForm from './PlacementsForm';
import StudentProjectsForm from './StudentProjectsForm';
import SubjectsForm from './SubjectsForm';
import { ArrowLeft, Calendar, Handshake, Newspaper, TrendingUp } from 'lucide-react';
import { Award, FileText, BookOpen, Briefcase, Code, ClipboardList } from 'lucide-react';
import styles from './ContentEditor.module.css';

const TYPE_LABELS = {
  Event:    'Event Report',
  MoU:      'MoU Report',
  News:     'News Article',
  Trending: 'Trending Content',
  Achievement: 'Achievement',
  Patent:      'Patent',
  Publication: 'Publication',
  Placement:   'Placement / Training',
  Project:     'Student Project',
  Subject:     'Subject / Syllabus',
};

const TYPE_OPTIONS = [
  { type: 'Event',    icon: Calendar,   color: '#DB2777', bg: '#FDF2F8', desc: 'Workshops, seminars, conferences, FDPs' },
  { type: 'MoU',      icon: Handshake,  color: '#0891B2', bg: '#ECFEFF', desc: 'Industry & academic partnerships' },
  { type: 'News',     icon: Newspaper,  color: '#0F766E', bg: '#F0FDFA', desc: 'Announcements, achievements, highlights' },
  { type: 'Trending', icon: TrendingUp, color: '#7C3AED', bg: '#F5F3FF', desc: 'Instagram reels & YouTube shorts' },
  { type: 'Achievement', icon: Award,     color: '#0EA5A4', bg: '#ECFEFF', desc: 'Student and faculty achievements with supporting documents' },
  { type: 'Patent',      icon: FileText,  color: '#7C3AED', bg: '#F5F3FF', desc: 'Patent records and documents' },
  { type: 'Publication', icon: BookOpen,  color: '#1E40AF', bg: '#EEF2FF', desc: 'Research publications and citations' },
  { type: 'Placement',   icon: Briefcase, color: '#DC2626', bg: '#FFEDEE', desc: 'Placement, internships and training outcomes' },
  { type: 'Project',     icon: Code,      color: '#2563EB', bg: '#EFF6FF', desc: 'Student project showcases and reports' },
  { type: 'Subject',     icon: ClipboardList, color: '#065F46', bg: '#ECFDF5', desc: 'Subjects, syllabus and resources' },
];

function TypePicker({ onSelect }) {
  return (
    <div className={styles.typePicker}>
      <div className={styles.typePill}>Department CMS Studio</div>
      <h2 className={styles.typePickerTitle}>Choose Your Content Format</h2>
      <p className={styles.typePickerSub}>Start from a structured template. Your draft auto-saves locally while you type.</p>
      <div className={styles.typeGrid}>
        {TYPE_OPTIONS.map(({ type, icon: Icon, color, bg, desc }) => (
          <button key={type} className={styles.typeCard} onClick={() => onSelect(type)}>
            <div className={styles.typeCardIcon} style={{ background: bg, color }}>
              <Icon size={28} />
            </div>
            <div className={styles.typeCardLabel}>{TYPE_LABELS[type]}</div>
            <div className={styles.typeCardDesc}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({ type, data }) {
  const meta = TYPE_OPTIONS.find((opt) => opt.type === type);
  const Icon = meta?.icon;

  if (!type) {
    return (
      <aside className={styles.previewPane}>
        <div className={styles.previewHeader}>
          <h3>Live Preview</h3>
          <span>Choose a content type to begin</span>
        </div>
      </aside>
    );
  }

  const title =
    data?.title ||
    data?.programTitle ||
    data?.name ||
    data?.subjectName ||
    `${TYPE_LABELS[type]} title`;

  const status = data?.status || 'Draft';
  const tags = Array.isArray(data?.tags)
    ? data.tags
    : typeof data?.tags === 'string'
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

  const infoValue = (value, fallback = 'Not added yet') => value || fallback;

  const renderPreview = () => {
    if (type === 'Subject') {
      return (
        <div className={styles.subjectPreviewWrap}>
          <div className={styles.subjectPreviewMeta}>
            <span>{data?.regulation || 'Regulation'}</span>
            <span>{data?.semester || 'Semester'}</span>
          </div>
          <table className={styles.subjectPreviewTable}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name of the Subject</th>
                <th>Type</th>
                <th>Credits</th>
                <th>Code</th>
                <th>Faculty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{data?.name || 'Subject Name'}</td>
                <td>{data?.type || '-'}</td>
                <td>{data?.credits || '-'}</td>
                <td>{data?.code || '-'}</td>
                <td>{data?.faculty || '-'}</td>
                <td>{status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (type === 'Trending') {
      return (
        <div className={styles.entryPreviewCard}>
          <div className={styles.trendingPreviewThumb}>
            {data?.coverImage ? (
              <img src={data.coverImage} alt={title} className={styles.trendingPreviewImg} />
            ) : (
              <div className={styles.trendingPreviewPlaceholder}>
                <Icon size={28} color="#fff" />
              </div>
            )}
            <div className={styles.trendingPreviewOverlay}>
              <TrendingUp size={18} color="#fff" />
            </div>
          </div>
          <div className={styles.entryPreviewBody}>
            <div className={styles.entryPreviewTopRow}>
              <span className={styles.entryStatus}>{status}</span>
              <span className={styles.entryDate}>{data?.date || 'No date'}</span>
            </div>
            <h4>{title}</h4>
            <p>{data?.reelUrl ? 'Reel URL linked' : 'No reel URL added yet'}</p>
          </div>
        </div>
      );
    }

    if (type === 'Placement') {
      const isTraining = data?.subtype === 'Training';
      return (
        <div className={styles.entryPreviewCard}>
          <div className={styles.entryPreviewThumb} style={{ background: '#fff1f2' }}>
            <Briefcase size={28} color="#dc2626" />
          </div>
          <div className={styles.entryPreviewBody}>
            <div className={styles.entryPreviewTopRow}>
              <span className={styles.entryStatus}>{data?.subtype || 'Placement'}</span>
              <span className={styles.entryDate}>{data?.year || data?.startDate || 'No year'}</span>
            </div>
            <h4>{isTraining ? infoValue(data?.programTitle, 'Training Program') : infoValue(data?.studentName, 'Student Name')}</h4>
            <p>
              {isTraining
                ? `${infoValue(data?.conductedBy)} · ${infoValue(data?.trainingType)}`
                : `${infoValue(data?.companyName)} · ${infoValue(data?.role)}`}
            </p>
            <div className={styles.previewMetaGrid}>
              <span>{isTraining ? infoValue(data?.startDate, 'Start Date') : infoValue(data?.rollNumber, 'Roll No')}</span>
              <span>{isTraining ? infoValue(data?.endDate, 'End Date') : infoValue(data?.placementType, 'Placement Type')}</span>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'Project') {
      const stack = typeof data?.stack === 'string' ? data.stack.split(',').map((s) => s.trim()).filter(Boolean) : [];
      return (
        <div className={styles.entryPreviewCard}>
          <div className={styles.entryPreviewThumb} style={{ background: '#eff6ff' }}>
            <Code size={28} color="#2563eb" />
          </div>
          <div className={styles.entryPreviewBody}>
            <div className={styles.entryPreviewTopRow}>
              <span className={styles.entryStatus}>{status}</span>
              <span className={styles.entryDate}>{data?.academicYear || 'Academic Year'}</span>
            </div>
            <h4>{title}</h4>
            <p>{infoValue(data?.guide)} · {infoValue(data?.github, 'GitHub pending')}</p>
            {stack.length > 0 && (
              <div className={styles.previewTags}>
                {stack.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (type === 'Publication') {
      return (
        <div className={styles.entryPreviewCard}>
          <div className={styles.entryPreviewThumb} style={{ background: '#eff6ff' }}>
            <BookOpen size={28} color="#1d4ed8" />
          </div>
          <div className={styles.entryPreviewBody}>
            <div className={styles.entryPreviewTopRow}>
              <span className={styles.entryStatus}>{status}</span>
              <span className={styles.entryDate}>{data?.year || 'Year'}</span>
            </div>
            <h4>{title}</h4>
            <p>{infoValue(data?.authors)} · {infoValue(data?.venue)}</p>
            <div className={styles.previewMetaGrid}>
              <span>{infoValue(data?.doi, 'DOI pending')}</span>
              <span>{infoValue(data?.citationCount, '0 citations')}</span>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'Patent') {
      return (
        <div className={styles.entryPreviewCard}>
          <div className={styles.entryPreviewThumb} style={{ background: '#f5f3ff' }}>
            <FileText size={28} color="#7c3aed" />
          </div>
          <div className={styles.entryPreviewBody}>
            <div className={styles.entryPreviewTopRow}>
              <span className={styles.entryStatus}>{status}</span>
              <span className={styles.entryDate}>{data?.filingDate || 'Filing date'}</span>
            </div>
            <h4>{title}</h4>
            <p>{infoValue(data?.inventors)} · {infoValue(data?.office)}</p>
            <div className={styles.previewMetaGrid}>
              <span>{infoValue(data?.patentNumber, 'Patent no.')}</span>
              <span>{infoValue(data?.applicationNumber, 'Application no.')}</span>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'Achievement') {
      return (
        <div className={styles.entryPreviewCard}>
          <div className={styles.entryPreviewThumb} style={{ background: '#ecfeff' }}>
            <Award size={28} color="#0ea5a4" />
          </div>
          <div className={styles.entryPreviewBody}>
            <div className={styles.entryPreviewTopRow}>
              <span className={styles.entryStatus}>{status}</span>
              <span className={styles.entryDate}>{data?.date || 'Date'}</span>
            </div>
            <h4>{title}</h4>
            <p>{infoValue(data?.name)} · {infoValue(data?.achievementType)}</p>
            <div className={styles.previewMetaGrid}>
              <span>{infoValue(data?.department, 'Department')}</span>
              <span>{data?.pdf ? 'PDF attached' : 'PDF pending'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'MoU') {
      return (
        <div className={styles.entryPreviewCard}>
          <div className={styles.entryPreviewThumb} style={{ background: '#ecfeff' }}>
            <Handshake size={28} color="#0891b2" />
          </div>
          <div className={styles.entryPreviewBody}>
            <div className={styles.entryPreviewTopRow}>
              <span className={styles.entryStatus}>{status}</span>
              <span className={styles.entryDate}>{data?.startDate || 'Start date'}</span>
            </div>
            <h4>{title}</h4>
            <p>{infoValue(data?.partnerOrg)} · {infoValue(data?.country)}</p>
            <div className={styles.previewMetaGrid}>
              <span>{infoValue(data?.mouCategory, 'Category')}</span>
              <span>{infoValue(data?.duration, 'Duration')}</span>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'News') {
      return (
        <div className={styles.entryPreviewCard}>
          <div className={styles.newsPreviewHero}>
            {data?.coverImage ? (
              <img src={data.coverImage} alt={title} className={styles.newsPreviewImg} />
            ) : (
              <div className={styles.newsPreviewPlaceholder}>
                <Newspaper size={28} color="#fff" />
              </div>
            )}
          </div>
          <div className={styles.entryPreviewBody}>
            <div className={styles.entryPreviewTopRow}>
              <span className={styles.entryStatus}>{status}</span>
              <span className={styles.entryDate}>{data?.date || 'Date'}</span>
            </div>
            <h4>{title}</h4>
            <p>{infoValue(data?.summary, 'Short summary will appear here.')}</p>
            <div className={styles.previewMetaGrid}>
              <span>{infoValue(data?.category, 'Category')}</span>
              <span>{data?.featured === 'Yes' ? 'Featured' : 'Standard'}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.entryPreviewCard}>
        <div className={styles.entryPreviewThumb} style={{ background: meta?.bg || '#f1f5f9' }}>
          {Icon ? <Icon size={26} color={meta?.color || '#334155'} /> : null}
        </div>
        <div className={styles.entryPreviewBody}>
          <div className={styles.entryPreviewTopRow}>
            <span className={styles.entryStatus}>{status}</span>
            <span className={styles.entryDate}>{data?.date || data?.startDate || data?.year || 'No date'}</span>
          </div>
          <h4>{title}</h4>
          {type === 'Event' && <p>{data?.eventType || 'Event'} · {data?.venue || 'Venue pending'}</p>}
          {type === 'Trending' && <p>{data?.reelUrl ? 'Reel linked' : 'No reel URL yet'}</p>}

          {tags.length > 0 && (
            <div className={styles.previewTags}>
              {tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside className={styles.previewPane}>
      <div className={styles.previewHeader}>
        <h3>Live Preview</h3>
        <span>Exactly how it will appear in Content Studio</span>
      </div>

      {renderPreview()}
    </aside>
  );
}

export default function ContentEditor() {
  const { user } = useAuth();
  const { events, trending, addEvent, updateEvent, addTrending, updateTrending } = useData();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const type   = searchParams.get('type');   // Event | MoU | News | Trending | null
  const itemId = searchParams.get('id');     // present when editing

  const [saving, setSaving] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Find existing item if editing
  const existing = itemId && type
    ? (type === 'Trending'
        ? trending.find(t => (t._id || t.id) === itemId)
        : events.find(e => (e._id || e.id) === itemId))
    : null;

  const initial = existing
    ? { ...existing }
    : { type, status: 'Draft', department: user?.department };

  useEffect(() => {
    setPreviewData(initial);
  }, [type, itemId]);

  const handleSave = async (data) => {
    const isDraft = data.status === 'Draft';
    setSaving(isDraft ? 'draft' : 'publish');
    try {
      const finalStatus = isDraft
        ? 'Draft'
        : type === 'Trending' ? 'Published' : 'Approved';

      const saveData = { ...data, status: finalStatus, department: user?.department };

      if (type === 'Trending') {
        if (itemId) await updateTrending(itemId, saveData);
        else        await addTrending(saveData);
      } else {
        if (itemId) await updateEvent(itemId, saveData);
        else        await addEvent(saveData);
      }
      toast(
        itemId
          ? `${TYPE_LABELS[type]} updated successfully`
          : `${TYPE_LABELS[type]} ${isDraft ? 'saved as draft' : 'published successfully'}`,
        isDraft ? 'info' : 'success'
      );
      navigate('/content');
    } catch (e) {
      toast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleClose = () => navigate('/content');

  // No type selected yet — show picker
  if (!type) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handleClose}>
            <ArrowLeft size={16} /> Back to Content Studio
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>New Content</h1>
            <p className={styles.subtitle}>Select a content type to create</p>
          </div>
        </div>
        <TypePicker onSelect={t => setSearchParams({ type: t })} />
      </div>
    );
  }

  const formProps = { initial, onSave: handleSave, onClose: handleClose, saving, onPreviewChange: setPreviewData };

  const resolvedPreviewData = useMemo(() => ({ ...initial, ...previewData, type }), [initial, previewData, type]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => itemId ? handleClose() : setSearchParams({})}>
          <ArrowLeft size={16} /> {itemId ? 'Back to Content Studio' : 'Back'}
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>
            {itemId ? `Edit ${TYPE_LABELS[type]}` : `New ${TYPE_LABELS[type]}`}
          </h1>
          <p className={styles.subtitle}>
            {itemId ? 'Update the details below and submit.' : 'Fill in the details below and submit.'}
          </p>
          <div className={styles.draftNote}>Session mode: unsaved content is not stored and will reset after restart.</div>
        </div>
      </div>

      <div className={styles.editorGrid}>
        <div className={styles.formWrap}>
          {type === 'Event'       && <EventReportForm    {...formProps} />}
          {type === 'MoU'         && <MoUReportForm      {...formProps} />}
          {type === 'News'        && <NewsReportForm      {...formProps} />}
          {type === 'Trending'    && <ContentTrendingForm {...formProps} />}
          {type === 'Achievement' && <AchievementsForm    {...formProps} />}
          {type === 'Patent'      && <PatentsForm         {...formProps} />}
          {type === 'Publication' && <PublicationsForm    {...formProps} />}
          {type === 'Placement'   && <PlacementsForm      {...formProps} />}
          {type === 'Project'     && <StudentProjectsForm {...formProps} />}
          {type === 'Subject'     && <SubjectsForm        {...formProps} />}
        </div>

        <PreviewPanel type={type} data={resolvedPreviewData} />
      </div>
    </div>
  );
}
