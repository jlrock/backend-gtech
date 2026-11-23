require("dotenv").config();

const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
    throw new Error(
        "JWT_SECRET deve estar configurada e possuir pelo menos 32 caracteres.",
    );
}

module.exports = {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
}