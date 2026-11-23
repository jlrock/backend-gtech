Abaixo está o código completo, organizado no padrão **MVC + Services**, com **Sequelize Migrations**, **JWT**, **bcrypt**, **Swagger (OpenAPI 3.0)**, **Jest + Supertest** e **README.md** com guia de setup, atendendo integralmente a todos os requisitos do escopo (`Seção 01` a `Seção 05`) e critérios de avaliação do projeto.

> **Observação importante sobre autenticação (`Seção 05`)**: As rotas `POST /v1/user` (cadastro) e `POST /v1/user/token` (login) são públicas para permitir criar usuários e gerar tokens. Todas as demais rotas `POST`, `PUT` e `DELETE` exigem `Authorization: Bearer <jwt>` e retornam `401 Unauthorized` quando o cabeçalho/token está ausente ou inválido (conforme especificado em cada endpoint das Seções 02, 03 e 04 e na semântica HTTP do projeto).

---

## Estrutura Completa do Projeto

```text
project-root/
├── src/
│   ├── config/
│   │   ├── auth.js
│   │   ├── database.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── categoryController.js
│   │   ├── productController.js
│   │   └── userController.js
│   ├── database/
│   │   └── migrations/
│   │       ├── 20260101000001-create-users.js
│   │       ├── 20260101000002-create-categories.js
│   │       ├── 20260101000003-create-products.js
│   │       ├── 20260101000004-create-product-images.js
│   │       ├── 20260101000005-create-product-options.js
│   │       └── 20260101000006-create-product-categories.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── Category.js
│   │   ├── Product.js
│   │   ├── ProductCategory.js
│   │   ├── ProductImage.js
│   │   ├── ProductOption.js
│   │   ├── User.js
│   │   └── index.js
│   ├── routes/
│   │   ├── categoryRoutes.js
│   │   ├── index.js
│   │   ├── productRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── categoryService.js
│   │   ├── productService.js
│   │   └── userService.js
│   ├── utils/
│   │   ├── AppError.js
│   │   └── imageHelper.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── authMiddleware.test.js
│   ├── category.test.js
│   ├── product.test.js
│   └── user.test.js
├── uploads/
│   └── products/
│       └── .gitkeep
├── .env
├── .env.example
├── .gitignore
├── .sequelizerc
├── jest.config.js
├── package.json
└── README.md
```

---

## 1. Arquivos Raiz e Configuração

### `package.json`
```json
{
  "name": "projeto-backend-digital-store",
  "version": "1.0.0",
  "description": "API RESTful de E-commerce desenvolvida com Node.js, Express, MySQL, Sequelize, JWT, Jest e Swagger.",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --runInBand",
    "test:coverage": "jest --coverage --runInBand",
    "migrate": "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo:all"
  },
  "keywords": [
    "nodejs",
    "express",
    "mysql",
    "sequelize",
    "jwt",
    "jest",
    "swagger",
    "rest-api"
  ],
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.11.5",
    "sequelize": "^6.37.5",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.9",
    "sequelize-cli": "^6.6.2",
    "supertest": "^7.0.0"
  }
}
```

### `.sequelizerc`
```js
const path = require('path');

module.exports = {
  config: path.resolve('src', 'config', 'database.js'),
  'models-path': path.resolve('src', 'models'),
  'migrations-path': path.resolve('src', 'database', 'migrations'),
  'seeders-path': path.resolve('src', 'database', 'seeders'),
};
```

### `.env` e `.env.example`
```env
# Servidor
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=digital_store
DB_USER=root
DB_PASS=root

# Autenticação JWT
JWT_SECRET=sua_chave_secreta_super_segura_geracao_tech
JWT_EXPIRES_IN=1d
```

### `.gitignore`
```gitignore
node_modules/
.env
coverage/
uploads/products/*
!uploads/products/.gitkeep
*.log
```

### `uploads/products/.gitkeep`
*(Arquivo vazio para manter a pasta versionada no Git).*

### `jest.config.js`
```js
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
```

---

## 2. Configurações (`src/config/`)

### `src/config/database.js`
```js
require('dotenv').config();

const commonDefine = {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'digital_store',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    define: commonDefine,
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME_TEST || 'digital_store_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    define: commonDefine,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    define: commonDefine,
  },
};
```

### `src/config/auth.js`
```js
require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
```

### `src/config/swagger.js`
```js
/**
 * Especificação OpenAPI 3.0.3 para documentação interativa via Swagger UI (/api-docs).
 */
const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Digital Store API - Projeto Backend',
    version: '1.0.0',
    description:
      'API RESTful completa para gerenciamento de usuários, categorias e produtos com autenticação JWT.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local de desenvolvimento',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Geração de token JWT' },
    { name: 'Users', description: 'Operações CRUD de usuários' },
    { name: 'Categories', description: 'Operações CRUD de categorias' },
    { name: 'Products', description: 'Operações CRUD de produtos' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensagem descritiva do erro' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          firstname: { type: 'string', example: 'user firstname' },
          surname: { type: 'string', example: 'user surname' },
          email: { type: 'string', example: 'user@mail.com' },
        },
      },
      UserCreateInput: {
        type: 'object',
        required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'],
        properties: {
          firstname: { type: 'string', example: 'user firstname' },
          surname: { type: 'string', example: 'user surname' },
          email: { type: 'string', example: 'user@mail.com' },
          password: { type: 'string', example: '123@123' },
          confirmPassword: { type: 'string', example: '123@123' },
        },
      },
      UserUpdateInput: {
        type: 'object',
        required: ['firstname', 'surname', 'email'],
        properties: {
          firstname: { type: 'string', example: 'user firstname' },
          surname: { type: 'string', example: 'user surname' },
          email: { type: 'string', example: 'user@mail.com' },
        },
      },
      TokenInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'user@mail.com' },
          password: { type: 'string', example: '123@123' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Shoes' },
          slug: { type: 'string', example: 'shoes' },
          use_in_menu: { type: 'boolean', example: true },
        },
      },
      CategoryInput: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', example: 'Shoes' },
          slug: { type: 'string', example: 'shoes' },
          use_in_menu: { type: 'boolean', example: true },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          enabled: { type: 'boolean', example: true },
          name: { type: 'string', example: 'Produto 01' },
          slug: { type: 'string', example: 'produto-01' },
          stock: { type: 'integer', example: 10 },
          description: { type: 'string', example: 'Descrição do produto 01' },
          price: { type: 'number', example: 119.9 },
          price_with_discount: { type: 'number', example: 99.9 },
          category_ids: {
            type: 'array',
            items: { type: 'integer' },
            example: [1, 15],
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                content: {
                  type: 'string',
                  example: 'http://localhost:3000/media/products/img.png',
                },
              },
            },
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                title: { type: 'string', example: 'Cor' },
                shape: { type: 'string', enum: ['square', 'circle'] },
                radius: { type: 'integer', example: 4 },
                type: { type: 'string', enum: ['text', 'color'] },
                values: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['PP', 'GG', 'M'],
                },
              },
            },
          },
        },
      },
      ProductCreateInput: {
        type: 'object',
        required: ['name', 'slug', 'price', 'price_with_discount'],
        properties: {
          enabled: { type: 'boolean', example: true },
          name: { type: 'string', example: 'Produto 01' },
          slug: { type: 'string', example: 'produto-01' },
          stock: { type: 'integer', example: 10 },
          description: { type: 'string', example: 'Descrição do produto 01' },
          price: { type: 'number', example: 119.9 },
          price_with_discount: { type: 'number', example: 99.9 },
          category_ids: {
            type: 'array',
            items: { type: 'integer' },
            example: [1],
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'image/png' },
                content: { type: 'string', example: 'iVBORw0KGgo...' },
              },
            },
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Tamanho' },
                shape: { type: 'string', enum: ['square', 'circle'], example: 'square' },
                radius: { type: 'string', example: '4px' },
                type: { type: 'string', enum: ['text', 'color'], example: 'text' },
                values: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['PP', 'GG', 'M'],
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/v1/user/token': {
      post: {
        tags: ['Auth'],
        summary: 'Gerar token JWT de autenticação',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TokenInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Token gerado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { token: { type: 'string' } },
                },
              },
            },
          },
          400: {
            description: 'Credenciais inválidas ou dados incorretos',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/v1/user': {
      post: {
        tags: ['Users'],
        summary: 'Cadastrar novo usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserCreateInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuário criado com sucesso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } },
          },
          400: {
            description: 'Dados da requisição incorretos',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/v1/user/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obter informações do usuário pelo ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Usuário encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } },
          },
          404: { description: 'Usuário não encontrado' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Atualizar usuário',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdateInput' },
            },
          },
        },
        responses: {
          204: { description: 'Usuário atualizado com sucesso (sem corpo)' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado' },
          404: { description: 'Usuário não encontrado' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Deletar usuário',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: 'Usuário deletado com sucesso (sem corpo)' },
          401: { description: 'Não autorizado' },
          404: { description: 'Usuário não encontrado' },
        },
      },
    },
    '/v1/category/search': {
      get: {
        tags: ['Categories'],
        summary: 'Listar categorias com filtros e paginação',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'fields', in: 'query', schema: { type: 'string', example: 'name,slug' } },
          { name: 'use_in_menu', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: { description: 'Lista de categorias retornada com sucesso' },
          400: { description: 'Parâmetros de busca inválidos' },
        },
      },
    },
    '/v1/category': {
      post: {
        tags: ['Categories'],
        summary: 'Cadastrar nova categoria',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CategoryInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Categoria criada com sucesso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } },
          },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado' },
        },
      },
    },
    '/v1/category/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Obter categoria pelo ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Categoria encontrada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } },
          },
          404: { description: 'Categoria não encontrada' },
        },
      },
      put: {
        tags: ['Categories'],
        summary: 'Atualizar categoria',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CategoryInput' },
            },
          },
        },
        responses: {
          204: { description: 'Categoria atualizada com sucesso (sem corpo)' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado' },
          404: { description: 'Categoria não encontrada' },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Deletar categoria',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: 'Categoria deletada com sucesso (sem corpo)' },
          401: { description: 'Não autorizado' },
          404: { description: 'Categoria não encontrada' },
        },
      },
    },
    '/v1/product/search': {
      get: {
        tags: ['Products'],
        summary: 'Listar produtos com filtros e paginação',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'fields', in: 'query', schema: { type: 'string', example: 'name,images,price' } },
          { name: 'match', in: 'query', schema: { type: 'string', example: 'Tênis' } },
          { name: 'category_ids', in: 'query', schema: { type: 'string', example: '15,24' } },
          { name: 'price-range', in: 'query', schema: { type: 'string', example: '100-200' } },
        ],
        responses: {
          200: { description: 'Lista de produtos retornada com sucesso' },
          400: { description: 'Parâmetros inválidos' },
        },
      },
    },
    '/v1/product': {
      post: {
        tags: ['Products'],
        summary: 'Cadastrar novo produto',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductCreateInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Produto criado com sucesso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
          },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado' },
        },
      },
    },
    '/v1/product/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Obter informações do produto pelo ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Produto encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
          },
          404: { description: 'Produto não encontrado' },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Atualizar produto',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductCreateInput' },
            },
          },
        },
        responses: {
          204: { description: 'Produto atualizado com sucesso (sem corpo)' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado' },
          404: { description: 'Produto não encontrado' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Deletar produto',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: 'Produto deletado com sucesso (sem corpo)' },
          401: { description: 'Não autorizado' },
          404: { description: 'Produto não encontrado' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
```

