require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados MySQL estabelecida com sucesso.');

        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
            console.log(`Documentação Swagger disponível em http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Não foi possível conectar ao banco de dados:', error);
        process.exit(1);
    }
}

startServer();
