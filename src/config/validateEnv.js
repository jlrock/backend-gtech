require('dotenv').config();

function validateEnv() {
    const errors = [];

    const nodeEnv = process.env.NODE_ENV || 'development';

    if (!process.env.DB_HOST) {
        errors.push('DB_HOST');
    }

    if (!process.env.DB_NAME) {
        errors.push('DB_NAME');
    }

    if (!process.env.DB_USER) {
        errors.push('DB_USER');
    }

    if (process.env.DB_PASS === undefined) {
        errors.push(
            'DB_PASS (defina vazio ou informe a senha do MySQL)'
        );
    }

    if (
        process.env.DB_PORT &&
        !/^\d+$/.test(process.env.DB_PORT)
    ) {
        errors.push('DB_PORT (deve ser numérico)');
    }

    if (
        !process.env.JWT_SECRET ||
        Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32
    ) {
        errors.push('JWT_SECRET (mínimo de 32 caracteres)');
    }

    if (
        process.env.PORT &&
        (
            !/^\d+$/.test(process.env.PORT) ||
            Number(process.env.PORT) < 1 ||
            Number(process.env.PORT) > 65535
        )
    ) {
        errors.push('PORT (deve estar entre 1 e 65535)');
    }

    if (
        !['development', 'test', 'production'].includes(nodeEnv)
    ) {
        errors.push('NODE_ENV (development, test ou production)');
    }

    if (errors.length > 0) {
        throw new Error(
            `Configuração inválida. Verifique: ${errors.join(', ')}.`
        );
    }
}

module.exports = validateEnv;