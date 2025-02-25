import axios from 'axios';

// URL base anterior (comentada para referencia)
// const BASE_URL = 'http://1.tcp.sa.ngrok.io:20186';

// URL base actualizada con HTTPS y dominio fijo
const BASE_URL = 'https://api.lamdaser.com';

const api = axios.create({
    baseURL: BASE_URL,
});

export default api;
