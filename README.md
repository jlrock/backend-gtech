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