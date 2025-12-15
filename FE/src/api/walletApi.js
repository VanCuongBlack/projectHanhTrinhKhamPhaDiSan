import http from './httpClient';

export const getWalletHistory = async () => {
  const { data } = await http.get('/wallet/history');
  return data;
};

export const requestTopUp = async (payload) => {
  const { data } = await http.post('/wallet/topup', payload);
  return data;
};

export const requestWithdraw = async (payload) => {
  const { data } = await http.post('/wallet/withdraw', payload);
  return data;
};

export const payWithWallet = async (payload) => {
  const { data } = await http.post('/wallet/pay', payload);
  return data;
};
