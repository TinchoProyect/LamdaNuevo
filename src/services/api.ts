import axios from 'axios';

const isDevelopment = window.location.hostname === 'localhost';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    // Solo habilitamos withCredentials en producción
    withCredentials: !isDevelopment
});

// Interceptor para validar HTTPS y manejar errores
api.interceptors.request.use((config) => {
    const baseURL = config.baseURL || '';
    if (!baseURL.startsWith('https://')) {
        throw new Error('La URL de la API debe usar HTTPS');
    }
    return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.message === 'La URL de la API debe usar HTTPS') {
            console.error('Error de seguridad: La API debe usar HTTPS');
        } else if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
            console.error('Error de CORS o red:', 
                'No se puede conectar con el servidor. ' +
                'Verifica que el servidor esté configurado para aceptar solicitudes desde ' +
                'https://lamda.netlify.app');
        } else if (error.response) {
            console.error('Error en la respuesta:', error.response.data);
        } else if (error.request) {
            console.error('Error en la solicitud:', error.message);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
