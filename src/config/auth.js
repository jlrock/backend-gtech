require('dotenv').config();

const secret = process.env.JWT_SECRET;

if (
    typeof secret !== 'string' ||
    Buffer.byteLength(secret, 'utf8') < 32
) {
    throw new Error(
        'JWT_SECRET não configurada. Defina uma chave aleatória com pelo menos 32 caracteres no arquivo .env.'
    );
}

module.exports = {
    secret,

    expiresIn: process.env.JWT_EXPIRES_IN || '1d',

    algorithm: 'HS256',
};