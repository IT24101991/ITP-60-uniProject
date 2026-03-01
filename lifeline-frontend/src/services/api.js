import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getCamps = () => api.get('/api/camps');

export const createCamp = (payload) => api.post('/api/camps/create', payload);

export const registerForCamp = (campId, payload) =>
    api.post(`/api/camps/${campId}/register`, payload);

export const checkInDonor = (campId, donorUserId) =>
    api.post(`/api/camps/${campId}/check-in`, { donorUserId });

export default api;
