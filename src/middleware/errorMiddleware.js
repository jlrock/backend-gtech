const AppError = require('../utils/AppError');

/**
 * Tratamento centralizado de erros
 * da aplicação Express.
 */
function errorMiddleware(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    // Erros operacionais personalizados.
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }

    // JSON malformado.
    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        'body' in err
    ) {
        return res.status(400).json({
            error: 'JSON inválido no corpo da requisição.',
        });
    }

    // Corpo da requisição excedeu o limite.
    if (
        err &&
        (
            err.type === 'entity.too.large' ||
            err.status === 413 ||
            err.statusCode === 413
        )
    ) {
        return res.status(413).json({
            error: 'Corpo da requisição muito grande.',
        });
    }

    // Erros de validação e integridade do Sequelize.
    if (
        err &&
        (
            err.name === 'SequelizeValidationError' ||
            err.name === 'SequelizeUniqueConstraintError' ||
            err.name === 'SequelizeForeignKeyConstraintError'
        )
    ) {
        const message =
            err.errors && err.errors[0]
                ? err.errors[0].message
                : 'Dados inválidos ou relacionados a registros inexistentes.';

        return res.status(400).json({
            error: message,
        });
    }

    // Erros internos.
    if (process.env.NODE_ENV !== 'test') {
        console.error('[Internal Error]:', err);
    }

    return res.status(500).json({
        error: 'Erro interno do servidor.',
    });
}

module.exports = errorMiddleware