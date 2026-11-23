const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Limite ampliado para suportar imagens em base64
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos de imagens de produtos
app.use('/media', express.static(path.resolve(__dirname, '..', 'uploads')));

// Documentação interativa da API via Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthcheck simples
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Rotas versionadas da API
app.use('/v1', routes);

// Fallback para rotas inexistentes
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
});

// Tratamento global de erros
app.use(errorMiddleware);

module.exports = app;
