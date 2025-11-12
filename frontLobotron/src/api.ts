import axios from 'axios';

const api = axios.create({
  baseURL: 'http://backend:8000/api', // nombre del servicio Docker
})

export default api;
