import axios from 'axios';

const BASE_URL = 'http://1.tcp.sa.ngrok.io:20186';

const api = axios.create({
    baseURL: BASE_URL,
});

export default api;
