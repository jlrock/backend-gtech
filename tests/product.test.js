const request = require('supertest');
const jwt = require('jsonwebtoken');
const authConfig = require('../src/config/auth');

const mockTransaction = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true),
};

jest.mock('../src/utils/imageHelper', () => {
    const actual = jest.requireActual('../src/utils/imageHelper');
    return {
        ...actual,
        saveImageContent: jest.fn(async (content) => {
            if (/^https?:\/\//i.test(content)) {
                return { path: content, isLocal: false };
            }
            return { path: 'media/products/mock-image.png', isLocal: true };
        }),
        deleteLocalImage: jest.fn().mockResolvedValue(undefined),
    };
});

jest.mock('../src/models', () => ({
    sequelize: {
        authenticate: jest.fn(),
        transaction: jest.fn(async () => mockTransaction),
    },
    User: {},
    Category: {
        findAll: jest.fn(),
    },
    Product: {
        findAndCountAll: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
    },
    ProductImage: {
        bulkCreate: jest.fn(),
        create: jest.fn(),
        findOne: jest.fn(),
        destroy: jest.fn(),
    },
    ProductOption: {
        findAll: jest.fn(),
        bulkCreate: jest.fn(),
        create: jest.fn(),
        findOne: jest.fn(),
        destroy: jest.fn(),
    },
    ProductCategory: {
        findAll: jest.fn(),
        bulkCreate: jest.fn(),
        destroy: jest.fn(),
    },
}));

const {
    Product,
    Category,
    ProductImage,
    ProductOption,
    ProductCategory,
} = require('../src/models');
const app = require('../src/app');

