import api from './apiClient';

export const createGenres = (data) =>
  api.post('/admin/genres', data);

export const updateGenres = (id, data) =>
  api.put(`/admin/genres/${id}`, data);

export const deleteGenres = (id) =>
  api.delete(`/admin/genres/${id}`);
