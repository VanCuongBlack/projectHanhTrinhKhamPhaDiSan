import http from './httpClient';

export const getRouteDistance = async ({ from, to }) => {
  const { data } = await http.post('/map/distance', { from, to });
  return data; // {distance,duration,geometry}
};

export const geocodeSearch = async (text, params = {}) => {
  const { data } = await http.get('/map/geocode/search', { params: { text, ...params } });
  return data;
};

export const geocodeReverse = async (lat, lng, params = {}) => {
  const { data } = await http.get('/map/geocode/reverse', { params: { lat, lng, ...params } });
  return data;
};