describe('Endpoints de Produtos (/v1/product)', () => {
    const validToken = jwt.sign({ id: 1, email: 'user@mail.com' }, authConfig.secret, {
        expiresIn: '1h',
    });

    const sampleProductRow = {
        id: 1,
        enabled: true,
        name: 'Produto 01',
        slug: 'produto-01',
        stock: 10,
        description: 'Descrição do produto 01',
        price: 119.9,
        price_with_discount: 99.9,
        categories: [{ id: 1 }, { id: 15 }],
        images: [{ id: 1, path: 'media/products/img1.png', enabled: true }],
        options: [
            {
                id: 1,
                title: 'Tamanho',
                shape: 'square',
                radius: 4,
                type: 'text',
                values: 'PP,GG,M',
            },
        ],
    };

    describe('GET /v1/product/search', () => {
        it('deve retornar 200 aplicando filtros e seleção de campos', async () => {
            ProductCategory.findAll.mockResolvedValue([{ product_id: 1 }]);
            ProductOption.findAll.mockResolvedValue([{ product_id: 1 }]);
            Product.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });
            Product.findAll.mockResolvedValue([sampleProductRow]);

            const res = await request(app).get(
                '/v1/product/search?limit=12&page=1&fields=name,images,price&match=Produto&category_ids=1,15&price-range=100-200&option[1]=GG,PP'
            );

            expect(res.status).toBe(200);
            expect(res.body.total).toBe(1);
            expect(res.body.limit).toBe(12);
            expect(res.body.page).toBe(1);
            expect(res.body.data).toEqual([
                {
                    name: 'Produto 01',
                    images: [
                        {
                            id: 1,
                            content: 'http://localhost:3000/media/products/img1.png',
                        },
                    ],
                    price: 119.9,
                },
            ]);
        });

        it('deve retornar 400 para price-range inválido', async () => {
            const res = await request(app).get('/v1/product/search?price-range=200-100');
            expect(res.status).toBe(400);
        });
    });

    describe('GET /v1/product/:id', () => {
        it('deve retornar 200 com produto formatado', async () => {
            Product.findByPk.mockResolvedValue(sampleProductRow);

            const res = await request(app).get('/v1/product/1');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                id: 1,
                enabled: true,
                name: 'Produto 01',
                slug: 'produto-01',
                stock: 10,
                description: 'Descrição do produto 01',
                price: 119.9,
                price_with_discount: 99.9,
                category_ids: [1, 15],
                images: [
                    {
                        id: 1,
                        content: 'http://localhost:3000/media/products/img1.png',
                    },
                ],
                options: [
                    {
                        id: 1,
                        title: 'Tamanho',
                        shape: 'square',
                        radius: 4,
                        type: 'text',
                        values: ['PP', 'GG', 'M'],
                    },
                ],
            });
        });

        it('deve retornar 404 quando produto não existir', async () => {
            Product.findByPk.mockResolvedValue(null);
            const res = await request(app).get('/v1/product/999');
            expect(res.status).toBe(404);
        });
    });

    describe('POST /v1/product', () => {
        it('deve retornar 401 sem token JWT', async () => {
            const res = await request(app).post('/v1/product').send({ name: 'Produto' });
            expect(res.status).toBe(401);
        });

        it('deve retornar 201 ao criar produto com imagens base64, categorias e opções', async () => {
            Category.findAll.mockResolvedValue([{ id: 1 }, { id: 15 }]);
            Product.create.mockResolvedValue({ id: 1 });
            ProductCategory.bulkCreate.mockResolvedValue([]);
            ProductImage.bulkCreate.mockResolvedValue([]);
            ProductOption.bulkCreate.mockResolvedValue([]);
            Product.findByPk.mockResolvedValue(sampleProductRow);

            const res = await request(app)
                .post('/v1/product')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    enabled: true,
                    name: 'Produto 01',
                    slug: 'produto-01',
                    stock: 10,
                    description: 'Descrição do produto 01',
                    price: 119.9,
                    price_with_discount: 99.9,
                    category_ids: [1, 15],
                    images: [{ type: 'image/png', content: 'base64 da imagem 1' }],
                    options: [
                        {
                            title: 'Tamanho',
                            shape: 'square',
                            radius: '4px',
                            type: 'text',
                            value: ['PP', 'GG', 'M'],
                        },
                        {
                            title: 'Cor',
                            shape: 'circle',
                            type: 'color',
                            values: ['#000', '#333'],
                        },
                    ],
                });

            expect(res.status).toBe(201);
            expect(res.body.id).toBe(1);
            expect(ProductOption.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ radius: 4, values: 'PP,GG,M' }),
                    expect.objectContaining({ radius: 0, values: '#000,#333' }),
                ]),
                expect.any(Object)
            );
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('deve retornar 400 se categoria informada não existir', async () => {
            Category.findAll.mockResolvedValue([{ id: 1 }]);

            const res = await request(app)
                .post('/v1/product')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    name: 'Produto 01',
                    slug: 'produto-01',
                    price: 119.9,
                    price_with_discount: 99.9,
                    category_ids: [1, 999],
                });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /v1/product/:id', () => {
        it('deve retornar 204 ao atualizar produto, imagens e opções', async () => {
            const mockProductUpdate = jest.fn().mockResolvedValue(true);
            const mockImageUpdate = jest.fn().mockResolvedValue(true);
            const mockImageDestroy = jest.fn().mockResolvedValue(true);
            const mockOptionUpdate = jest.fn().mockResolvedValue(true);
            const mockOptionDestroy = jest.fn().mockResolvedValue(true);

            Product.findByPk.mockResolvedValue({ id: 1, update: mockProductUpdate });
            Category.findAll.mockResolvedValue([{ id: 1 }]);
            ProductCategory.destroy.mockResolvedValue(1);
            ProductCategory.bulkCreate.mockResolvedValue([]);

            ProductImage.findOne
                .mockResolvedValueOnce({ id: 2, path: 'media/products/old2.png', destroy: mockImageDestroy })
                .mockResolvedValueOnce({ id: 1, path: 'media/products/old1.png', update: mockImageUpdate });
            ProductImage.create.mockResolvedValue({ id: 4 });

            ProductOption.findOne
                .mockResolvedValueOnce({ id: 1, destroy: mockOptionDestroy })
                .mockResolvedValueOnce({ id: 2, update: mockOptionUpdate });
            ProductOption.create.mockResolvedValue({ id: 3 });

            const res = await request(app)
                .put('/v1/product/1')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    name: 'Produto 01 atualizado',
                    price: 49.9,
                    category_ids: [1],
                    images: [
                        { type: 'image/png', content: 'base64 nova' },
                        { id: 2, deleted: true },
                        { id: 1, content: 'https://store.com/media/product-01/image-01.jpg' },
                    ],
                    options: [
                        { id: 1, deleted: true },
                        { id: 2, radius: '10px', value: ['42/43', '44/45'] },
                        { title: 'Tipo', shape: 'square', type: 'text', values: ['100% algodão'] },
                    ],
                });

            expect(res.status).toBe(204);
            expect(res.text).toBe('');
            expect(mockProductUpdate).toHaveBeenCalled();
            expect(mockImageDestroy).toHaveBeenCalled();
            expect(mockImageUpdate).toHaveBeenCalledWith(
                { path: 'https://store.com/media/product-01/image-01.jpg' },
                expect.any(Object)
            );
            expect(mockOptionDestroy).toHaveBeenCalled();
            expect(mockOptionUpdate).toHaveBeenCalledWith(
                { radius: 10, values: '42/43,44/45' },
                expect.any(Object)
            );
        });
    });

    describe('DELETE /v1/product/:id', () => {
        it('deve retornar 204 ao deletar produto existente', async () => {
            const mockDestroy = jest.fn().mockResolvedValue(true);
            Product.findByPk.mockResolvedValue({
                id: 1,
                images: [{ path: 'media/products/img1.png' }],
                destroy: mockDestroy,
            });

            const res = await request(app)
                .delete('/v1/product/1')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(204);
            expect(res.text).toBe('');
            expect(mockDestroy).toHaveBeenCalled();
        });
    });
});
