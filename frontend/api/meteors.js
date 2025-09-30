import { api } from './axios';

export const getMeteors = async () => {
  return await api.get('/meteors');
};
