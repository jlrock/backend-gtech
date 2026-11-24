const enabled = process.env.RUN_DB_INTEGRATION === '1';

const describeIntegration = enabled
    ? describe
    : describe.skip;

// Jest's setupFiles sets NODE_ENV=test before this module is loaded.
const {
    sequelize,
} = require('../../src/models');

describeIntegration(
    'Integração real com MySQL de testes',
    () => {

        afterAll(async () => {
            await sequelize.close();
        });

        it('conecta ao banco de testes', async () => {

            await expect(
                sequelize.authenticate()
            ).resolves.toBeUndefined();

        });

        it('confirma que as seis tabelas do escopo existem após as migrations', async () => {

            const [rows] = await sequelize.query(
                `SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE()`
            );

            const tables = new Set(
                rows.map((row) => row.TABLE_NAME)
            );

            [
                'users',
                'categories',
                'products',
                'product_images',
                'product_options',
                'product_categories',
            ].forEach((table) => {
                expect(tables.has(table)).toBe(true);
            });
        });
    }
);