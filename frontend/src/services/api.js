import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE });

export const getPlayers = (params = {}) => api.get('/players', { params });
export const getPlayer = (id) => api.get(`/players/${id}`);
export const getRankings = (params = {}) => api.get('/rankings', { params });
export const comparePlayers = (ids) => api.get('/compare', { params: { ids: ids.join(',') } });
export const getLineup = (date) => api.get('/lineup', { params: { date } });
export const getWeeklySchedule = () => api.get('/schedule/weekly');
export const getNews = () => api.get('/news');
export const getWaivers = (params = {}) => api.get('/waivers', { params });
export const toggleDraft = (id) => api.post(`/draft/${id}`);
export const refreshData = () => api.post('/refresh');
