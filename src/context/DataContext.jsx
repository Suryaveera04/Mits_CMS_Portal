// src/context/DataContext.jsx
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
  facultyAPI, profileAPI, submissionsAPI,
  eventsAPI, trendingAPI, notificationsAPI,
  achievementsAPI, patentsAPI, publicationsAPI,
  placementsAPI, projectsAPI, subjectsAPI,
  mousAPI, newsAPI,
} from '../services/api';
import { useAuth } from './useAuth';

const DataContext = createContext(null);

// ── Helper: calculate profile diff ──────────────────────────────────────────
function calculateProfileDifferences(oldProfile, newProfile) {
  const differences = { added: {}, modified: {}, deleted: {} };
  const allSections = new Set([
    ...Object.keys(oldProfile || {}),
    ...Object.keys(newProfile || {}),
  ]);

  allSections.forEach((section) => {
    const oldData = oldProfile?.[section];
    const newData = newProfile?.[section];

    if (Array.isArray(oldData) && Array.isArray(newData)) {
      const oldIds = new Set(oldData.map((i) => i._id || i.id));
      const newIds = new Set(newData.map((i) => i._id || i.id));

      const added = newData.filter((i) => !oldIds.has(i._id || i.id));
      if (added.length) differences.added[section] = added;

      const deleted = oldData.filter((i) => !newIds.has(i._id || i.id));
      if (deleted.length) differences.deleted[section] = deleted;

      const modified = [];
      newData.forEach((newItem) => {
        const key = newItem._id || newItem.id;
        if (oldIds.has(key)) {
          const oldItem = oldData.find((i) => (i._id || i.id) === key);
          const changes = {};
          let hasChanges = false;
          Object.keys(newItem).forEach((k) => {
            if (k !== '_id' && k !== 'id' && oldItem[k] !== newItem[k]) {
              changes[k] = { old: oldItem[k], new: newItem[k] };
              hasChanges = true;
            }
          });
          if (hasChanges) modified.push({ id: key, changes });
        }
      });
      if (modified.length) differences.modified[section] = modified;
    } else if (
      typeof oldData === 'object' && typeof newData === 'object' &&
      !Array.isArray(oldData) && !Array.isArray(newData) &&
      oldData !== null && newData !== null
    ) {
      const changes = {};
      let hasChanges = false;
      new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]).forEach((k) => {
        if (oldData?.[k] !== newData?.[k]) {
          changes[k] = { old: oldData?.[k], new: newData?.[k] };
          hasChanges = true;
        }
      });
      if (hasChanges) differences.modified[section] = changes;
    } else if (oldData !== newData) {
      differences.modified[section] = { old: oldData, new: newData };
    }
  });

  return differences;
}

// ── Empty profile shape (used before DB data loads) ──────────────────────────
const EMPTY_PROFILE = {
  status: 'Draft',
  education: [], postDoctoral: [], researchInterest: '',
  researchProfile: {}, researchDetails: '',
  consultancyProjects: [], fundedProjects: [], patents: [],
  booksChapters: [], awardsRecognition: [], industryCollaboration: [],
  academicExposure: [], eventsOrganised: [], eventsAttended: [],
  professionalAffiliations: [], invitations: [], academicVisit: [],
  outreachActivities: [], otherInfo: '',
};

