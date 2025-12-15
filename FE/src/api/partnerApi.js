import http from './httpClient';

export const applyPartner = async (payload) => {
  const isFormData = payload instanceof FormData;
  const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await http.post('/partners/apply', payload, config);
  return data;
};

export const getMyPartnerStatus = async () => {
  const { data } = await http.get('/partners/me');
  return data;
};

export const listPartnerApplications = async (params = {}) => {
  const { data } = await http.get('/partners/applications', { params });
  return data;
};

export const updatePartnerApplication = async (id, payload) => {
  const { data } = await http.patch(`/partners/applications/${id}`, payload);
  return data;
};
