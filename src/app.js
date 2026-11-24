const path = require('path');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');

const routes = require('./routes');

const AppError = require('./utils/AppError');

const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Origens permitidas por padrão durante o desenvolvimento.
const defaultDevelopmentOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

// Lê as origens configuradas no .env.
const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins =
    configuredOrigins.length > 0
        ? configuredOrigins
        : (
            process.env.NODE_ENV === 'production'
                ? []
                : defaultDevelopmentOrigins
        );

// Remove o cabeçalho que identifica o Express.
app.disable('x-powered-by');

// Segurança HTTP.
app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: 'cross-origin',
        },

        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                ],

                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                ],

                imgSrc: [
                    "'self'",
                    'data:',
                    'https:',
                ],

                connectSrc: ["'self'"],

                objectSrc: ["'none'"],

                baseUri: ["'self'"],

                formAction: ["'self'"],

                frameAncestors: ["'self'"],
            },
        },
    })
);

// Configuração CORS.
app.use(
    cors({
        origin(origin, callback) {

            // Requisições sem Origin, como curl e
            // chamadas servidor-servidor, são permitidas.

            if (
                !origin ||
                allowedOrigins.includes(origin)
            ) {
                return callback(null, true);
            }

            return callback(
                new AppError(
                    'Origem não autorizada pelo CORS.',
                    403
                )
            );
        },

        credentials: true,

        optionsSuccessStatus: 204,
    })
);

// Limite global do corpo JSON.
// Cada imagem possui limite individual de 5 MB
// no imageHelper.
app.use(
    express.json({
        limit: '20mb',
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: '20mb',
    })
);

// Servir arquivos estáticos de imagens.
app.use(
    '/media',

    express.static(
        path.resolve(__dirname, '..', 'uploads'),
        {
            fallthrough: true,
            dotfiles: 'deny',
            index: false,
        }
    )
);

// Documentação Swagger.
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

// Healthcheck.
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
    });
});

// Rotas versionadas.
app.use('/v1', routes);

// Fallback para rotas inexistentes.
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada.',
    });
});

// Tratamento global de erros.
app.use(errorMiddleware);

module.exports = app