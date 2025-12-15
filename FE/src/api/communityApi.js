import http from './httpClient';

export const getPosts = async () => {
  const { data } = await http.get('/community/posts');
  return data;
};

export const createPost = async (payload) => {
  const { data } = await http.post('/community/posts', payload);
  return data;
};

export const getComments = async (postId) => {
  const { data } = await http.get(`/community/posts/${postId}/comments`);
  return data;
};

export const addComment = async (postId, payload) => {
  const { data } = await http.post(`/community/posts/${postId}/comments`, payload);
  return data;
};

// Check-in API
export const checkinAtPlace = async (ma_dia_diem, payload = {}) => {
  // backend mount: /api/checkins
  const { data } = await http.post('/checkins', { ma_dia_diem, ...payload });
  return data;
};

export const getMyCheckins = async () => {
  const { data } = await http.get('/checkins/me');
  return data; // {points, checkins}
};

export const listPlaces = async (params = {}) => {
  const { data } = await http.get('/dia-diem', { params });
  return data;
};

// User vouchers
export const listMyVouchers = async () => {
  const { data } = await http.get('/vouchers/my');
  return data;
};

export const toggleLikePost = async (postId) => {
  const { data } = await http.post(`/community/posts/${postId}/like`);
  return data;
};
