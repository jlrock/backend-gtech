const { rateLimit } = require('express-rate-limit');

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 10,

    standardHeaders: 'draft-8',

    legacyHeaders: false,

    message: {
        error: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
    },

    skip: () => process.env.NODE_ENV === 'test',
});

module.exports = {
    loginRateLimiter,
};