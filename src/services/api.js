const API_URL = import.meta.env.VITE_API_BASE_URL || "/backend";

const originalFetch = window.fetch;
const fetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return originalFetch(url, { ...options, headers });
};

export const loginUser = async (username, password, role) => {
  try {
    const response = await fetch(`${API_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Connection error' };
  }
};

export const facultyAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/get_faculty.php`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.faculty;
    } catch { return []; }
  },
  create: async (data) => ({ _id: Date.now(), ...data }),
  update: async (id, data) => {
    const { avatar, ...rest } = data;
    const response = await fetch(`${API_URL}/update_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, avatar: avatar || '', ...rest })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { _id: id, ...data };
  },
  remove: async (id) => ({ success: true })
};

export const profileAPI = {
  get: async (userId, role = 'FACULTY') => {
    const response = await fetch(`${API_URL}/get_profile.php?faculty_id=${userId}&role=${role}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.profile;
  },
  save: async (userId, profileData, userRole = 'FACULTY') => {
    const { basicInfo, ...sections } = profileData;
    const response = await fetch(`${API_URL}/save_profile.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faculty_id: userId,
        user_role: userRole,
        profile_data: sections,
        basic_info: basicInfo || {}
      })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { success: true };
  }
};

export const submissionsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/get_submissions.php`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.submissions;
  },
  create: async (data) => {
    const { updatedProfile, pendingBasicInfo, ...rest } = data;
    const response = await fetch(`${API_URL}/create_submission.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rest,
        profileData: updatedProfile || {},
        basicInfo: pendingBasicInfo || {}
      })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.submission;
  },
  setStatus: async (id, status, comment, reviewedBy) => {
    const response = await fetch(`${API_URL}/update_submission.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, comment, reviewedBy })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.submission;
  },
  supersede: async (id) => ({ success: true })
};

async function deleteContent(id, type) {
  const response = await fetch(`${API_URL}/delete_content.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, type })
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Delete failed');
  return result;
}

export const eventsAPI = {
  getAll: async (dept, status) => {
    const params = new URLSearchParams();
    if (dept)   params.append('department', dept);
    if (status) params.append('status', status);
    const response = await fetch(`${API_URL}/get_events.php?${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.events;
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_event.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_event.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => deleteContent(id, 'event')
};

export const mousAPI = {
  getAll: async (dept, status) => {
    const params = new URLSearchParams();
    if (dept)   params.append('department', dept);
    if (status) params.append('approvalStatus', status);
    const response = await fetch(`${API_URL}/get_mous.php?${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.mous;
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_mou.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_mou.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => deleteContent(id, 'mou')
};

export const newsAPI = {
  getAll: async (dept, status) => {
    const params = new URLSearchParams();
    if (dept)   params.append('department', dept);
    if (status) params.append('status', status);
    const response = await fetch(`${API_URL}/get_news.php?${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.news;
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_news.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_news.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => deleteContent(id, 'news')
};

export const trendingAPI = {
  getAll: async (status) => {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`${API_URL}/get_trending.php${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.trending;
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_trending.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_trending.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => deleteContent(id, 'trending')
};

export const notificationsAPI = {
  getAll: async (userId) => [],
  create: async (data) => ({ _id: Date.now(), ...data }),
  markAll: async (userId) => ({ success: true }),
  markOne: async (id) => ({ success: true }),
  clearAll: async (userId) => ({ success: true })
};

export const achievementsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/get_achievements.php`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.achievements;
    } catch { return []; }
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_achievement.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_achievement.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => {
    const response = await fetch(`${API_URL}/delete_content.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type: 'achievement' })
    });
    return await response.json();
  }
};

export const patentsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/get_patents.php`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.patents;
    } catch { return []; }
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_patent.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_patent.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => {
    const response = await fetch(`${API_URL}/delete_content.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type: 'patent' })
    });
    return await response.json();
  }
};

export const publicationsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/get_publications.php`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.publications;
    } catch { return []; }
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_publication.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_publication.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => {
    const response = await fetch(`${API_URL}/delete_content.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type: 'publication' })
    });
    return await response.json();
  }
};

export const placementsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/get_placements.php`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.placements;
    } catch { return []; }
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_placement.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_placement.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => {
    const response = await fetch(`${API_URL}/delete_content.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type: 'placement' })
    });
    return await response.json();
  }
};

export const projectsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/get_projects.php`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.projects;
    } catch { return []; }
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_project.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_project.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => {
    const response = await fetch(`${API_URL}/delete_content.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type: 'project' })
    });
    return await response.json();
  }
};

export const subjectsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/get_subjects.php`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.subjects;
    } catch { return []; }
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/save_subject.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: result.id, id: result.id };
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/save_subject.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { ...data, _id: id, id };
  },
  remove: async (id) => {
    const response = await fetch(`${API_URL}/delete_content.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type: 'subject' })
    });
    return await response.json();
  }
};