---

## 3. Migrations (`src/database/migrations/`)

### `src/database/migrations/20260101000001-create-users.js`
```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      surname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
```

### `src/database/migrations/20260101000002-create-categories.js`
```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      use_in_menu: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('categories');
  },
};
```

### `src/database/migrations/20260101000003-create-products.js`
```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      use_in_menu: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      price_with_discount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
```

### `src/database/migrations/20260101000004-create-product-images.js`
```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_images', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
  },
};
```

### `src/database/migrations/20260101000005-create-product-options.js`
```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_options', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shape: {
        type: Sequelize.ENUM('square', 'circle'),
        allowNull: true,
        defaultValue: 'square',
      },
      radius: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      type: {
        type: Sequelize.ENUM('text', 'color'),
        allowNull: true,
        defaultValue: 'text',
      },
      values: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_options');
  },
};
```

### `src/database/migrations/20260101000006-create-product-categories.js`
```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_categories');
  },
};
```

---

## 4. Models (`src/models/`)

### `src/models/User.js`
```js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      surname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return User;
};
```

### `src/models/Category.js`
```js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      use_in_menu: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    },
    {
      tableName: 'categories',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Category;
};
```

### `src/models/Product.js`
```js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      use_in_menu: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      price_with_discount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      tableName: 'products',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Product;
};
```

### `src/models/ProductImage.js`
```js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductImage = sequelize.define(
    'ProductImage',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'product_images',
      timestamps: false,
      underscored: true,
    }
  );

  return ProductImage;
};
```

### `src/models/ProductOption.js`
```js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductOption = sequelize.define(
    'ProductOption',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shape: {
        type: DataTypes.ENUM('square', 'circle'),
        allowNull: true,
        defaultValue: 'square',
      },
      radius: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      type: {
        type: DataTypes.ENUM('text', 'color'),
        allowNull: true,
        defaultValue: 'text',
      },
      values: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'product_options',
      timestamps: false,
      underscored: true,
    }
  );

  return ProductOption;
};
```

### `src/models/ProductCategory.js`
```js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductCategory = sequelize.define(
    'ProductCategory',
    {
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'categories',
          key: 'id',
        },
      },
    },
    {
      tableName: 'product_categories',
      timestamps: false,
      underscored: true,
    }
  );

  return ProductCategory;
};
```

### `src/models/index.js`
```js
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);
const Product = require('./Product')(sequelize);
const ProductImage = require('./ProductImage')(sequelize);
const ProductOption = require('./ProductOption')(sequelize);
const ProductCategory = require('./ProductCategory')(sequelize);

// Associações entre Product e ProductImage (1:N)
Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  as: 'images',
  onDelete: 'CASCADE',
});
ProductImage.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// Associações entre Product e ProductOption (1:N)
Product.hasMany(ProductOption, {
  foreignKey: 'product_id',
  as: 'options',
  onDelete: 'CASCADE',
});
ProductOption.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// Associações N:N entre Product e Category através de ProductCategory
Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: 'product_id',
  otherKey: 'category_id',
  as: 'categories',
});
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: 'category_id',
  otherKey: 'product_id',
  as: 'products',
});

module.exports = {
  sequelize,
  Sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
};
```

---

## 5. Utilitários (`src/utils/`)

### `src/utils/AppError.js`
```js
/**
 * Classe customizada de erro operacional para padronizar status HTTP na API.
 */
class AppError extends Error {
  /**
   * @param {string} message - Mensagem amigável do erro.
   * @param {number} statusCode - Código HTTP correspondente (ex: 400, 401, 404).
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### `src/utils/imageHelper.js`
```js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AppError = require('./AppError');

const UPLOADS_PRODUCTS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'products');

const MIME_TO_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

/**
 * Salva uma imagem enviada em base64 (ou retorna a URL se já for HTTP/HTTPS).
 * @param {string} content - String base64, Data URI ou URL externa.
 * @param {string} [mimeType] - Tipo MIME opcional (ex: "image/png").
 * @param {string} [fallbackExt='.png'] - Extensão padrão caso não haja mimeType.
 * @returns {Promise<{ path: string, isLocal: boolean }>} Caminho relativo salvo ou URL externa.
 */
