import http from './httpClient';

export const applyGuide = async (payload) => {
  // hỗ trợ FormData để upload file
  const isFormData = payload instanceof FormData;
  const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await http.post('/guides/apply', payload, config);
  return data;
};

export const getMyGuideStatus = async () => {
  const { data } = await http.get('/guides/me');
  return data;
};

export const listGuideApplications = async (params = {}) => {
  const { data } = await http.get('/guides/applications', { params });
  return data;
};

export const getFeaturedGuides = async (limit = 4) => {
  const { data } = await http.get('/guides/featured', { params: { limit } });
  return data;
};

export const updateGuideApplication = async (id, payload) => {
  const { data } = await http.patch(`/guides/applications/${id}`, payload);
  return data;
};

export const createGuideSlot = async (payload) => {
  const { data } = await http.post('/guides/schedule', payload);
  return data;
};

export const listMyGuideSchedule = async () => {
  const { data } = await http.get('/guides/schedule/me');
  return data;
};

export const listMyGuideBookings = async () => {
  const { data } = await http.get('/guides/bookings/me');
  return data;
};

export const listUserGuideBookings = async () => {
  const { data } = await http.get('/guides/bookings/user');
  return data;
};

export const searchGuideSlots = async (ngay) => {
  const params = ngay ? { ngay } : undefined;
  const { data } = await http.get('/guides/schedule/search', { params });
  return data;
};

export const bookGuideSlot = async (payload) => {
  const { data } = await http.post('/guides/bookings', payload);
  return data;
};

export const addGuideReview = async (bookingId, payload) => {
  const { data } = await http.post(`/guides/bookings/${bookingId}/reviews`, payload);
  return data;
};

export const listGuideReviews = async (guideId, params = {}) => {
  const { data } = await http.get(`/guides/${guideId}/reviews`, { params });
  return data;
};
