import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const SOCKET_BASE_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function getPages(search = '') {
  const { data } = await api.get('/pages', {
    params: search ? { search } : {}
  });
  return data;
}

export async function getPage(id) {
  const { data } = await api.get(`/pages/${id}`);
  return data;
}

export async function createPage(payload) {
  const { data } = await api.post('/pages', payload);
  return data;
}

export async function updatePage(id, payload) {
  const { data } = await api.put(`/pages/${id}`, payload);
  return data;
}

export async function likePage(id) {
  const { data } = await api.post(`/pages/${id}/like`);
  return data;
}

export async function getRelationSuggestions(id) {
  const { data } = await api.get(`/pages/${id}/suggestions`);
  return data;
}

export async function getGraphData() {
  const { data } = await api.get('/pages/graph');
  return data;
}

export async function getLore(keyword = '') {
  const { data } = await api.get('/lore', {
    params: keyword ? { keyword } : {}
  });
  return data;
}

export async function getComments(pageId) {
  const { data } = await api.get(`/comments/${pageId}`);
  return data;
}

export async function addComment(payload) {
  const { data } = await api.post('/comments', payload);
  return data;
}

export async function generateSummary(content) {
  const { data } = await api.post('/ai/summary', { content });
  return data;
}

export async function getMyProfile() {
  const { data } = await api.get('/profile/me');
  return data;
}

export async function updateMyProfile(payload) {
  const { data } = await api.put('/profile/me', payload);
  return data;
}

export async function getProfileByUsername(username) {
  const { data } = await api.get(`/profile/${encodeURIComponent(username)}`);
  return data;
}

export async function toggleFollowUser(username) {
  const { data } = await api.post(`/profile/${encodeURIComponent(username)}/follow`);
  return data;
}