async function saveImageContent(content, mimeType, fallbackExt = '.png') {
  if (typeof content !== 'string' || content.trim() === '') {
    throw new AppError('O conteúdo (content) da imagem é obrigatório.', 400);
  }

  const trimmed = content.trim();

  // Caso seja uma URL externa já hospedada
  if (/^https?:\/\//i.test(trimmed)) {
    return { path: trimmed, isLocal: false };
  }

  let base64Data = trimmed;
  let ext = fallbackExt;

  // Suporta Data URI no formato "data:image/png;base64,..."
  const dataUriMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (dataUriMatch) {
    const detectedMime = dataUriMatch[1].toLowerCase();
    ext = MIME_TO_EXT[detectedMime] || fallbackExt;
    base64Data = dataUriMatch[2];
  } else if (mimeType) {
    const normalizedMime = String(mimeType).toLowerCase().trim();
    if (!MIME_TO_EXT[normalizedMime]) {
      throw new AppError(`Tipo de imagem não suportado: ${mimeType}`, 400);
    }
    ext = MIME_TO_EXT[normalizedMime];
  }

  fs.mkdirSync(UPLOADS_PRODUCTS_DIR, { recursive: true });

  const fileName = `${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(UPLOADS_PRODUCTS_DIR, fileName);
  const buffer = Buffer.from(base64Data, 'base64');

  await fs.promises.writeFile(fullPath, buffer);

  return {
    path: `media/products/${fileName}`,
    isLocal: true,
  };
}

/**
 * Remove uma imagem armazenada localmente no servidor.
 * @param {string} relativePath - Caminho salvo na coluna `path` do banco.
 */
async function deleteLocalImage(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.startsWith('media/products/')) {
    return;
  }

  const fileName = path.basename(relativePath);
  const fullPath = path.join(UPLOADS_PRODUCTS_DIR, fileName);

  try {
    await fs.promises.unlink(fullPath);
  } catch (err) {
    // Ignora caso o arquivo não exista mais no disco
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

/**
 * Monta a URL completa da imagem para resposta da API.
 * @param {string} storedPath - Caminho armazenado no banco.
 * @param {string} baseUrl - URL base do servidor (ex: http://localhost:3000).
 * @returns {string}
 */
function resolveImageUrl(storedPath, baseUrl) {
  if (!storedPath) return '';
  if (/^https?:\/\//i.test(storedPath)) {
    return storedPath;
  }
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
  const cleanPath = storedPath.replace(/^\/+/, '');
  return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
}

module.exports = {
  saveImageContent,
  deleteLocalImage,
  resolveImageUrl,
};
```

---

## 6. Middlewares (`src/middleware/`)

### `src/middleware/authMiddleware.js`
```js
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/**
 * Middleware de autenticação JWT.
 * Valida o cabeçalho `Authorization: Bearer <jwt>` e retorna 401 caso esteja ausente ou inválido.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autorização não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0]) || !parts[1]) {
    return res.status(401).json({ error: 'Token de autorização malformado.' });
  }

  const [, token] = parts;

  try {
    const decoded = jwt.verify(token, authConfig.secret);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token de autorização inválido ou expirado.' });
  }
}

module.exports = authMiddleware;
```

### `src/middleware/errorMiddleware.js`
```js
const AppError = require('../utils/AppError');

/**
 * Middleware global para tratamento centralizado de erros na aplicação Express.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  // Erro operacional customizado (400, 401, 404, etc.)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Erro de JSON malformado enviado pelo cliente
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }

  // Erros de validação ou restrição única do Sequelize
  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    const message = err.errors && err.errors[0] ? err.errors[0].message : 'Dados inválidos.';
    return res.status(400).json({ error: message });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('[Internal Error]:', err);
  }

  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = errorMiddleware;
```

---

## 7. Services (`src/services/`)

### `src/services/userService.js`
```js
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
  return typeof value === 'string' && value.trim().length > 0;
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
      throw new AppError('Usuário não encontrado.', 404);
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstname', 'surname', 'email'],
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return {
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
    };
  }

  /**
   * Realiza o cadastro de um novo usuário com senha criptografada via bcrypt.
   */
  async createUser({ firstname, surname, email, password, confirmPassword }) {
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
      throw new AppError('Formato de e-mail inválido.', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('A senha e a confirmação de senha devem ser iguais.', 400);
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new AppError('E-mail já cadastrado.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

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
   * Atualiza os dados cadastrais de um usuário existente.
   */
  async updateUser(id, { firstname, surname, email }) {
    const userId = parsePositiveId(id);
    if (!userId) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (
      !isNonEmptyString(firstname) ||
      !isNonEmptyString(surname) ||
      !isNonEmptyString(email)
    ) {
      throw new AppError('Os campos firstname, surname e email são obrigatórios.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new AppError('Formato de e-mail inválido.', 400);
    }

    const emailInUse = await User.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: userId },
      },
    });

    if (emailInUse) {
      throw new AppError('E-mail já está em uso por outro usuário.', 400);
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
      throw new AppError('Usuário não encontrado.', 404);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    await user.destroy();
  }

  /**
   * Autentica o usuário via e-mail e senha e retorna um token JWT.
   */
  async authenticate({ email, password }) {
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      throw new AppError('E-mail e senha são obrigatórios.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      throw new AppError('E-mail ou senha inválidos.', 400);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new AppError('E-mail ou senha inválidos.', 400);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      authConfig.secret,
      { expiresIn: authConfig.expiresIn }
    );

    return { token };
  }
}

module.exports = new UserService();
```

### `src/services/categoryService.js`
```js
const { Category } = require('../models');
const AppError = require('../utils/AppError');

const ALLOWED_FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePositiveId(id) {
  if (!/^\d+$/.test(String(id))) {
    return null;
  }
  const parsed = Number(id);
  return parsed > 0 ? parsed : null;
}

/**
 * Formata uma categoria garantindo retorno booleano limpo para `use_in_menu`.
 */
function formatCategory(categoryInstance, selectedFields = ALLOWED_FIELDS) {
  const plain = categoryInstance.get ? categoryInstance.get({ plain: true }) : categoryInstance;
  const result = {};

  for (const field of selectedFields) {
    if (field === 'use_in_menu') {
      result.use_in_menu = Boolean(plain.use_in_menu);
    } else if (plain[field] !== undefined) {
      result[field] = plain[field];
    }
  }

  return result;
}

class CategoryService {
  /**
   * Pesquisa categorias com paginação, seleção de campos e filtro `use_in_menu`.
   */
  async searchCategories(query) {
    // Validação de limit (padrão 12, -1 para retornar todos)
    let limit = 12;
    if (query.limit !== undefined) {
      const limitStr = String(query.limit).trim();
      if (!/^-?\d+$/.test(limitStr)) {
        throw new AppError('Parâmetro limit inválido.', 400);
      }
      limit = Number(limitStr);
      if (limit !== -1 && limit < 1) {
        throw new AppError('Parâmetro limit deve ser -1 ou maior que 0.', 400);
      }
    }

    // Validação de page (padrão 1)
    let page = 1;
    if (query.page !== undefined) {
      const pageStr = String(query.page).trim();
      if (!/^\d+$/.test(pageStr) || Number(pageStr) < 1) {
        throw new AppError('Parâmetro page deve ser um inteiro maior ou igual a 1.', 400);
      }
      page = Number(pageStr);
    }

    // Validação de fields
    let attributes = [...ALLOWED_FIELDS];
    if (query.fields !== undefined) {
      if (typeof query.fields !== 'string' || query.fields.trim() === '') {
        throw new AppError('Parâmetro fields inválido.', 400);
      }
      const requested = query.fields
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      if (requested.length === 0) {
        throw new AppError('Parâmetro fields não pode ser vazio.', 400);
      }

      const invalidField = requested.find((f) => !ALLOWED_FIELDS.includes(f));
      if (invalidField) {
        throw new AppError(`Campo inválido em fields: ${invalidField}`, 400);
      }
      attributes = [...new Set(requested)];
    }

    // Validação de use_in_menu
    const where = {};
    if (query.use_in_menu !== undefined) {
      const val = String(query.use_in_menu).trim().toLowerCase();
      if (!['true', 'false', '1', '0'].includes(val)) {
        throw new AppError('Parâmetro use_in_menu deve ser true ou false.', 400);
      }
      where.use_in_menu = val === 'true' || val === '1';
    }

    const queryOptions = {
      where,
      attributes,
      order: [['id', 'ASC']],
    };

    if (limit !== -1) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
    }

    const { count, rows } = await Category.findAndCountAll(queryOptions);

    return {
      data: rows.map((row) => formatCategory(row, attributes)),
      total: count,
      limit,
      page: limit === -1 ? 1 : page,
    };
  }

  /**
   * Retorna os dados de uma categoria pelo ID.
   */
  async getCategoryById(id) {
    const categoryId = parsePositiveId(id);
    if (!categoryId) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const category = await Category.findByPk(categoryId, {
      attributes: ALLOWED_FIELDS,
    });

    if (!category) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    return formatCategory(category);
  }

  /**
   * Cadastra uma nova categoria.
   */
  async createCategory({ name, slug, use_in_menu }) {
    if (!isNonEmptyString(name) || !isNonEmptyString(slug)) {
      throw new AppError('Os campos name e slug são obrigatórios.', 400);
    }

    if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
      throw new AppError('O campo use_in_menu deve ser booleano.', 400);
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim(),
      use_in_menu: use_in_menu !== undefined ? use_in_menu : false,
    });

    return formatCategory(category);
  }

  /**
   * Atualiza uma categoria existente.
   */
  async updateCategory(id, { name, slug, use_in_menu }) {
    const categoryId = parsePositiveId(id);
    if (!categoryId) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    if (!isNonEmptyString(name) || !isNonEmptyString(slug)) {
      throw new AppError('Os campos name e slug são obrigatórios.', 400);
    }

    if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
      throw new AppError('O campo use_in_menu deve ser booleano.', 400);
    }

    const updateData = {
      name: name.trim(),
      slug: slug.trim(),
    };

    if (use_in_menu !== undefined) {
      updateData.use_in_menu = use_in_menu;
    }

    await category.update(updateData);
  }

  /**
   * Exclui uma categoria pelo ID.
   */
  async deleteCategory(id) {
    const categoryId = parsePositiveId(id);
    if (!categoryId) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    await category.destroy();
  }
}

module.exports = new CategoryService();
```

### `src/services/productService.js`
```js
const { Op } = require('sequelize');
const {
  sequelize,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
  Category,
} = require('../models');
const AppError = require('../utils/AppError');
const {
  saveImageContent,
  deleteLocalImage,
  resolveImageUrl,
} = require('../utils/imageHelper');

const DEFAULT_PRODUCT_FIELDS = [
  'id',
  'enabled',
  'name',
  'slug',
  'stock',
  'description',
  'price',
  'price_with_discount',
  'category_ids',
  'images',
  'options',
];

const ALLOWED_PRODUCT_FIELDS = [
  ...DEFAULT_PRODUCT_FIELDS,
  'use_in_menu',
];

const ALLOWED_SHAPES = ['square', 'circle'];
const ALLOWED_OPTION_TYPES = ['text', 'color'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePositiveId(id) {
  if (!/^\d+$/.test(String(id))) {
    return null;
  }
  const parsed = Number(id);
  return parsed > 0 ? parsed : null;
}

/**
 * Converte valores como "4px" ou 4 para inteiro não negativo.
 */
function parseRadius(radius) {
  if (radius === undefined || radius === null) {
    return 0;
  }
  if (typeof radius === 'number') {
    if (!Number.isInteger(radius) || radius < 0) {
      throw new AppError('O campo radius deve ser um inteiro não negativo.', 400);
    }
    return radius;
  }
  if (typeof radius === 'string') {
    const match = radius.match(/^\s*(\d+)\s*(px)?\s*$/i);
    if (!match) {
      throw new AppError('O campo radius deve ser um inteiro ou valor em px válido (ex: "4px").', 400);
    }
    return Number(match[1]);
  }
  throw new AppError('Formato inválido para o campo radius.', 400);
}

/**
 * Normaliza `values` ou `value` de uma opção para string separada por vírgulas.
 */
function normalizeOptionValues(option) {
  const raw = option.values !== undefined ? option.values : option.value;

  if (Array.isArray(raw)) {
    const cleaned = raw.map((v) => String(v).trim()).filter(Boolean);
    if (cleaned.length === 0) {
      throw new AppError('Os valores da opção não podem estar vazios.', 400);
    }
    return cleaned.join(',');
  }

  if (typeof raw === 'string') {
    const cleaned = raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (cleaned.length === 0) {
      throw new AppError('Os valores da opção não podem estar vazios.', 400);
    }
    return cleaned.join(',');
  }

  throw new AppError('Os valores da opção (values/value) são obrigatórios.', 400);
}

/**
 * Formata uma instância de Product com suas associações para o contrato JSON da API.
 */
function formatProduct(productInstance, baseUrl, selectedFields = DEFAULT_PRODUCT_FIELDS) {
  const plain = productInstance.get ? productInstance.get({ plain: true }) : productInstance;
  const formatted = {};

  for (const field of selectedFields) {
    switch (field) {
      case 'enabled':
        formatted.enabled = Boolean(plain.enabled);
        break;
      case 'use_in_menu':
        formatted.use_in_menu = Boolean(plain.use_in_menu);
        break;
      case 'price':
        formatted.price = Number(plain.price);
        break;
      case 'price_with_discount':
        formatted.price_with_discount = Number(plain.price_with_discount);
        break;
      case 'category_ids':
        formatted.category_ids = Array.isArray(plain.categories)
          ? plain.categories.map((cat) => cat.id)
          : [];
        break;
      case 'images':
        formatted.images = Array.isArray(plain.images)
          ? plain.images.map((img) => ({
              id: img.id,
              content: resolveImageUrl(img.path, baseUrl),
            }))
          : [];
        break;
      case 'options':
        formatted.options = Array.isArray(plain.options)
          ? plain.options.map((opt) => ({
              id: opt.id,
              title: opt.title,
              shape: opt.shape,
              radius: opt.radius,
              type: opt.type,
              values: opt.values ? opt.values.split(',').map((v) => v.trim()) : [],
            }))
          : [];
        break;
      default:
        formatted[field] = plain[field];
        break;
    }
  }

  return formatted;
}

/**
 * Faz a interseção entre um conjunto acumulado de IDs e um novo array de IDs.
 */
function intersectIds(currentSet, newIds) {
  if (currentSet === null) {
    return new Set(newIds);
  }
  const incoming = new Set(newIds);
  return new Set([...currentSet].filter((id) => incoming.has(id)));
}

class ProductService {
  /**
   * Pesquisa produtos com paginação, seleção de campos e filtros avançados.
   */
  async searchProducts(query, baseUrl) {
    // 1. Paginação (limit e page)
    let limit = 12;
    if (query.limit !== undefined) {
      const limitStr = String(query.limit).trim();
      if (!/^-?\d+$/.test(limitStr)) {
        throw new AppError('Parâmetro limit inválido.', 400);
      }
      limit = Number(limitStr);
      if (limit !== -1 && limit < 1) {
        throw new AppError('Parâmetro limit deve ser -1 ou maior que 0.', 400);
      }
    }

    let page = 1;
    if (query.page !== undefined) {
      const pageStr = String(query.page).trim();
      if (!/^\d+$/.test(pageStr) || Number(pageStr) < 1) {
        throw new AppError('Parâmetro page deve ser um inteiro maior ou igual a 1.', 400);
      }
      page = Number(pageStr);
    }

    // 2. Seleção de campos (fields)
    let selectedFields = [...DEFAULT_PRODUCT_FIELDS];
    if (query.fields !== undefined) {
      if (typeof query.fields !== 'string' || query.fields.trim() === '') {
        throw new AppError('Parâmetro fields inválido.', 400);
      }
      const requested = query.fields
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      if (requested.length === 0) {
        throw new AppError('Parâmetro fields não pode ser vazio.', 400);
      }

      const invalid = requested.find((f) => !ALLOWED_PRODUCT_FIELDS.includes(f));
      if (invalid) {
        throw new AppError(`Campo inválido em fields: ${invalid}`, 400);
      }
      selectedFields = [...new Set(requested)];
    }

    // 3. Filtros na tabela products (match e price-range)
    const where = {};

    if (query.match !== undefined) {
      if (typeof query.match !== 'string') {
        throw new AppError('Parâmetro match inválido.', 400);
      }
      const term = query.match.trim();
      if (term.length > 0) {
        where[Op.or] = [
          { name: { [Op.like]: `%${term}%` } },
          { description: { [Op.like]: `%${term}%` } },
        ];
      }
    }

    if (query['price-range'] !== undefined) {
      const rangeStr = String(query['price-range']).trim();
      const parts = rangeStr.split('-');
      if (
        parts.length !== 2 ||
        !/^\d+(\.\d+)?$/.test(parts[0].trim()) ||
        !/^\d+(\.\d+)?$/.test(parts[1].trim())
      ) {
        throw new AppError('Parâmetro price-range deve seguir o formato min-max (ex: 100-200).', 400);
      }
      const min = Number(parts[0].trim());
      const max = Number(parts[1].trim());
      if (min > max) {
        throw new AppError('O valor mínimo de price-range não pode ser maior que o máximo.', 400);
      }
      where.price = { [Op.between]: [min, max] };
    }

    // 4. Filtros relacionais (category_ids e option[id]=val1,val2)
    let filteredProductIds = null;

    if (query.category_ids !== undefined) {
      const rawCatIds = String(query.category_ids)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (rawCatIds.length === 0 || rawCatIds.some((id) => !/^\d+$/.test(id) || Number(id) <= 0)) {
        throw new AppError('Parâmetro category_ids deve conter IDs inteiros positivos separados por vírgula.', 400);
      }

      const categoryIds = rawCatIds.map(Number);
      const links = await ProductCategory.findAll({
        where: { category_id: { [Op.in]: categoryIds } },
        attributes: ['product_id'],
      });

      filteredProductIds = intersectIds(
        filteredProductIds,
        links.map((l) => l.product_id)
      );
    }

    if (query.option !== undefined) {
      if (typeof query.option !== 'object' || Array.isArray(query.option) || query.option === null) {
        throw new AppError('Parâmetro option inválido.', 400);
      }

      const optionEntries = Object.entries(query.option);
      for (const [optKey, rawOptValues] of optionEntries) {
        if (typeof rawOptValues !== 'string' || rawOptValues.trim() === '') {
          throw new AppError(`Valores inválidos para option[${optKey}].`, 400);
        }

        const valuesList = rawOptValues
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);

        if (valuesList.length === 0) {
          throw new AppError(`Valores vazios para option[${optKey}].`, 400);
        }

        // Garante correspondência exata de tokens separados por vírgula
        const valueConditions = valuesList.flatMap((token) => [
          { values: { [Op.eq]: token } },
          { values: { [Op.like]: `${token},%` } },
          { values: { [Op.like]: `%,${token}` } },
          { values: { [Op.like]: `%,${token},%` } },
        ]);

        const optionWhere = {
          [Op.or]: valueConditions,
        };

        if (/^\d+$/.test(optKey)) {
          optionWhere.id = Number(optKey);
        } else {
          optionWhere.title = optKey;
        }

        const matchedOptions = await ProductOption.findAll({
          where: optionWhere,
          attributes: ['product_id'],
        });

        filteredProductIds = intersectIds(
          filteredProductIds,
          matchedOptions.map((o) => o.product_id)
        );
      }
    }

    // Se algum filtro relacional zerou os resultados, evita consultas desnecessárias
    if (filteredProductIds !== null && filteredProductIds.size === 0) {
      return {
        data: [],
        total: 0,
        limit,
        page: limit === -1 ? 1 : page,
      };
    }

    if (filteredProductIds !== null) {
      where.id = { [Op.in]: [...filteredProductIds] };
    }

    // 5. Busca paginada apenas dos IDs para evitar multiplicação de linhas pelos JOINs
    const idQueryOptions = {
      where,
      attributes: ['id'],
      order: [['id', 'ASC']],
    };

    if (limit !== -1) {
      idQueryOptions.limit = limit;
      idQueryOptions.offset = (page - 1) * limit;
    }

    const { count, rows: idRows } = await Product.findAndCountAll(idQueryOptions);

    if (idRows.length === 0) {
      return {
        data: [],
        total: count,
        limit,
        page: limit === -1 ? 1 : page,
      };
    }

    const pageIds = idRows.map((r) => r.id);

    // 6. Busca completa dos produtos com suas associações necessárias
    const include = [];
    if (selectedFields.includes('category_ids')) {
      include.push({ model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } });
    }
    if (selectedFields.includes('images')) {
      include.push({ model: ProductImage, as: 'images', attributes: ['id', 'path', 'enabled'] });
    }
    if (selectedFields.includes('options')) {
      include.push({
        model: ProductOption,
        as: 'options',
        attributes: ['id', 'title', 'shape', 'radius', 'type', 'values'],
      });
    }

    const products = await Product.findAll({
      where: { id: { [Op.in]: pageIds } },
      include,
      order: [['id', 'ASC']],
    });

    return {
      data: products.map((p) => formatProduct(p, baseUrl, selectedFields)),
      total: count,
      limit,
      page: limit === -1 ? 1 : page,
    };
  }

  /**
   * Busca um produto completo pelo ID.
   */
  async getProductById(id, baseUrl) {
    const productId = parsePositiveId(id);
    if (!productId) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const product = await Product.findByPk(productId, {
      include: [
        { model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } },
        { model: ProductImage, as: 'images', attributes: ['id', 'path', 'enabled'] },
        {
          model: ProductOption,
          as: 'options',
          attributes: ['id', 'title', 'shape', 'radius', 'type', 'values'],
        },
      ],
    });

    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    return formatProduct(product, baseUrl);
  }

  /**
   * Cria um produto juntamente com suas categorias, imagens e opções dentro de uma transação.
   */
  async createProduct(payload, baseUrl) {
    const {
      enabled,
      name,
      slug,
      use_in_menu,
      stock,
      description,
      price,
      price_with_discount,
      category_ids,
      images,
      options,
    } = payload;

    // Validações obrigatórias
    if (!isNonEmptyString(name) || !isNonEmptyString(slug)) {
      throw new AppError('Os campos name e slug são obrigatórios.', 400);
    }

    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      throw new AppError('O campo price é obrigatório e deve ser um número não negativo.', 400);
    }

    if (
      typeof price_with_discount !== 'number' ||
      !Number.isFinite(price_with_discount) ||
      price_with_discount < 0
    ) {
      throw new AppError(
        'O campo price_with_discount é obrigatório e deve ser um número não negativo.',
        400
      );
    }

    if (enabled !== undefined && typeof enabled !== 'boolean') {
      throw new AppError('O campo enabled deve ser booleano.', 400);
    }

    if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
      throw new AppError('O campo use_in_menu deve ser booleano.', 400);
    }

    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
      throw new AppError('O campo stock deve ser um inteiro não negativo.', 400);
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      throw new AppError('O campo description deve ser uma string.', 400);
    }

    // Validação de categorias
    let uniqueCategoryIds = [];
    if (category_ids !== undefined) {
      if (!Array.isArray(category_ids)) {
        throw new AppError('O campo category_ids deve ser um array de IDs.', 400);
      }
      if (category_ids.some((cid) => !Number.isInteger(cid) || cid <= 0)) {
        throw new AppError('Todos os valores em category_ids devem ser inteiros positivos.', 400);
      }
      uniqueCategoryIds = [...new Set(category_ids)];
      if (uniqueCategoryIds.length > 0) {
        const existingCategories = await Category.findAll({
          where: { id: { [Op.in]: uniqueCategoryIds } },
          attributes: ['id'],
        });
        if (existingCategories.length !== uniqueCategoryIds.length) {
          throw new AppError('Uma ou mais categorias informadas em category_ids não existem.', 400);
        }
      }
    }

    // Pré-validação de imagens e opções
    if (images !== undefined && !Array.isArray(images)) {
      throw new AppError('O campo images deve ser um array.', 400);
    }

    const preparedOptions = [];
    if (options !== undefined) {
      if (!Array.isArray(options)) {
        throw new AppError('O campo options deve ser um array.', 400);
      }
      for (const opt of options) {
        if (!opt || typeof opt !== 'object' || !isNonEmptyString(opt.title)) {
          throw new AppError('Cada opção deve conter um campo title válido.', 400);
        }
        const shape = opt.shape !== undefined ? opt.shape : 'square';
        if (!ALLOWED_SHAPES.includes(shape)) {
          throw new AppError('O campo shape da opção deve ser "square" ou "circle".', 400);
        }
        const type = opt.type !== undefined ? opt.type : 'text';
        if (!ALLOWED_OPTION_TYPES.includes(type)) {
          throw new AppError('O campo type da opção deve ser "text" ou "color".', 400);
        }
        const radius = parseRadius(opt.radius);
        const values = normalizeOptionValues(opt);

        preparedOptions.push({
          title: opt.title.trim(),
          shape,
          radius,
          type,
          values,
        });
      }
    }

    const savedLocalFiles = [];
    const transaction = await sequelize.transaction();

    try {
      const product = await Product.create(
        {
          enabled: enabled !== undefined ? enabled : false,
          name: name.trim(),
          slug: slug.trim(),
          use_in_menu: use_in_menu !== undefined ? use_in_menu : false,
          stock: stock !== undefined ? stock : 0,
          description: description !== undefined ? description : null,
          price,
          price_with_discount,
        },
        { transaction }
      );

      if (uniqueCategoryIds.length > 0) {
        await ProductCategory.bulkCreate(
          uniqueCategoryIds.map((categoryId) => ({
            product_id: product.id,
            category_id: categoryId,
          })),
          { transaction }
        );
      }

      if (images && images.length > 0) {
        const imageRecords = [];
        for (const img of images) {
          if (!img || typeof img !== 'object') {
            throw new AppError('Estrutura de imagem inválida.', 400);
          }
          const saved = await saveImageContent(img.content, img.type);
          if (saved.isLocal) {
            savedLocalFiles.push(saved.path);
          }
          imageRecords.push({
            product_id: product.id,
            enabled: img.enabled !== undefined ? Boolean(img.enabled) : false,
            path: saved.path,
          });
        }
        await ProductImage.bulkCreate(imageRecords, { transaction });
      }

      if (preparedOptions.length > 0) {
        await ProductOption.bulkCreate(
          preparedOptions.map((opt) => ({
            ...opt,
            product_id: product.id,
          })),
          { transaction }
        );
      }

      await transaction.commit();

      return this.getProductById(product.id, baseUrl);
    } catch (error) {
      await transaction.rollback();
      // Remove eventuais imagens salvas em disco caso a transação falhe
      await Promise.all(savedLocalFiles.map((filePath) => deleteLocalImage(filePath)));
      throw error;
    }
  }

  /**
   * Atualiza um produto e gerencia criação, edição e exclusão de imagens, opções e categorias.
   */
  async updateProduct(id, payload) {
    const productId = parsePositiveId(id);
    if (!productId) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const {
      enabled,
      name,
      slug,
      use_in_menu,
      stock,
      description,
      price,
      price_with_discount,
      category_ids,
      images,
      options,
    } = payload;

    const updateData = {};

    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean') {
        throw new AppError('O campo enabled deve ser booleano.', 400);
      }
      updateData.enabled = enabled;
    }

    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        throw new AppError('O campo name deve ser uma string não vazia.', 400);
      }
      updateData.name = name.trim();
    }

    if (slug !== undefined) {
      if (!isNonEmptyString(slug)) {
        throw new AppError('O campo slug deve ser uma string não vazia.', 400);
      }
      updateData.slug = slug.trim();
    }

    if (use_in_menu !== undefined) {
      if (typeof use_in_menu !== 'boolean') {
        throw new AppError('O campo use_in_menu deve ser booleano.', 400);
      }
      updateData.use_in_menu = use_in_menu;
    }

    if (stock !== undefined) {
      if (!Number.isInteger(stock) || stock < 0) {
        throw new AppError('O campo stock deve ser um inteiro não negativo.', 400);
      }
      updateData.stock = stock;
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        throw new AppError('O campo description deve ser uma string.', 400);
      }
      updateData.description = description;
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
        throw new AppError('O campo price deve ser um número não negativo.', 400);
      }
      updateData.price = price;
    }

    if (price_with_discount !== undefined) {
      if (
        typeof price_with_discount !== 'number' ||
        !Number.isFinite(price_with_discount) ||
        price_with_discount < 0
      ) {
        throw new AppError('O campo price_with_discount deve ser um número não negativo.', 400);
      }
      updateData.price_with_discount = price_with_discount;
    }

    let uniqueCategoryIds = null;
    if (category_ids !== undefined) {
      if (!Array.isArray(category_ids) || category_ids.some((cid) => !Number.isInteger(cid) || cid <= 0)) {
        throw new AppError('O campo category_ids deve ser um array de inteiros positivos.', 400);
      }
      uniqueCategoryIds = [...new Set(category_ids)];
      if (uniqueCategoryIds.length > 0) {
        const existingCategories = await Category.findAll({
          where: { id: { [Op.in]: uniqueCategoryIds } },
          attributes: ['id'],
        });
        if (existingCategories.length !== uniqueCategoryIds.length) {
          throw new AppError('Uma ou mais categorias informadas em category_ids não existem.', 400);
        }
      }
    }

    if (images !== undefined && !Array.isArray(images)) {
      throw new AppError('O campo images deve ser um array.', 400);
    }

    if (options !== undefined && !Array.isArray(options)) {
      throw new AppError('O campo options deve ser um array.', 400);
    }

    const newLocalFiles = [];
    const filesToDeleteAfterCommit = [];
    const transaction = await sequelize.transaction();

    try {
      if (Object.keys(updateData).length > 0) {
        await product.update(updateData, { transaction });
      }

      if (uniqueCategoryIds !== null) {
        await ProductCategory.destroy({
          where: { product_id: productId },
          transaction,
        });
        if (uniqueCategoryIds.length > 0) {
          await ProductCategory.bulkCreate(
            uniqueCategoryIds.map((categoryId) => ({
              product_id: productId,
              category_id: categoryId,
            })),
            { transaction }
          );
        }
      }

      // Atualização incremental de imagens (criar, atualizar ou deletar)
      if (images) {
        for (const img of images) {
          if (!img || typeof img !== 'object') {
            throw new AppError('Item inválido no array images.', 400);
          }

          if (img.deleted === true) {
            const imgId = parsePositiveId(img.id);
            if (!imgId) {
              throw new AppError('ID válido obrigatório para exclusão de imagem.', 400);
            }
            const existingImg = await ProductImage.findOne({
              where: { id: imgId, product_id: productId },
              transaction,
            });
            if (!existingImg) {
              throw new AppError(`Imagem ${imgId} não encontrada para este produto.`, 404);
            }
            filesToDeleteAfterCommit.push(existingImg.path);
            await existingImg.destroy({ transaction });
          } else if (img.id !== undefined) {
            const imgId = parsePositiveId(img.id);
            if (!imgId) {
              throw new AppError('ID de imagem inválido.', 400);
            }
            const existingImg = await ProductImage.findOne({
              where: { id: imgId, product_id: productId },
              transaction,
            });
            if (!existingImg) {
              throw new AppError(`Imagem ${imgId} não encontrada para este produto.`, 404);
            }

            const imgUpdate = {};
            if (img.content !== undefined) {
              const oldExt = existingImg.path.match(/\.[a-z0-9]+$/i)?.[0] || '.png';
              const saved = await saveImageContent(img.content, img.type, oldExt);
              if (saved.isLocal) {
                newLocalFiles.push(saved.path);
              }
              filesToDeleteAfterCommit.push(existingImg.path);
              imgUpdate.path = saved.path;
            }
            if (img.enabled !== undefined) {
              imgUpdate.enabled = Boolean(img.enabled);
            }

            if (Object.keys(imgUpdate).length > 0) {
              await existingImg.update(imgUpdate, { transaction });
            }
          } else {
            const saved = await saveImageContent(img.content, img.type);
            if (saved.isLocal) {
              newLocalFiles.push(saved.path);
            }
            await ProductImage.create(
              {
                product_id: productId,
                enabled: img.enabled !== undefined ? Boolean(img.enabled) : false,
                path: saved.path,
              },
              { transaction }
            );
          }
        }
      }

      // Atualização incremental de opções (criar, atualizar ou deletar)
      if (options) {
        for (const opt of options) {
          if (!opt || typeof opt !== 'object') {
            throw new AppError('Item inválido no array options.', 400);
          }

          if (opt.deleted === true) {
            const optId = parsePositiveId(opt.id);
            if (!optId) {
              throw new AppError('ID válido obrigatório para exclusão de opção.', 400);
            }
            const existingOpt = await ProductOption.findOne({
              where: { id: optId, product_id: productId },
              transaction,
            });
            if (!existingOpt) {
              throw new AppError(`Opção ${optId} não encontrada para este produto.`, 404);
            }
            await existingOpt.destroy({ transaction });
          } else if (opt.id !== undefined) {
            const optId = parsePositiveId(opt.id);
            if (!optId) {
              throw new AppError('ID de opção inválido.', 400);
            }
            const existingOpt = await ProductOption.findOne({
              where: { id: optId, product_id: productId },
              transaction,
            });
            if (!existingOpt) {
              throw new AppError(`Opção ${optId} não encontrada para este produto.`, 404);
            }

            const optUpdate = {};
            if (opt.title !== undefined) {
              if (!isNonEmptyString(opt.title)) {
                throw new AppError('O campo title da opção não pode ser vazio.', 400);
              }
              optUpdate.title = opt.title.trim();
            }
            if (opt.shape !== undefined) {
              if (!ALLOWED_SHAPES.includes(opt.shape)) {
                throw new AppError('O campo shape da opção deve ser "square" ou "circle".', 400);
              }
              optUpdate.shape = opt.shape;
            }
            if (opt.radius !== undefined) {
              optUpdate.radius = parseRadius(opt.radius);
            }
            if (opt.type !== undefined) {
              if (!ALLOWED_OPTION_TYPES.includes(opt.type)) {
                throw new AppError('O campo type da opção deve ser "text" ou "color".', 400);
              }
              optUpdate.type = opt.type;
            }
            if (opt.values !== undefined || opt.value !== undefined) {
              optUpdate.values = normalizeOptionValues(opt);
            }

            if (Object.keys(optUpdate).length > 0) {
              await existingOpt.update(optUpdate, { transaction });
            }
          } else {
            if (!isNonEmptyString(opt.title)) {
              throw new AppError('Cada nova opção deve conter o campo title.', 400);
            }
            const shape = opt.shape !== undefined ? opt.shape : 'square';
            if (!ALLOWED_SHAPES.includes(shape)) {
              throw new AppError('O campo shape da opção deve ser "square" ou "circle".', 400);
            }
            const type = opt.type !== undefined ? opt.type : 'text';
            if (!ALLOWED_OPTION_TYPES.includes(type)) {
              throw new AppError('O campo type da opção deve ser "text" ou "color".', 400);
            }
            const radius = parseRadius(opt.radius);
            const values = normalizeOptionValues(opt);

            await ProductOption.create(
              {
                product_id: productId,
                title: opt.title.trim(),
                shape,
                radius,
                type,
                values,
              },
              { transaction }
            );
          }
        }
      }

      await transaction.commit();

      // Remove apenas após confirmação da transação no banco
      await Promise.all(filesToDeleteAfterCommit.map((filePath) => deleteLocalImage(filePath)));
    } catch (error) {
      await transaction.rollback();
      await Promise.all(newLocalFiles.map((filePath) => deleteLocalImage(filePath)));
      throw error;
    }
  }

  /**
   * Remove um produto e limpa suas imagens locais associadas.
   */
  async deleteProduct(id) {
    const productId = parsePositiveId(id);
    if (!productId) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: 'images', attributes: ['path'] }],
    });

    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const imagePaths = Array.isArray(product.images) ? product.images.map((i) => i.path) : [];

    const transaction = await sequelize.transaction();
    try {
      await ProductCategory.destroy({ where: { product_id: productId }, transaction });
      await ProductImage.destroy({ where: { product_id: productId }, transaction });
      await ProductOption.destroy({ where: { product_id: productId }, transaction });
      await product.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await Promise.all(imagePaths.map((filePath) => deleteLocalImage(filePath)));
  }
}

module.exports = new ProductService();
```

---

## 8. Controllers (`src/controllers/`)

### `src/controllers/userController.js`
```js
const userService = require('../services/userService');

class UserController {
  /**
   * GET /v1/user/:id
   */
  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /v1/user
   */
  async create(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /v1/user/:id
   */
  async update(req, res, next) {
    try {
      await userService.updateUser(req.params.id, req.body);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  /**
   * DELETE /v1/user/:id
   */
  async delete(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /v1/user/token
   */
  async generateToken(req, res, next) {
    try {
      const result = await userService.authenticate(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
```

### `src/controllers/categoryController.js`
```js
const categoryService = require('../services/categoryService');

class CategoryController {
  /**
   * GET /v1/category/search
   */
  async search(req, res, next) {
    try {
      const result = await categoryService.searchCategories(req.query);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /v1/category/:id
   */
  async getById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      return res.status(200).json(category);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /v1/category
   */
  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      return res.status(201).json(category);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /v1/category/:id
   */
  async update(req, res, next) {
    try {
      await categoryService.updateCategory(req.params.id, req.body);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  /**
   * DELETE /v1/category/:id
   */
  async delete(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new CategoryController();
```

### `src/controllers/productController.js`
```js
const productService = require('../services/productService');

/**
 * Monta a URL base do servidor a partir das variáveis de ambiente ou da requisição.
 */
function getBaseUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  return `${req.protocol}://${req.get('host')}`;
}

