import http from './httpClient';

// Địa điểm
export const getDiaDiem = async () => {
  const { data } = await http.get('/dia-diem');
  return data;
};

export const searchDiaDiemByProvince = async (ten_tinh) => {
  const { data } = await http.get('/dia-diem/search', { params: { ten_tinh } });
  return data;
};

// Lễ hội
export const getLeHoi = async () => {
  const { data } = await http.get('/le-hoi');
  return data;
};

export const searchLeHoiByProvince = async (ten_tinh) => {
  const { data } = await http.get('/le-hoi/search', { params: { ten_tinh } });
  return data;
};

// Đặc sản
export const getDacSan = async () => {
  const { data } = await http.get('/dac-san');
  return data;
};

export const searchDacSanByProvince = async (ten_tinh) => {
  const { data } = await http.get('/dac-san/search', { params: { ten_tinh } });
  return data;
};

// Tour
export const getTours = async () => {
  const { data } = await http.get('/tour-du-lich');
  return data;
};

export const uploadTourMedia = async (file) => {
  const fd = new FormData();
  fd.append('media', file);
  const { data } = await http.post('/tour-du-lich/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const listMyTourBookings = async () => {
  const { data } = await http.get('/tour-du-lich/bookings/me');
  return data;
};

export const createTour = async (payload) => {
  const { data } = await http.post('/tour-du-lich', payload);
  return data;
};

export const getPartnerBookingStats = async () => {
  const { data } = await http.get('/tour-du-lich/bookings/partner');
  return data;
};

export const updateTour = async (id, payload) => {
  const { data } = await http.put(`/tour-du-lich/${id}`, payload);
  return data;
};

export const deleteTour = async (id) => {
  const { data } = await http.delete(`/tour-du-lich/${id}`);
  return data;
};
