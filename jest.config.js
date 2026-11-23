module.exports = {
    testEnvironment: 'node',
    verbose: true,
    clearMocks: true,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
        '!src/database/migrations/**',
        '!src/config/swagger.js',
    ],
    testMatch: ['**/tests/**/*.test.js'],
};