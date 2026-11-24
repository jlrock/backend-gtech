require('dotenv').config();

const validateEnv = require('./config/validateEnv');

validateEnv();

const app = require('./app');

const { sequelize } = require('./models');

const PORT = Number(process.env.PORT) || 3000;

/**
 * Inicializa o servidor.
 */
async function startServer() {

    // Verifica a conexão com o banco.
    await sequelize.authenticate();

    console.log(
        'Conexão com o banco de dados MySQL estabelecida com sucesso.'
    );

    // Inicializa o servidor HTTP.
    const server = app.listen(PORT, () => {

        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );

        console.log(
            `Documentação Swagger disponível em http://localhost:${PORT}/api-docs`
        );
    });

    /**
     * Encerra o servidor e a conexão com o banco.
     */
    const shutdown = async (signal) => {

        console.log(
            `\n${signal} recebido. Encerrando servidor...`
        );

        server.close(async () => {

            try {
                await sequelize.close();

                process.exit(0);

            } catch (error) {

                console.error(
                    'Erro ao encerrar conexão com o banco:',
                    error
                );

                process.exit(1);
            }
        });
    };

    // Sinais de encerramento.
    process.once('SIGINT', () => {
        shutdown('SIGINT');
    });

    process.once('SIGTERM', () => {
        shutdown('SIGTERM');
    });

    return server;
}

// Inicializa somente quando este arquivo
// for executado diretamente.
if (require.main === module) {

    startServer().catch((error) => {

        console.error(
            'Não foi possível iniciar a aplicação:',
            error
        );

        process.exit(1);
    });
}

module.exports = startServer