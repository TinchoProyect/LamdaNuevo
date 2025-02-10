import express from 'express';
import cors from 'cors';

const app = express();

// Configuración de CORS
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = ['http://localhost:8081', 'https://lamda.netlify.app'];
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para redirigir a HTTPS
app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        next();
    } else {
        res.redirect(`https://${req.headers.host}${req.url}`);
    }
});

// Rutas de la API
app.get('/consulta', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

// Inicializar el servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
