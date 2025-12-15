import http from './httpClient';

export const lockUser = async (id) => {
  const { data } = await http.patch(`/admin/users/${id}/lock`);
  return data;
};

export const unlockUser = async (id) => {
  const { data } = await http.patch(`/admin/users/${id}/unlock`);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await http.delete(`/admin/users/${id}`);
  return data;
};

export const listGuideApplications = async (params = {}) => {
  const { data } = await http.get('/guides/applications', { params });
  return data;
};

export const listGuidesAdmin = async (params = {}) => {
  const { data } = await http.get('/admin/guides', { params });
  return data;
};

export const updateGuideApplication = async (id, payload) => {
  const { data } = await http.patch(`/guides/applications/${id}`, payload);
  return data;
};

// Withdraw requests
export const listWithdrawRequests = async (params = {}) => {
  const { data } = await http.get('/wallet/withdraw/requests', { params });
  return data;
};

export const reviewWithdrawRequest = async (id, payload) => {
  const { data } = await http.patch(`/wallet/withdraw/requests/${id}`, payload);
  return data;
};

// Voucher admin
export const createVoucher = async (payload) => {
  const { data } = await http.post('/vouchers', payload);
  return data;
};

export const assignVoucherBulk = async (voucherId, payload) => {
  const { data } = await http.post(`/vouchers/${voucherId}/assign-bulk`, payload);
  return data;
};

export const listVouchers = async (params = {}) => {
  const { data } = await http.get('/admin/vouchers', { params });
  return data;
};

export const listUsers = async (params = {}) => {
  const { data } = await http.get('/admin/users', { params });
  return data;
};

export const listPartnersAdmin = async (params = {}) => {
  const { data } = await http.get('/admin/partners', { params });
  return data;
};

// Địa điểm (admin)
export const listPlacesAdmin = async (params = {}) => {
  const { data } = await http.get('/dia-diem', { params });
  return data;
};

export const createPlace = async (payload) => {
  const isForm = payload instanceof FormData;
  const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await http.post('/dia-diem', payload, config);
  return data;
};

export const updatePlace = async (id, payload) => {
  const isForm = payload instanceof FormData;
  const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await http.put(`/dia-diem/${id}`, payload, config);
  return data;
};

export const deletePlace = async (id) => {
  const { data } = await http.delete(`/dia-diem/${id}`);
  return data;
};

export const listProvinces = async (params = {}) => {
  const { data } = await http.get('/region/tinh-thanh', { params });
  return data;
};

export const listPlaceTypes = async () => {
  const { data } = await http.get('/region/loai-dia-diem');
  return data;
};

// Đặc sản
export const listSpecialties = async (params = {}) => {
  const { data } = await http.get('/dac-san', { params });
  return data;
};

export const createSpecialty = async (payload) => {
  const isForm = payload instanceof FormData;
  const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await http.post('/dac-san', payload, config);
  return data;
};

export const updateSpecialty = async (id, payload) => {
  const isForm = payload instanceof FormData;
  const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await http.put(`/dac-san/${id}`, payload, config);
  return data;
};

export const deleteSpecialty = async (id) => {
  const { data } = await http.delete(`/dac-san/${id}`);
  return data;
};

// Lễ hội
export const listFestivals = async (params = {}) => {
  const { data } = await http.get('/le-hoi', { params });
  return data;
};

export const createFestival = async (payload) => {
  const isForm = payload instanceof FormData;
  const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await http.post('/le-hoi', payload, config);
  return data;
};

export const updateFestival = async (id, payload) => {
  const isForm = payload instanceof FormData;
  const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await http.put(`/le-hoi/${id}`, payload, config);
  return data;
};

export const deleteFestival = async (id) => {
  const { data } = await http.delete(`/le-hoi/${id}`);
  return data;
};

// Check-in config
export const getCheckinConfig = async () => {
  const { data } = await http.get('/checkins/config');
  return data;
};

export const updateCheckinConfig = async (payload) => {
  const { data } = await http.put('/checkins/config', payload);
  return data;
};
