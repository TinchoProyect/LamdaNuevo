const express = require('express');
const cors = require('cors');
const app = express();

// Configuración de CORS
app.use(cors({
    origin: 'https://lamda.netlify.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
}));

// Middleware para redirigir a HTTPS
app.use((req, res, next) => {
    if (req.secure) {
        next();
    } else {
        res.redirect(`https://${req.headers.host}${req.url}`);
    }
});

// Ruta de consulta
app.get('/consulta', (req, res) => {
    try {
        // Aquí va la lógica de consulta a la base de datos
        res.json({
            success: true,
            message: 'Consulta exitosa',
            data: [] // Aquí irían los datos de la consulta
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en la consulta',
            error: error.message
        });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: err.message
    });
});

const PORT = 20186;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`CORS configurado para aceptar solicitudes desde https://lamda.netlify.app`);
});
