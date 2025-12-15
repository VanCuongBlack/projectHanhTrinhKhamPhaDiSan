import http from './httpClient';

export const bookTour = async (tourId, payload) => {
  const { data } = await http.post(`/tour-du-lich/${tourId}/bookings`, payload);
  return data;
};