// ── Provider ─────────────────────────────────────────────────────────────────
export function DataProvider({ children }) {
  const { user, updateUser } = useAuth();
  const userId = user?._id || user?.id || null;

  const [faculty,        setFaculty]        = useState([]);
  const [profileSections,setProfileSections]= useState(EMPTY_PROFILE);  // working draft
  const [approvedProfile,setApprovedProfile]= useState(null);           // last HOD-approved snapshot
  const [profileStatus,  setProfileStatus]  = useState('Draft');
  const [submissions,    setSubmissions]    = useState([]);
  const [events,         setEvents]         = useState([]);
  const [trending,       setTrending]       = useState([]);
  const [achievements,   setAchievements]   = useState([]);
  const [patents,        setPatents]        = useState([]);
  const [publications,   setPublications]   = useState([]);
  const [placements,     setPlacements]     = useState([]);
  const [projects,       setProjects]       = useState([]);
  const [subjects,       setSubjects]       = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [lastSubmittedProfile, setLastSubmittedProfile] = useState(null);
  const [loading,        setLoading]        = useState(true);

  // Keep getCurrentUserId for callbacks that need it without closure issues
  const getCurrentUserId = useCallback(() => userId, [userId]);

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    // Reset profile state immediately when user changes
    setProfileSections(EMPTY_PROFILE);
    setApprovedProfile(null);
    setProfileStatus('Draft');
    setLastSubmittedProfile(null);
    setNotifications([]);

    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadAll() {
      setLoading(true);
      try {
        const [fac, subs, evs, mousList, newsList, trnd, achs, pats, pubs, plas, projs, subsjs] = await Promise.all([
          facultyAPI.getAll(),
          submissionsAPI.getAll(),
          eventsAPI.getAll(),
          mousAPI.getAll(),
          newsAPI.getAll(),
          trendingAPI.getAll(),
          achievementsAPI.getAll(),
          patentsAPI.getAll(),
          publicationsAPI.getAll(),
          placementsAPI.getAll(),
          projectsAPI.getAll(),
          subjectsAPI.getAll(),
        ]);
        setFaculty(fac);
        setSubmissions(subs);
        setEvents([...evs, ...mousList, ...newsList]);
        setTrending(trnd);
        setAchievements(achs);
        setPatents(pats);
        setPublications(pubs);
        setPlacements(plas);
        setProjects(projs);
        setSubjects(subsjs);

        // Load profile for current user (faculty and HOD)
        try {
          const prof = await profileAPI.get(userId);
          setProfileSections(prof);
          setProfileStatus(prof.status || 'Draft');
          if (prof.status === 'Approved') setApprovedProfile(prof);

          // Always sync avatar + name from DB into AuthContext on load
          if (prof._basic_info) {
            updateUser({
              name:          prof._basic_info.name,
              designation:   prof._basic_info.designation,
              email:         prof._basic_info.email,
              qualification: prof._basic_info.qualification,
              avatar:        prof._basic_info.avatar,
            });
          }
        } catch {
          // No profile yet — keep empty shape
        }

        // Load notifications for current user
        try {
          const notifs = await notificationsAPI.getAll(userId);
          setNotifications(notifs);
        } catch {
          setNotifications([]);
        }
      } catch (e) {
        console.error('DataContext load error:', e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [userId]);

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  const addNotification = useCallback(async (n) => {
    if (!userId) return;
    try {
      const created = await notificationsAPI.create({ ...n, userId });
      setNotifications((prev) => {
        if (prev.length > 0 && prev[0].message === created.message) return prev;
        return [created, ...prev].slice(0, 50);
      });
    } catch { /* non-critical */ }
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      await notificationsAPI.markAll(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* non-critical */ }
  }, [userId]);

  const markOneRead = useCallback(async (id) => {
    try {
      await notificationsAPI.markOne(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch { /* non-critical */ }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      await notificationsAPI.clearAll(userId);
      setNotifications([]);
    } catch { /* non-critical */ }
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // ── SUBMISSIONS ────────────────────────────────────────────────────────────
  const addSubmission = useCallback(async (sub) => {
    try {
      const created = await submissionsAPI.create(sub);
      setSubmissions((prev) => [created, ...prev]);
      addNotification({ message: `"${sub.title}" submitted for approval`, type: 'info' });
      return created;
    } catch (e) {
      console.error('addSubmission error:', e.message);
    }
  }, [addNotification]);

  const updateSubmissionStatus = useCallback(async (id, status, comment = '', reviewedBy = '') => {
    try {
      const updated = await submissionsAPI.setStatus(id, status, comment, reviewedBy);
      setSubmissions((prev) => prev.map((s) => (s._id === id || s.id === id) ? updated : s));

      // If profile submission was approved, reload the profile from database
      if (status === 'Approved' && updated.type === 'Profile') {
        const facultyId = updated.userId || updated.user_id;
        if (facultyId) {
          try {
            const freshProfile = await profileAPI.get(facultyId);
            setProfileSections(freshProfile);
            setApprovedProfile(freshProfile);
            setProfileStatus('Approved');
            // Refresh avatar + name in the UI from the now-approved faculty_login row
            if (freshProfile._basic_info) {
              updateUser({
                name:          freshProfile._basic_info.name,
                designation:   freshProfile._basic_info.designation,
                email:         freshProfile._basic_info.email,
                qualification: freshProfile._basic_info.qualification,
                avatar:        freshProfile._basic_info.avatar,
              });
            }
          } catch (e) {
            console.error('Failed to reload profile after approval:', e.message);
          }
        }
      }
      
      if (status === 'Rejected' && updated.type === 'Profile') {
        setProfileStatus('Rejected');
      }

      // Reflect content data changes locally
      if (status === 'Approved' && updated.contentData) {
        const d = updated.contentData;
        if (updated.type === 'Trending') {
          setTrending((prev) =>
            d._id
              ? prev.map((t) => t._id === d._id ? { ...t, ...d, status: 'Published' } : t)
              : [{ ...d, status: 'Published' }, ...prev]
          );
        } else if (['Event', 'MoU', 'News'].includes(updated.type)) {
          setEvents((prev) =>
            d._id
              ? prev.map((e) => e._id === d._id ? { ...e, ...d, status: 'Approved' } : e)
              : [{ ...d, status: 'Approved' }, ...prev]
          );
        }
      }

      const sub = submissions.find((s) => (s._id || s.id) === id);
      if (sub) {
        addNotification({
          message: `"${sub.title}" was ${status.toLowerCase()}`,
          type: status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'warning',
        });
      }
    } catch (e) {
      console.error('updateSubmissionStatus error:', e.message);
      throw e;
    }
  }, [submissions, addNotification]);

  // ── PROFILE ────────────────────────────────────────────────────────────────
  const updateProfileSection = useCallback((section, data) => {
    setProfileSections((prev) => ({ ...prev, [section]: data }));
  }, []);

  const addProfileEntry = useCallback((section, entry) => {
    setProfileSections((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), entry],
    }));
  }, []);

  const updateProfileEntry = useCallback((section, id, entry) => {
    setProfileSections((prev) => ({
      ...prev,
      [section]: prev[section].map((e) =>
        (e._id === id || e.id === id) ? { ...e, ...entry } : e
      ),
    }));
  }, []);

  const deleteProfileEntry = useCallback((section, id) => {
    setProfileSections((prev) => ({
      ...prev,
      [section]: prev[section].filter((e) => (e._id !== id && e.id !== id)),
    }));
  }, []);

  const saveDraft = useCallback(async () => {
    if (!userId) return;
    try {
      const status = user?.role === 'HOD' ? 'Approved' : 'Draft';
      await profileAPI.save(userId, { ...profileSections, status }, user?.role);
      setLastSubmittedProfile(JSON.parse(JSON.stringify(profileSections)));
      addNotification({ message: 'Your profile draft has been saved', type: 'info' });
    } catch (e) {
      console.error('saveDraft error:', e.message);
    }
  }, [userId, user?.role, profileSections, addNotification]);

  const submitProfileForApproval = useCallback(async (
    changeDescription = '', pendingBasicInfo = null, resubmitFromId = null
  ) => {
    if (!userId) return;
    const alreadyPending = submissions.some(
      (s) => s.userId === userId && s.status === 'Pending' && s.type === 'Profile'
    );
    if (alreadyPending) return;

    try {
      // Save to temp table — include basicInfo so avatar is captured in snapshot
      await profileAPI.save(
        userId,
        { ...profileSections, status: 'Pending', basicInfo: pendingBasicInfo || {} },
        user?.role
      );
      setProfileStatus('Pending');

      const differences = calculateProfileDifferences(lastSubmittedProfile, profileSections);
      const now = new Date().toISOString().slice(0, 10);

      const submissionPayload = {
        userId,
        title: 'Profile Update',
        type: 'Profile',
        status: 'Pending',
        date: now,
        submittedDate: now,
        submittedBy: pendingBasicInfo?.name || user?.name || 'Faculty',
        department: user?.department || 'General',
        changeDescription,
        pendingBasicInfo,
        previousProfile: lastSubmittedProfile ? JSON.parse(JSON.stringify(lastSubmittedProfile)) : null,
        updatedProfile: JSON.parse(JSON.stringify(profileSections)),
        differences,
        resubmitFromId,
      };

      const created = await submissionsAPI.create(submissionPayload);
      setSubmissions((prev) => [created, ...prev]);

      if (resubmitFromId) {
        await submissionsAPI.supersede(resubmitFromId);
        setSubmissions((prev) =>
          prev.map((s) => s._id === resubmitFromId ? { ...s, superseded: true } : s)
        );
      }

      setLastSubmittedProfile(JSON.parse(JSON.stringify(profileSections)));
      addNotification({ message: 'Your profile has been submitted for HOD approval', type: 'info' });
    } catch (e) {
      console.error('submitProfileForApproval error:', e.message);
    }
  }, [userId, user, submissions, profileSections, lastSubmittedProfile, addNotification]);

  // ── EVENTS / MoUs / News ───────────────────────────────────────────────────
  const addEvent = useCallback(async (ev) => {
    try {
      const created = await eventsAPI.create({
        ...ev,
        date: ev.date || new Date().toISOString().slice(0, 10),
      });
      setEvents((prev) => [created, ...prev]);
      return created;
    } catch (e) {
      console.error('addEvent error:', e.message);
      throw e;
    }
  }, []);

  const updateEvent = useCallback(async (id, data) => {
    try {
      const updated = await eventsAPI.update(id, data);
      setEvents((prev) => prev.map((e) => (e._id === id || e.id === id) ? updated : e));
      return updated;
    } catch (e) {
      console.error('updateEvent error:', e.message);
      throw e;
    }
  }, []);

  const deleteEvent = useCallback(async (id) => {
    try {
      await eventsAPI.remove(id);
      setEvents((prev) => prev.filter((e) => e._id !== id && e.id !== id));
    } catch (e) {
      console.error('deleteEvent error:', e.message);
      throw e;
    }
  }, []);

  const addMou = useCallback(async (data) => {
    try {
      const created = await mousAPI.create(data);
      setEvents((prev) => [{...created, type: 'MoU'}, ...prev]);
      return created;
    } catch (e) { throw e; }
  }, []);

  const updateMou = useCallback(async (id, data) => {
    try {
      const updated = await mousAPI.update(id, data);
      setEvents((prev) => prev.map((e) => (e._id === id || e.id === id) ? {...updated, type: 'MoU'} : e));
      return updated;
    } catch (e) { throw e; }
  }, []);

  const deleteMou = useCallback(async (id) => {
    try {
      await mousAPI.remove(id);
      setEvents((prev) => prev.filter((e) => e._id !== id && e.id !== id));
    } catch (e) { throw e; }
  }, []);

  const addNews = useCallback(async (data) => {
    try {
      const created = await newsAPI.create(data);
      setEvents((prev) => [{...created, type: 'News'}, ...prev]);
      return created;
    } catch (e) { throw e; }
  }, []);

  const updateNews = useCallback(async (id, data) => {
    try {
      const updated = await newsAPI.update(id, data);
      setEvents((prev) => prev.map((e) => (e._id === id || e.id === id) ? {...updated, type: 'News'} : e));
      return updated;
    } catch (e) { throw e; }
  }, []);

  const deleteNews = useCallback(async (id) => {
    try {
      await newsAPI.remove(id);
      setEvents((prev) => prev.filter((e) => e._id !== id && e.id !== id));
    } catch (e) { throw e; }
  }, []);

  // ── TRENDING ───────────────────────────────────────────────────────────────
  const addTrending = useCallback(async (item) => {
    try {
      const created = await trendingAPI.create({
        ...item,
        date: item.date || new Date().toISOString().slice(0, 10),
      });
      setTrending((prev) => [created, ...prev]);
      return created;
    } catch (e) {
      console.error('addTrending error:', e.message);
      throw e;
    }
  }, []);

  const updateTrending = useCallback(async (id, data) => {
    try {
      const updated = await trendingAPI.update(id, data);
      setTrending((prev) => prev.map((t) => (t._id === id || t.id === id) ? updated : t));
      return updated;
    } catch (e) {
      console.error('updateTrending error:', e.message);
      throw e;
    }
  }, []);

  const deleteTrending = useCallback(async (id) => {
    try {
      await trendingAPI.remove(id);
      setTrending((prev) => prev.filter((t) => t._id !== id && t.id !== id));
    } catch (e) {
      console.error('deleteTrending error:', e.message);
      throw e;
    }
  }, []);

  const getTrendingByDepartment = useCallback((department) => {
    if (!department) return trending;
    return trending.filter((t) => t.department === department);
  }, [trending]);

  const getAllTrending = useCallback(() => trending, [trending]);

  // ── ACHIEVEMENTS / PATENTS / PUBLICATIONS / PLACEMENTS / PROJECTS / SUBJECTS ──
  const addAchievement = useCallback(async (data) => {
    try {
      const created = await achievementsAPI.create({ ...data, date: data.date || new Date().toISOString().slice(0,10) });
      setAchievements((prev) => [created, ...prev]);
      return created;
    } catch (e) { console.error('addAchievement error:', e.message); throw e; }
  }, []);

  const updateAchievement = useCallback(async (id, data) => {
    try {
      const updated = await achievementsAPI.update(id, data);
      setAchievements((prev) => prev.map((a) => (a._id === id || a.id === id) ? updated : a));
      return updated;
    } catch (e) { console.error('updateAchievement error:', e.message); throw e; }
  }, []);

  const deleteAchievement = useCallback(async (id) => {
    try { await achievementsAPI.remove(id); setAchievements((prev) => prev.filter((a) => a._id !== id && a.id !== id)); }
    catch (e) { console.error('deleteAchievement error:', e.message); throw e; }
  }, []);

  const addPatent = useCallback(async (data) => {
    try { const created = await patentsAPI.create(data); setPatents((prev) => [created, ...prev]); return created; }
    catch (e) { console.error('addPatent error:', e.message); throw e; }
  }, []);
  const updatePatent = useCallback(async (id, data) => {
    try { const updated = await patentsAPI.update(id, data); setPatents((prev) => prev.map((p) => (p._id === id || p.id === id) ? updated : p)); return updated; }
    catch (e) { console.error('updatePatent error:', e.message); throw e; }
  }, []);
  const deletePatent = useCallback(async (id) => {
    try { await patentsAPI.remove(id); setPatents((prev) => prev.filter((p) => p._id !== id && p.id !== id)); }
    catch (e) { console.error('deletePatent error:', e.message); throw e; }
  }, []);

  const addPublication = useCallback(async (data) => {
    try { const created = await publicationsAPI.create(data); setPublications((prev) => [created, ...prev]); return created; }
    catch (e) { console.error('addPublication error:', e.message); throw e; }
  }, []);
  const updatePublication = useCallback(async (id, data) => {
    try { const updated = await publicationsAPI.update(id, data); setPublications((prev) => prev.map((p) => (p._id === id || p.id === id) ? updated : p)); return updated; }
    catch (e) { console.error('updatePublication error:', e.message); throw e; }
  }, []);
  const deletePublication = useCallback(async (id) => {
    try { await publicationsAPI.remove(id); setPublications((prev) => prev.filter((p) => p._id !== id && p.id !== id)); }
    catch (e) { console.error('deletePublication error:', e.message); throw e; }
  }, []);

  const addPlacement = useCallback(async (data) => {
    try { const created = await placementsAPI.create(data); setPlacements((prev) => [created, ...prev]); return created; }
    catch (e) { console.error('addPlacement error:', e.message); throw e; }
  }, []);
  const updatePlacement = useCallback(async (id, data) => {
    try { const updated = await placementsAPI.update(id, data); setPlacements((prev) => prev.map((p) => (p._id === id || p.id === id) ? updated : p)); return updated; }
    catch (e) { console.error('updatePlacement error:', e.message); throw e; }
  }, []);
  const deletePlacement = useCallback(async (id) => {
    try { await placementsAPI.remove(id); setPlacements((prev) => prev.filter((p) => p._id !== id && p.id !== id)); }
    catch (e) { console.error('deletePlacement error:', e.message); throw e; }
  }, []);

  const addProject = useCallback(async (data) => {
    try { const created = await projectsAPI.create(data); setProjects((prev) => [created, ...prev]); return created; }
    catch (e) { console.error('addProject error:', e.message); throw e; }
  }, []);
  const updateProject = useCallback(async (id, data) => {
    try { const updated = await projectsAPI.update(id, data); setProjects((prev) => prev.map((p) => (p._id === id || p.id === id) ? updated : p)); return updated; }
    catch (e) { console.error('updateProject error:', e.message); throw e; }
  }, []);
  const deleteProject = useCallback(async (id) => {
    try { await projectsAPI.remove(id); setProjects((prev) => prev.filter((p) => p._id !== id && p.id !== id)); }
    catch (e) { console.error('deleteProject error:', e.message); throw e; }
  }, []);

  const addSubject = useCallback(async (data) => {
    try { const created = await subjectsAPI.create(data); setSubjects((prev) => [created, ...prev]); return created; }
    catch (e) { console.error('addSubject error:', e.message); throw e; }
  }, []);
  const updateSubject = useCallback(async (id, data) => {
    try { const updated = await subjectsAPI.update(id, data); setSubjects((prev) => prev.map((s) => (s._id === id || s.id === id) ? updated : s)); return updated; }
    catch (e) { console.error('updateSubject error:', e.message); throw e; }
  }, []);
  const deleteSubject = useCallback(async (id) => {
    try { await subjectsAPI.remove(id); setSubjects((prev) => prev.filter((s) => s._id !== id && s.id !== id)); }
    catch (e) { console.error('deleteSubject error:', e.message); throw e; }
  }, []);

  // ── PUBLIC SELECTORS ───────────────────────────────────────────────────────
  const isPublic = (item) => item.status === 'Approved' || item.status === 'Published';

  const getPublicEvents   = useCallback((dept) =>
    events.filter((e) => isPublic(e) && (!dept || e.department === dept || !e.department)),
  [events]);

  const getPublicTrending = useCallback((dept) =>
    trending.filter((t) => isPublic(t) && (!dept || t.department === dept)),
  [trending]);

  const getPublicFaculty  = useCallback((dept) =>
    faculty.filter((f) => !dept || f.department === dept),
  [faculty]);

  const getPublicProfileSections = useCallback(() => profileSections, [profileSections]);

  // ── FACULTY HELPERS ────────────────────────────────────────────────────────
  const addFaculty = useCallback(async (data) => {
    try {
      const created = await facultyAPI.create(data);
      setFaculty((prev) => [...prev, created]);
      return created;
    } catch (e) {
      console.error('addFaculty error:', e.message);
    }
  }, []);

  const updateFaculty = useCallback(async (id, data) => {
    try {
      const updated = await facultyAPI.update(id, data);
      setFaculty((prev) => prev.map((f) => f._id === id ? updated : f));
    } catch (e) {
      console.error('updateFaculty error:', e.message);
    }
  }, []);

  const removeFaculty = useCallback(async (id) => {
    try {
      await facultyAPI.remove(id);
      setFaculty((prev) => prev.filter((f) => f._id !== id));
    } catch (e) {
      console.error('removeFaculty error:', e.message);
    }
  }, []);

  const getSubmissionsByDepartment = useCallback((department) => {
    if (!department) return submissions;
    return submissions.filter((s) =>
      s.department?.toLowerCase() === department.toLowerCase()
    );
  }, [submissions]);

  const getFacultyByDepartment = useCallback((department) => {
    if (!department) return faculty;
    return faculty.filter((f) =>
      f.department?.toLowerCase() === department.toLowerCase()
    );
  }, [faculty]);

  const getAllSubmissions = useCallback(() => submissions, [submissions]);
  const getAllFaculty     = useCallback(() => faculty,     [faculty]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#64748b' }}>
        Connecting to database…
      </div>
    );
  }

  return (
    <DataContext.Provider value={{
      // State
      submissions, setSubmissions,
      profileSections, approvedProfile, profileStatus, setProfileStatus,
      events, trending, achievements, patents, publications, placements, projects, subjects, faculty, setFaculty,
      notifications, unreadCount,
      lastSubmittedProfile,

      // Submissions
      addSubmission, updateSubmissionStatus,

      // Profile
      updateProfileSection, addProfileEntry, updateProfileEntry, deleteProfileEntry,
      saveDraft, submitProfileForApproval,

      // Events / MoUs / News
      addEvent, updateEvent, deleteEvent,
      addMou, updateMou, deleteMou,
      addNews, updateNews, deleteNews,

      // Trending
      addTrending, updateTrending, deleteTrending,
      getTrendingByDepartment, getAllTrending,

      // Achievements
      achievements, addAchievement, updateAchievement, deleteAchievement,

      // Patents
      patents, addPatent, updatePatent, deletePatent,

      // Publications
      publications, addPublication, updatePublication, deletePublication,

      // Placements / Training
      placements, addPlacement, updatePlacement, deletePlacement,

      // Student Projects
      projects, addProject, updateProject, deleteProject,

      // Subjects / Curriculum
      subjects, addSubject, updateSubject, deleteSubject,

      // Public selectors
      getPublicEvents, getPublicTrending, getPublicFaculty, getPublicProfileSections,

      // Notifications
      addNotification, markAllRead, markOneRead, clearAllNotifications,

      // Faculty management
      addFaculty, updateFaculty, removeFaculty,

      // Filters
      getSubmissionsByDepartment, getFacultyByDepartment,
      getAllSubmissions, getAllFaculty,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
