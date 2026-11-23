const AppError = require('../utils/AppError');

/*
 * Middleware global para tratamento centralizado de erros na aplicação Express.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
    // Erro operacional customizado (400, 401, 404, etc.)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    // Erro de JSON malformado enviado pelo cliente
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
    }

    // Erros de validação ou restrição única do Sequelize
    if (
        err.name === 'SequelizeValidationError' ||
        err.name === 'SequelizeUniqueConstraintError'
    ) {
        const message = err.errors && err.errors[0] ? err.errors[0].message : 'Dados inválidos.';
        return res.status(400).json({ error: message });
    }

    if (process.env.NODE_ENV !== 'test') {
        console.error('[Internal Error]:', err);
    }

    return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = errorMiddleware;
