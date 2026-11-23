class AppError extends Error {
    /*
     * @param {string} message - Mensagem amigável do erro.
     * @param {number} statusCode - Código HTTP correspondente (ex: 400, 401, 404).
     */
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError