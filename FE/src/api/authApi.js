import http from './httpClient';

export const registerUser = async (payload) => {
  const { data } = await http.post('/users/register', payload);
  return data;
};

export const verifyOtp = async (payload) => {
  const { data } = await http.post('/users/verify-otp', payload);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await http.post('/users/login', payload);
  return data;
};

export const logoutUser = async () => {
  const { data } = await http.post('/users/logout');
  return data;
};
