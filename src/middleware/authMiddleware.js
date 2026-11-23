const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/*
 * Middleware de autenticação JWT.
 * Valida o cabeçalho `Authorization: Bearer <jwt>` e retorna 401 caso esteja ausente ou inválido.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token de autorização não fornecido.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0]) || !parts[1]) {
        return res.status(401).json({ error: 'Token de autorização malformado.' });
    }

    const [, token] = parts;

    try {
        const decoded = jwt.verify(token, authConfig.secret);
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token de autorização inválido ou expirado.' });
    }
}

module.exports = authMiddleware;
