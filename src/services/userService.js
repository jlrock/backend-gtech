const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const { User } = require('../models');

const authConfig = require('../config/auth');

const AppError = require('../utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SALT_ROUNDS = 10;

/**
 * Valida se o valor é uma string não vazia.
 */
function isNonEmptyString(value) {
    return (
        typeof value === 'string' &&
        value.trim().length > 0
    );
}

/**
 * Converte e valida um ID inteiro positivo.
 */
function parsePositiveId(id) {
    if (!/^\d+$/.test(String(id))) {
        return null;
    }

    const parsed = Number(id);

    return parsed > 0 ? parsed : null;
}

class UserService {

    /**
     * Busca informações públicas do usuário pelo ID.
     */
    async getUserById(id) {
        const userId = parsePositiveId(id);

        if (!userId) {
            throw new AppError(
                'Usuário não encontrado.',
                404
            );
        }

        const user = await User.findByPk(userId, {
            attributes: [
                'id',
                'firstname',
                'surname',
                'email',
            ],
        });

        if (!user) {
            throw new AppError(
                'Usuário não encontrado.',
                404
            );
        }

        return {
            id: user.id,
            firstname: user.firstname,
            surname: user.surname,
            email: user.email,
        };
    }

    /**
     * Realiza o cadastro de um novo usuário
     * com senha criptografada via bcrypt.
     */
    async createUser({
        firstname,
        surname,
        email,
        password,
        confirmPassword,
    }) {
        if (
            !isNonEmptyString(firstname) ||
            !isNonEmptyString(surname) ||
            !isNonEmptyString(email) ||
            !isNonEmptyString(password) ||
            !isNonEmptyString(confirmPassword)
        ) {
            throw new AppError(
                'Todos os campos (firstname, surname, email, password, confirmPassword) são obrigatórios.',
                400
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            throw new AppError(
                'Formato de e-mail inválido.',
                400
            );
        }

        if (password !== confirmPassword) {
            throw new AppError(
                'A senha e a confirmação de senha devem ser iguais.',
                400
            );
        }

        const existingUser = await User.findOne({
            where: {
                email: normalizedEmail,
            },
        });

        if (existingUser) {
            throw new AppError(
                'E-mail já cadastrado.',
                400
            );
        }

        const hashedPassword = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );

        const user = await User.create({
            firstname: firstname.trim(),
            surname: surname.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        return {
            id: user.id,
            firstname: user.firstname,
            surname: user.surname,
            email: user.email,
        };
    }

    /**
     * Atualiza os dados cadastrais
     * de um usuário existente.
     */
    async updateUser(id, {
        firstname,
        surname,
        email,
    }) {
        const userId = parsePositiveId(id);

        if (!userId) {
            throw new AppError(
                'Usuário não encontrado.',
                404
            );
        }

        const user = await User.findByPk(userId);

        if (!user) {
            throw new AppError(
                'Usuário não encontrado.',
                404
            );
        }

        if (
            !isNonEmptyString(firstname) ||
            !isNonEmptyString(surname) ||
            !isNonEmptyString(email)
        ) {
            throw new AppError(
                'Os campos firstname, surname e email são obrigatórios.',
                400
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            throw new AppError(
                'Formato de e-mail inválido.',
                400
            );
        }

        const emailInUse = await User.findOne({
            where: {
                email: normalizedEmail,
                id: {
                    [Op.ne]: userId,
                },
            },
        });

        if (emailInUse) {
            throw new AppError(
                'E-mail já está em uso por outro usuário.',
                400
            );
        }

        await user.update({
            firstname: firstname.trim(),
            surname: surname.trim(),
            email: normalizedEmail,
        });
    }

    /**
     * Remove um usuário pelo ID.
     */
    async deleteUser(id) {
        const userId = parsePositiveId(id);

        if (!userId) {
            throw new AppError(
                'Usuário não encontrado.',
                404
            );
        }

        const user = await User.findByPk(userId);

        if (!user) {
            throw new AppError(
                'Usuário não encontrado.',
                404
            );
        }

        await user.destroy();
    }

    /**
     * Autentica o usuário via e-mail e senha
     * e retorna um token JWT.
     */
    async authenticate({ email, password }) {
        if (
            !isNonEmptyString(email) ||
            !isNonEmptyString(password)
        ) {
            throw new AppError(
                'E-mail e senha são obrigatórios.',
                400
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            throw new AppError(
                'E-mail ou senha inválidos.',
                400
            );
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            throw new AppError(
                'E-mail ou senha inválidos.',
                400
            );
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            authConfig.secret,
            {
                expiresIn: authConfig.expiresIn,
                algorithm: authConfig.algorithm,
            }
        );

        return {
            token,
        };
    }
}

module.exports = new UserService();