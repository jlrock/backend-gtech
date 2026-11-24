const request = require('supertest');
const jwt = require('jsonwebtoken');
const authConfig = require('../src/config/auth');

jest.mock('../src/models', () => ({
    sequelize: {
        authenticate: jest.fn(),
        transaction: jest.fn(),
    },
    User: {},
    Category: {
        findAndCountAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
    },
    Product: {},
    ProductImage: {},
    ProductOption: {},
    ProductCategory: {},
}));

const { Category } = require('../src/models');
const app = require('../src/app');

describe('Endpoints de Categorias (/v1/category)', () => {
    const validToken = jwt.sign({ id: 1, email: 'user@mail.com' }, authConfig.secret, {
        expiresIn: '1h',
    });

    describe('GET /v1/category/search', () => {
        it('deve retornar 200 com lista paginada padrão e filtragem de campos', async () => {
            Category.findAndCountAll.mockResolvedValue({
                count: 2,
                rows: [
                    { name: 'Shoes', slug: 'shoes' },
                    { name: 'Offers', slug: 'offers' },
                ],
            });

            const res = await request(app).get(
                '/v1/category/search?limit=-1&fields=name,slug&use_in_menu=true'
            );

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                data: [
                    { name: 'Shoes', slug: 'shoes' },
                    { name: 'Offers', slug: 'offers' },
                ],
                total: 2,
                limit: -1,
                page: 1,
            });

            expect(Category.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { use_in_menu: true },
                    attributes: ['name', 'slug'],
                })
            );
        });

        it('deve retornar 400 se um campo inválido for passado em fields', async () => {
            const res = await request(app).get('/v1/category/search?fields=name,inexistente');
            expect(res.status).toBe(400);
        });
    });

    describe('GET /v1/category/:id', () => {
        it('deve retornar 200 com a categoria encontrada', async () => {
            Category.findByPk.mockResolvedValue({
                id: 1,
                name: 'Shoes',
                slug: 'shoes',
                use_in_menu: 1,
            });

            const res = await request(app).get('/v1/category/1');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                id: 1,
                name: 'Shoes',
                slug: 'shoes',
                use_in_menu: true,
            });
        });

        it('deve retornar 404 se a categoria não existir', async () => {
            Category.findByPk.mockResolvedValue(null);
            const res = await request(app).get('/v1/category/999');
            expect(res.status).toBe(404);
        });
    });

    describe('POST /v1/category', () => {
        it('deve retornar 401 sem autenticação', async () => {
            const res = await request(app).post('/v1/category').send({
                name: 'Shoes',
                slug: 'shoes',
                use_in_menu: true,
            });
            expect(res.status).toBe(401);
        });

        it('deve retornar 400 quando faltar campo obrigatório', async () => {
            const res = await request(app)
                .post('/v1/category')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Shoes' });

            expect(res.status).toBe(400);
        });

        it('deve retornar 201 ao criar categoria com sucesso', async () => {
            Category.create.mockImplementation(async (data) => ({ id: 1, ...data }));

            const res = await request(app)
                .post('/v1/category')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    name: 'Shoes',
                    slug: 'shoes',
                    use_in_menu: true,
                });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({
                id: 1,
                name: 'Shoes',
                slug: 'shoes',
                use_in_menu: true,
            });
        });
    });

    describe('PUT /v1/category/:id', () => {
        it('deve retornar 204 ao atualizar categoria com sucesso', async () => {
            const mockUpdate = jest.fn().mockResolvedValue(true);
            Category.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

            const res = await request(app)
                .put('/v1/category/1')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    name: 'Shoes Updated',
                    slug: 'shoes-updated',
                    use_in_menu: false,
                });

            expect(res.status).toBe(204);
            expect(res.text).toBe('');
            expect(mockUpdate).toHaveBeenCalledTimes(1);
        });

        it('deve retornar 404 quando a categoria não existir', async () => {
            Category.findByPk.mockResolvedValue(null);

            const res = await request(app)
                .put('/v1/category/999')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    name: 'Shoes',
                    slug: 'shoes',
                });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /v1/category/:id', () => {
        it('deve retornar 204 ao deletar categoria existente', async () => {
            const mockDestroy = jest.fn().mockResolvedValue(true);
            Category.findByPk.mockResolvedValue({ id: 1, destroy: mockDestroy });

            const res = await request(app)
                .delete('/v1/category/1')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(204);
            expect(res.text).toBe('');
        });
    });
});
