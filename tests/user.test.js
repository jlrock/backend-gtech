const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authConfig = require('../src/config/auth');

// Mock dos models do Sequelize para isolar os testes da infraestrutura de banco
jest.mock('../src/models', () => ({
    sequelize: {
        authenticate: jest.fn(),
        transaction: jest.fn(),
    },
    User: {
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    },
    Category: {},
    Product: {},
    ProductImage: {},
    ProductOption: {},
    ProductCategory: {},
}));

const { User } = require('../src/models');
const app = require('../src/app');

describe('Endpoints de Usuários (/v1/user)', () => {
    const validToken = jwt.sign({ id: 1, email: 'user@mail.com' }, authConfig.secret, {
        expiresIn: '1h',
    });

    describe('GET /v1/user/:id', () => {
        it('deve retornar 200 e os dados públicos do usuário', async () => {
            User.findByPk.mockResolvedValue({
                id: 1,
                firstname: 'João',
                surname: 'Silva',
                email: 'joao@mail.com',
            });

            const res = await request(app).get('/v1/user/1');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                id: 1,
                firstname: 'João',
                surname: 'Silva',
                email: 'joao@mail.com',
            });
        });

        it('deve retornar 404 quando o usuário não existir', async () => {
            User.findByPk.mockResolvedValue(null);

            const res = await request(app).get('/v1/user/999');

            expect(res.status).toBe(404);
        });
    });

    describe('POST /v1/user', () => {
        it('deve retornar 201 ao cadastrar usuário válido com senha criptografada', async () => {
            User.findOne.mockResolvedValue(null);
            User.create.mockImplementation(async (data) => ({ id: 1, ...data }));

            const res = await request(app).post('/v1/user').send({
                firstname: 'Maria',
                surname: 'Oliveira',
                email: 'maria@mail.com',
                password: '123@123',
                confirmPassword: '123@123',
            });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({
                id: 1,
                firstname: 'Maria',
                surname: 'Oliveira',
                email: 'maria@mail.com',
            });
            expect(res.body.password).toBeUndefined();

            const createPayload = User.create.mock.calls[0][0];
            expect(createPayload.password).not.toBe('123@123');
            expect(await bcrypt.compare('123@123', createPayload.password)).toBe(true);
        });

        it('deve retornar 400 quando password e confirmPassword não coincidirem', async () => {
            const res = await request(app).post('/v1/user').send({
                firstname: 'Maria',
                surname: 'Oliveira',
                email: 'maria@mail.com',
                password: '123@123',
                confirmPassword: 'diferente',
            });

            expect(res.status).toBe(400);
        });

        it('deve retornar 400 quando o e-mail já estiver cadastrado', async () => {
            User.findOne.mockResolvedValue({ id: 2, email: 'maria@mail.com' });

            const res = await request(app).post('/v1/user').send({
                firstname: 'Maria',
                surname: 'Oliveira',
                email: 'maria@mail.com',
                password: '123@123',
                confirmPassword: '123@123',
            });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /v1/user/token', () => {
        it('deve retornar 200 com token JWT para credenciais válidas', async () => {
            const passwordHash = await bcrypt.hash('123@123', 10);
            User.findOne.mockResolvedValue({
                id: 1,
                email: 'user@mail.com',
                password: passwordHash,
            });

            const res = await request(app).post('/v1/user/token').send({
                email: 'user@mail.com',
                password: '123@123',
            });

            expect(res.status).toBe(200);
            expect(typeof res.body.token).toBe('string');
            const decoded = jwt.verify(res.body.token, authConfig.secret);
            expect(decoded.id).toBe(1);
        });

        it('deve retornar 400 quando a senha estiver incorreta', async () => {
            const passwordHash = await bcrypt.hash('123@123', 10);
            User.findOne.mockResolvedValue({
                id: 1,
                email: 'user@mail.com',
                password: passwordHash,
            });

            const res = await request(app).post('/v1/user/token').send({
                email: 'user@mail.com',
                password: 'senha_errada',
            });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /v1/user/:id', () => {
        it('deve retornar 401 se o token não for enviado', async () => {
            const res = await request(app).put('/v1/user/1').send({
                firstname: 'Novo',
                surname: 'Nome',
                email: 'novo@mail.com',
            });

            expect(res.status).toBe(401);
        });

        it('deve retornar 404 se o usuário não existir', async () => {
            User.findByPk.mockResolvedValue(null);

            const res = await request(app)
                .put('/v1/user/999')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    firstname: 'Novo',
                    surname: 'Nome',
                    email: 'novo@mail.com',
                });

            expect(res.status).toBe(404);
        });

        it('deve retornar 400 se os dados forem inválidos', async () => {
            User.findByPk.mockResolvedValue({ id: 1, update: jest.fn() });

            const res = await request(app)
                .put('/v1/user/1')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    firstname: '',
                    surname: 'Nome',
                    email: 'email_invalido',
                });

            expect(res.status).toBe(400);
        });

        it('deve retornar 204 sem corpo quando atualizado com sucesso', async () => {
            const mockUpdate = jest.fn().mockResolvedValue(true);
            User.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });
            User.findOne.mockResolvedValue(null);

            const res = await request(app)
                .put('/v1/user/1')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    firstname: 'João',
                    surname: 'Atualizado',
                    email: 'joao@mail.com',
                });

            expect(res.status).toBe(204);
            expect(res.text).toBe('');
            expect(mockUpdate).toHaveBeenCalledTimes(1);
        });
    });

    describe('DELETE /v1/user/:id', () => {
        it('deve retornar 401 sem token JWT', async () => {
            const res = await request(app).delete('/v1/user/1');
            expect(res.status).toBe(401);
        });

        it('deve retornar 404 quando usuário não existir', async () => {
            User.findByPk.mockResolvedValue(null);

            const res = await request(app)
                .delete('/v1/user/999')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
        });

        it('deve retornar 204 ao deletar com sucesso', async () => {
            const mockDestroy = jest.fn().mockResolvedValue(true);
            User.findByPk.mockResolvedValue({ id: 1, destroy: mockDestroy });

            const res = await request(app)
                .delete('/v1/user/1')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(204);
            expect(res.text).toBe('');
            expect(mockDestroy).toHaveBeenCalledTimes(1);
        });
    });
});
