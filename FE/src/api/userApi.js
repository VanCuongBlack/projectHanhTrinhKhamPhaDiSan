import http from './httpClient';

export const getProfile = async () => {
  const { data } = await http.get('/users/me');
  return data;
};

export const changePassword = async (payload) => {
  const { data } = await http.put('/users/me/password', payload);
  return data;
};

export const uploadAvatar = async (file) => {
  const fd = new FormData();
  fd.append('avatar', file);
  const { data } = await http.post('/users/me/avatar', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
