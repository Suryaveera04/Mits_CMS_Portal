// src/services/api.js
// Central API layer — all calls to the Express/MongoDB backend go through here.

const BASE = 'http://localhost:5000/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const get   = (path)       => request('GET',    path);
const post  = (path, body) => request('POST',   path, body);
const put   = (path, body) => request('PUT',    path, body);
const patch = (path, body) => request('PATCH',  path, body);
const del   = (path, body) => request('DELETE', path, body);

// ── Faculty ──────────────────────────────────────────────────────────────────
export const facultyAPI = {
  getAll:  ()         => get('/faculty'),
  getOne:  (id)       => get(`/faculty/${id}`),
  create:  (data)     => post('/faculty', data),
  update:  (id, data) => put(`/faculty/${id}`, data),
  remove:  (id)       => del(`/faculty/${id}`),
};

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileAPI = {
  get:          (facultyId)         => get(`/profile/${facultyId}`),
  save:         (facultyId, data)   => post(`/profile/${facultyId}`, data),
  patch:        (facultyId, data)   => patch(`/profile/${facultyId}`, data),
  updateStatus: (facultyId, status) => patch(`/profile/${facultyId}/status`, { status }),
};

// ── Submissions ──────────────────────────────────────────────────────────────
export const submissionsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/submissions${qs ? '?' + qs : ''}`);
  },
  getOne:    (id)                              => get(`/submissions/${id}`),
  create:    (data)                            => post('/submissions', data),
  setStatus: (id, status, comment, reviewedBy) =>
    patch(`/submissions/${id}/status`, { status, comment, reviewedBy }),
  supersede: (id)  => patch(`/submissions/${id}/supersede`, {}),
  remove:    (id)  => del(`/submissions/${id}`),
};

// ── Events / MoUs / News ─────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/events${qs ? '?' + qs : ''}`);
  },
  getOne:  (id)       => get(`/events/${id}`),
  create:  (data)     => post('/events', data),
  update:  (id, data) => put(`/events/${id}`, data),
  remove:  (id)       => del(`/events/${id}`),
};

// ── Trending ─────────────────────────────────────────────────────────────────
export const trendingAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/trending${qs ? '?' + qs : ''}`);
  },
  getOne:  (id)       => get(`/trending/${id}`),
  create:  (data)     => post('/trending', data),
  update:  (id, data) => put(`/trending/${id}`, data),
  remove:  (id)       => del(`/trending/${id}`),
};

// ── Achievements ───────────────────────────────────────────────────────────
export const achievementsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/achievements${qs ? '?' + qs : ''}`);
  },
  getOne:  (id)       => get(`/achievements/${id}`),
  create:  (data)     => post('/achievements', data),
  update:  (id, data) => put(`/achievements/${id}`, data),
  remove:  (id)       => del(`/achievements/${id}`),
};

// ── Patents ───────────────────────────────────────────────────────────────
export const patentsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/patents${qs ? '?' + qs : ''}`);
  },
  getOne:  (id)       => get(`/patents/${id}`),
  create:  (data)     => post('/patents', data),
  update:  (id, data) => put(`/patents/${id}`, data),
  remove:  (id)       => del(`/patents/${id}`),
};

// ── Publications ──────────────────────────────────────────────────────────
export const publicationsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/publications${qs ? '?' + qs : ''}`);
  },
  getOne:  (id)       => get(`/publications/${id}`),
  create:  (data)     => post('/publications', data),
  update:  (id, data) => put(`/publications/${id}`, data),
  remove:  (id)       => del(`/publications/${id}`),
};

// ── Placements & Training ─────────────────────────────────────────────────
export const placementsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/placements${qs ? '?' + qs : ''}`);
  },
  getOne:  (id)       => get(`/placements/${id}`),
  create:  (data)     => post('/placements', data),
  update:  (id, data) => put(`/placements/${id}`, data),
  remove:  (id)       => del(`/placements/${id}`),
};

// ── Student Projects ─────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/projects${qs ? '?' + qs : ''}`);
  },
  getOne:  (id)       => get(`/projects/${id}`),
  create:  (data)     => post('/projects', data),
  update:  (id, data) => put(`/projects/${id}`, data),
  remove:  (id)       => del(`/projects/${id}`),
};

// ── Subjects / Curriculum ─────────────────────────────────────────────────
export const subjectsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/subjects${qs ? '?' + qs : ''}`);
  },
  getOne:  (id)       => get(`/subjects/${id}`),
  create:  (data)     => post('/subjects', data),
  update:  (id, data) => put(`/subjects/${id}`, data),
  remove:  (id)       => del(`/subjects/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:   (userId) => get(`/notifications?userId=${userId}`),
  create:   (data)   => post('/notifications', data),
  markOne:  (id)     => patch(`/notifications/${id}/read`, {}),
  markAll:  (userId) => patch('/notifications/mark-all-read', { userId }),
  clearAll: (userId) => del('/notifications/clear', { userId }),
};
