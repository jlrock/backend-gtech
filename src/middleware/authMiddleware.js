const jwt = require('jsonwebtoken');

const authConfig = require('../config/auth');

/**
 * Valida Authorization: Bearer <JWT>
 * e carrega a identidade autenticada.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (
        typeof authHeader !== 'string' ||
        authHeader.trim() === ''
    ) {
        return res.status(401).json({
            error: 'Token de autorização não fornecido.',
        });
    }

    const match = authHeader.trim().match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        return res.status(401).json({
            error: 'Token de autorização malformado.',
        });
    }

    try {
        const decoded = jwt.verify(
            match[1],
            authConfig.secret,
            {
                algorithms: [authConfig.algorithm],
            }
        );

        if (
            !decoded ||
            !Number.isSafeInteger(Number(decoded.id)) ||
            Number(decoded.id) <= 0
        ) {
            return res.status(401).json({
                error: 'Token de autorização inválido ou sem identificação de usuário.',
            });
        }

        req.userId = Number(decoded.id);

        req.userEmail =
            typeof decoded.email === 'string'
                ? decoded.email
                : undefined;

        return next();

    } catch (error) {
        return res.status(401).json({
            error: 'Token de autorização inválido ou expirado.',
        });
    }
}

module.exports = authMiddleware;