class ProductController {
  /**
   * GET /v1/product/search
   */
  async search(req, res, next) {
    try {
      const result = await productService.searchProducts(req.query, getBaseUrl(req));
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /v1/product/:id
   */
  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id, getBaseUrl(req));
      return res.status(200).json(product);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /v1/product
   */
  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body, getBaseUrl(req));
      return res.status(201).json(product);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /v1/product/:id
   */
  async update(req, res, next) {
    try {
      await productService.updateProduct(req.params.id, req.body);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  /**
   * DELETE /v1/product/:id
   */
  async delete(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ProductController();
```

---

## 9. Rotas (`src/routes/`)

### `src/routes/userRoutes.js`
```js
const { Router } = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// Rotas públicas de cadastro e geração de token JWT
router.post('/token', userController.generateToken);
router.post('/', userController.create);
router.get('/:id', userController.getById);

// Rotas protegidas por token JWT
router.put('/:id', authMiddleware, userController.update);
router.delete('/:id', authMiddleware, userController.delete);

module.exports = router;
```

### `src/routes/categoryRoutes.js`
```js
const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// ATENÇÃO: `/search` precisa vir antes de `/:id` para evitar conflito de rota no Express
router.get('/search', categoryController.search);
router.get('/:id', categoryController.getById);

// Rotas protegidas por token JWT
router.post('/', authMiddleware, categoryController.create);
router.put('/:id', authMiddleware, categoryController.update);
router.delete('/:id', authMiddleware, categoryController.delete);

module.exports = router;
```

### `src/routes/productRoutes.js`
```js
const { Router } = require('express');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// ATENÇÃO: `/search` precisa vir antes de `/:id` para evitar conflito de rota no Express
router.get('/search', productController.search);
router.get('/:id', productController.getById);

// Rotas protegidas por token JWT
router.post('/', authMiddleware, productController.create);
router.put('/:id', authMiddleware, productController.update);
router.delete('/:id', authMiddleware, productController.delete);

module.exports = router;
```

### `src/routes/index.js`
```js
const { Router } = require('express');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');

const router = Router();

router.use('/user', userRoutes);
router.use('/category', categoryRoutes);
router.use('/product', productRoutes);

module.exports = router;
```

---

## 10. Aplicação e Inicialização (`src/app.js` e `src/server.js`)

### `src/app.js`
```js
const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Limite ampliado para suportar imagens em base64
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos de imagens de produtos
app.use('/media', express.static(path.resolve(__dirname, '..', 'uploads')));

// Documentação interativa da API via Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthcheck simples
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rotas versionadas da API
app.use('/v1', routes);

// Fallback para rotas inexistentes
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Tratamento global de erros
app.use(errorMiddleware);

module.exports = app;
```

### `src/server.js`
```js
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
```

---

## 11. Testes Automatizados com Jest & Supertest (`tests/`)

### `tests/authMiddleware.test.js`
```js
const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/authMiddleware');
const authConfig = require('../src/config/auth');

describe('Middleware de Autenticação (authMiddleware)', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('deve retornar 401 quando o cabeçalho Authorization não for enviado', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de autorização não fornecido.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 quando o cabeçalho Authorization estiver malformado', () => {
    const req = { headers: { authorization: 'InvalidFormatToken' } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 quando o token JWT for inválido', () => {
    const req = { headers: { authorization: 'Bearer token_invalido' } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de autorização inválido ou expirado.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve chamar next() e preencher req.userId quando o token JWT for válido', () => {
    const token = jwt.sign({ id: 42, email: 'user@mail.com' }, authConfig.secret, {
      expiresIn: '1h',
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(42);
    expect(req.userEmail).toBe('user@mail.com');
  });
});
```

### `tests/user.test.js`
```js
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
```

### `tests/category.test.js`
```js
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
```

### `tests/product.test.js`
```js
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
```

---

## 12. Documentação do Projeto (`README.md`)

### `README.md`
```markdown
# Projeto Back-end - Digital Store API (Geração Tech 4.0)

API RESTful completa para plataforma de e-commerce desenvolvida em **Node.js**, **Express.js**, **MySQL**, **Sequelize ORM (com Migrations)**, **JWT**, **bcrypt**, **Swagger** e **Jest**.

---

## Tecnologias Utilizadas

- **Node.js** & **Express.js** — Servidor e roteamento RESTful
- **MySQL** & **Sequelize ORM** — Persistência relacional e Migrations
- **bcrypt** — Hash seguro de senhas
- **JSON Web Token (JWT)** — Autenticação e proteção de rotas
- **Dotenv** — Gerenciamento de variáveis de ambiente
- **Swagger UI** — Documentação interativa da API (OpenAPI 3.0)
- **Jest** & **Supertest** — Testes automatizados unitários e de integração
- **Nodemon** — Produtividade em ambiente de desenvolvimento

---

## Arquitetura do Projeto (MVC + Services)

```text
project-root/
├── src/
│   ├── config/          # Configurações de banco, JWT e Swagger
│   ├── controllers/     # Camada de entrada/saída HTTP
│   ├── database/
│   │   └── migrations/  # Versionamento da estrutura do banco MySQL
│   ├── middleware/      # Autenticação JWT e tratamento global de erros
│   ├── models/          # Modelos e associações Sequelize
│   ├── routes/          # Definição das rotas /v1
│   ├── services/        # Regras de negócio e validações
│   ├── utils/           # Classes de erro e manipulador de imagens base64
│   ├── app.js           # Configuração da instância Express
│   └── server.js        # Inicialização da conexão MySQL e servidor HTTP
├── tests/               # Suíte de testes automatizados (Jest + Supertest)
├── uploads/             # Armazenamento local de imagens enviadas via base64
├── .env.example
├── .sequelizerc
├── jest.config.js
└── package.json
```

---

## Guia de Setup e Execução

### 1. Pré-requisitos

- **Node.js** (v18+ recomendado)
- **MySQL** (v8.0+ rodando localmente ou via Docker)

### 2. Clonar e instalar dependências

```bash
git clone <url-do-seu-repositorio>
cd <nome-da-pasta>
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e ajuste as credenciais do seu MySQL:

```bash
cp .env.example .env
```

Exemplo do `.env`:
```env
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=digital_store
DB_USER=root
DB_PASS=root

JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRES_IN=1d
```

### 4. Criar o banco de dados e executar as Migrations

Crie o banco de dados no MySQL (caso ainda não exista):
```sql
CREATE DATABASE IF NOT EXISTS digital_store;
```

Execute todas as migrations do Sequelize:
```bash
npm run migrate
```

Para reverter as migrations, caso necessário:
```bash
npm run migrate:undo
```

### 5. Executar o servidor

- **Modo desenvolvimento (com hot-reload via Nodemon):**
  ```bash
  npm run dev
  ```
- **Modo produção:**
  ```bash
  npm start
  ```

O servidor será iniciado em `http://localhost:3000`.

---

## Documentação da API (Swagger)

Com a aplicação rodando, acesse a documentação interativa completa pelo navegador:

- **Swagger UI:** `http://localhost:3000/api-docs`

---

## Resumo dos Endpoints

### Autenticação & Usuários (`/v1/user`)
| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/user` | Pública | Cadastra um novo usuário (`201 Created`) |
| `POST` | `/v1/user/token` | Pública | Autentica e retorna o token JWT (`200 OK`) |
| `GET` | `/v1/user/:id` | Pública | Busca usuário pelo ID (`200 OK`) |
| `PUT` | `/v1/user/:id` | JWT Bearer | Atualiza usuário (`204 No Content`) |
| `DELETE` | `/v1/user/:id` | JWT Bearer | Remove usuário (`204 No Content`) |

### Categorias (`/v1/category`)
| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/category/search` | Pública | Lista categorias com `limit`, `page`, `fields`, `use_in_menu` |
| `GET` | `/v1/category/:id` | Pública | Busca categoria pelo ID |
| `POST` | `/v1/category` | JWT Bearer | Cadastra nova categoria |
| `PUT` | `/v1/category/:id` | JWT Bearer | Atualiza categoria |
| `DELETE` | `/v1/category/:id` | JWT Bearer | Remove categoria |

### Produtos (`/v1/product`)
| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/product/search` | Pública | Lista produtos com `limit`, `page`, `fields`, `match`, `category_ids`, `price-range`, `option[id]` |
| `GET` | `/v1/product/:id` | Pública | Busca produto detalhado pelo ID |
| `POST` | `/v1/product` | JWT Bearer | Cria produto (suporte a imagens base64, opções e categorias) |
| `PUT` | `/v1/product/:id` | JWT Bearer | Atualiza produto, imagens, opções e categorias |
| `DELETE` | `/v1/product/:id` | JWT Bearer | Remove produto e imagens vinculadas |

---

## Executando os Testes Automatizados

Os testes utilizam **Jest** e **Supertest** com mocks dos modelos Sequelize, podendo ser executados sem depender de conexão ativa com o MySQL:

```bash
# Executar todos os testes
npm test

# Executar com relatório de cobertura
npm run test:coverage
```
```

---

### Checklist rápida antes de enviar no seu repositório:
1. Crie os arquivos exatamente nos caminhos indicados acima.
2. Rode `npm install` para instalar todas as dependências e gerar o `package-lock.json`.
3. Crie o banco `digital_store` no seu MySQL local e execute `npm run migrate` para validar todas as 6 tabelas.
4. Execute `npm test` para confirmar todos os testes passando.
5. Suba o projeto com `npm run dev` e teste pelo Swagger em `http://localhost:3000/api-docs`.