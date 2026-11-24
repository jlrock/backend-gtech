/**
 * Especificação OpenAPI 3.0.3
 * para documentação interativa via Swagger UI (/api-docs).
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
            url: process.env.APP_URL || 'http://localhost:3000',
            description: 'Servidor local de desenvolvimento',
        },
    ],

    tags: [
        {
            name: 'Auth',
            description: 'Geração de token JWT',
        },
        {
            name: 'Users',
            description: 'Operações CRUD de usuários',
        },
        {
            name: 'Categories',
            description: 'Operações CRUD de categorias',
        },
        {
            name: 'Products',
            description: 'Operações CRUD de produtos',
        },
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
                    error: {
                        type: 'string',
                        example: 'Mensagem descritiva do erro',
                    },
                },
            },

            UserResponse: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        example: 1,
                    },
                    firstname: {
                        type: 'string',
                        example: 'user firstname',
                    },
                    surname: {
                        type: 'string',
                        example: 'user surname',
                    },
                    email: {
                        type: 'string',
                        example: 'user@mail.com',
                    },
                },
            },

            UserCreateInput: {
                type: 'object',

                required: [
                    'firstname',
                    'surname',
                    'email',
                    'password',
                    'confirmPassword',
                ],

                properties: {
                    firstname: {
                        type: 'string',
                        example: 'user firstname',
                    },
                    surname: {
                        type: 'string',
                        example: 'user surname',
                    },
                    email: {
                        type: 'string',
                        example: 'user@mail.com',
                    },
                    password: {
                        type: 'string',
                        example: '123@123',
                    },
                    confirmPassword: {
                        type: 'string',
                        example: '123@123',
                    },
                },
            },

            UserUpdateInput: {
                type: 'object',

                required: [
                    'firstname',
                    'surname',
                    'email',
                ],

                properties: {
                    firstname: {
                        type: 'string',
                        example: 'user firstname',
                    },
                    surname: {
                        type: 'string',
                        example: 'user surname',
                    },
                    email: {
                        type: 'string',
                        example: 'user@mail.com',
                    },
                },
            },

            TokenInput: {
                type: 'object',

                required: [
                    'email',
                    'password',
                ],

                properties: {
                    email: {
                        type: 'string',
                        example: 'user@mail.com',
                    },
                    password: {
                        type: 'string',
                        example: '123@123',
                    },
                },
            },

            Category: {
                type: 'object',

                properties: {
                    id: {
                        type: 'integer',
                        example: 1,
                    },
                    name: {
                        type: 'string',
                        example: 'Shoes',
                    },
                    slug: {
                        type: 'string',
                        example: 'shoes',
                    },
                    use_in_menu: {
                        type: 'boolean',
                        example: true,
                    },
                },
            },

            CategoryInput: {
                type: 'object',

                required: [
                    'name',
                    'slug',
                ],

                properties: {
                    name: {
                        type: 'string',
                        example: 'Shoes',
                    },
                    slug: {
                        type: 'string',
                        example: 'shoes',
                    },
                    use_in_menu: {
                        type: 'boolean',
                        example: true,
                    },
                },
            },

            Product: {
                type: 'object',

                properties: {
                    id: {
                        type: 'integer',
                        example: 1,
                    },

                    enabled: {
                        type: 'boolean',
                        example: true,
                    },

                    use_in_menu: {
                        type: 'boolean',
                        example: false,
                    },

                    name: {
                        type: 'string',
                        example: 'Produto 01',
                    },

                    slug: {
                        type: 'string',
                        example: 'produto-01',
                    },

                    stock: {
                        type: 'integer',
                        example: 10,
                    },

                    description: {
                        type: 'string',
                        example: 'Descrição do produto 01',
                    },

                    price: {
                        type: 'number',
                        example: 119.9,
                    },

                    price_with_discount: {
                        type: 'number',
                        example: 99.9,
                    },

                    category_ids: {
                        type: 'array',

                        items: {
                            type: 'integer',
                        },

                        example: [1, 15],
                    },

                    images: {
                        type: 'array',

                        items: {
                            type: 'object',

                            properties: {
                                id: {
                                    type: 'integer',
                                    example: 1,
                                },

                                content: {
                                    type: 'string',
                                    example:
                                        'http://localhost:3000/media/products/img.png',
                                },
                            },
                        },
                    },

                    options: {
                        type: 'array',

                        items: {
                            type: 'object',

                            properties: {
                                id: {
                                    type: 'integer',
                                    example: 1,
                                },

                                title: {
                                    type: 'string',
                                    example: 'Cor',
                                },

                                shape: {
                                    type: 'string',
                                    enum: [
                                        'square',
                                        'circle',
                                    ],
                                },

                                radius: {
                                    type: 'integer',
                                    example: 4,
                                },

                                type: {
                                    type: 'string',
                                    enum: [
                                        'text',
                                        'color',
                                    ],
                                },

                                values: {
                                    type: 'array',

                                    items: {
                                        type: 'string',
                                    },

                                    example: [
                                        'PP',
                                        'GG',
                                        'M',
                                    ],
                                },
                            },
                        },
                    },
                },
            },

            ProductCreateInput: {
                type: 'object',

                required: [
                    'name',
                    'slug',
                    'price',
                    'price_with_discount',
                ],

                properties: {
                    enabled: {
                        type: 'boolean',
                        example: true,
                    },

                    use_in_menu: {
                        type: 'boolean',
                        example: false,
                    },

                    name: {
                        type: 'string',
                        example: 'Produto 01',
                    },

                    slug: {
                        type: 'string',
                        example: 'produto-01',
                    },

                    stock: {
                        type: 'integer',
                        example: 10,
                    },

                    description: {
                        type: 'string',
                        example: 'Descrição do produto 01',
                    },

                    price: {
                        type: 'number',
                        example: 119.9,
                    },

                    price_with_discount: {
                        type: 'number',
                        example: 99.9,
                    },

                    category_ids: {
                        type: 'array',

                        items: {
                            type: 'integer',
                        },

                        example: [1],
                    },

                    images: {
                        type: 'array',

                        items: {
                            type: 'object',

                            properties: {
                                type: {
                                    type: 'string',
                                    enum: [
                                        'image/png',
                                        'image/jpeg',
                                        'image/webp',
                                    ],
                                },

                                content: {
                                    type: 'string',
                                    example: 'iVBORw0KGgo...',
                                },

                                enabled: {
                                    type: 'boolean',
                                    example: false,
                                },
                            },
                        },
                    },

                    options: {
                        type: 'array',

                        items: {
                            type: 'object',

                            properties: {
                                title: {
                                    type: 'string',
                                    example: 'Tamanho',
                                },

                                shape: {
                                    type: 'string',
                                    enum: [
                                        'square',
                                        'circle',
                                    ],
                                    example: 'square',
                                },

                                radius: {
                                    type: 'string',
                                    example: '4px',
                                },

                                type: {
                                    type: 'string',
                                    enum: [
                                        'text',
                                        'color',
                                    ],
                                    example: 'text',
                                },

                                values: {
                                    type: 'array',

                                    items: {
                                        type: 'string',
                                    },

                                    example: [
                                        'PP',
                                        'GG',
                                        'M',
                                    ],
                                },
                            },
                        },
                    },
                },
            },

            ProductUpdateInput: {
                type: 'object',

                description:
                    'Todos os campos são opcionais. Imagens e opções podem ser criadas, atualizadas ou removidas por ID.',

                properties: {
                    enabled: {
                        type: 'boolean',
                        example: true,
                    },

                    use_in_menu: {
                        type: 'boolean',
                        example: false,
                    },

                    name: {
                        type: 'string',
                        example: 'Produto atualizado',
                    },

                    slug: {
                        type: 'string',
                        example: 'produto-atualizado',
                    },

                    stock: {
                        type: 'integer',
                        minimum: 0,
                        example: 8,
                    },

                    description: {
                        type: 'string',
                        nullable: true,
                    },

                    price: {
                        type: 'number',
                        minimum: 0,
                        example: 119.9,
                    },

                    price_with_discount: {
                        type: 'number',
                        minimum: 0,
                        example: 99.9,
                    },

                    category_ids: {
                        type: 'array',

                        items: {
                            type: 'integer',
                            minimum: 1,
                        },

                        example: [1, 2],
                    },

                    images: {
                        type: 'array',

                        maxItems: 10,

                        items: {
                            type: 'object',

                            properties: {
                                id: {
                                    type: 'integer',
                                    minimum: 1,
                                },

                                deleted: {
                                    type: 'boolean',
                                },

                                enabled: {
                                    type: 'boolean',
                                },

                                type: {
                                    type: 'string',
                                    enum: [
                                        'image/png',
                                        'image/jpeg',
                                        'image/webp',
                                    ],
                                },

                                content: {
                                    type: 'string',
                                    description:
                                        'Base64, Data URI ou URL HTTP(S).',
                                },
                            },
                        },
                    },

                    options: {
                        type: 'array',

                        items: {
                            type: 'object',

                            properties: {
                                id: {
                                    type: 'integer',
                                    minimum: 1,
                                },

                                deleted: {
                                    type: 'boolean',
                                },

                                title: {
                                    type: 'string',
                                },

                                shape: {
                                    type: 'string',
                                    enum: [
                                        'square',
                                        'circle',
                                    ],
                                },

                                radius: {
                                    oneOf: [
                                        {
                                            type: 'integer',
                                            minimum: 0,
                                        },
                                        {
                                            type: 'string',
                                            example: '4px',
                                        },
                                    ],
                                },

                                type: {
                                    type: 'string',
                                    enum: [
                                        'text',
                                        'color',
                                    ],
                                },

                                values: {
                                    type: 'array',

                                    items: {
                                        type: 'string',
                                    },
                                },

                                value: {
                                    oneOf: [
                                        {
                                            type: 'string',
                                        },
                                        {
                                            type: 'array',

                                            items: {
                                                type: 'string',
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    paths: {

        // AUTENTICAÇÃO

        '/v1/user/token': {
            post: {
                tags: ['Auth'],

                summary: 'Gerar token JWT de autenticação',

                requestBody: {
                    required: true,

                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TokenInput',
                            },
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

                                    properties: {
                                        token: {
                                            type: 'string',
                                        },
                                    },
                                },
                            },
                        },
                    },

                    400: {
                        description:
                            'Credenciais inválidas ou dados incorretos',

                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },

        // USUÁRIOS

        '/v1/user': {
            post: {
                tags: ['Users'],

                summary: 'Cadastrar novo usuário',

                requestBody: {
                    required: true,

                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UserCreateInput',
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description: 'Usuário criado com sucesso',

                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserResponse',
                                },
                            },
                        },
                    },

                    400: {
                        description: 'Dados da requisição incorretos',

                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },

        '/v1/user/{id}': {

            get: {
                tags: ['Users'],

                summary: 'Obter informações do usuário pelo ID',

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                responses: {
                    200: {
                        description: 'Usuário encontrado',

                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserResponse',
                                },
                            },
                        },
                    },

                    404: {
                        description: 'Usuário não encontrado',
                    },
                },
            },

            put: {
                tags: ['Users'],

                summary: 'Atualizar usuário',

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                requestBody: {
                    required: true,

                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UserUpdateInput',
                            },
                        },
                    },
                },

                responses: {
                    204: {
                        description: 'Usuário atualizado com sucesso (sem corpo)',
                    },

                    400: {
                        description: 'Dados inválidos',
                    },

                    401: {
                        description: 'Não autorizado',
                    },

                    403: {
                        description:
                            'Token válido, mas usuário não é o titular da conta',
                    },

                    404: {
                        description: 'Usuário não encontrado',
                    },
                },
            },

            delete: {
                tags: ['Users'],

                summary: 'Deletar usuário',

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                responses: {
                    204: {
                        description: 'Usuário deletado com sucesso (sem corpo)',
                    },

                    401: {
                        description: 'Não autorizado',
                    },

                    403: {
                        description:
                            'Token válido, mas usuário não é o titular da conta',
                    },

                    404: {
                        description: 'Usuário não encontrado',
                    },
                },
            },
        },

        // CATEGORIAS

        '/v1/category/search': {
            get: {
                tags: ['Categories'],

                summary: 'Listar categorias com filtros e paginação',

                parameters: [
                    {
                        name: 'limit',
                        in: 'query',
                        schema: {
                            type: 'integer',
                            default: 12,
                        },
                    },

                    {
                        name: 'page',
                        in: 'query',
                        schema: {
                            type: 'integer',
                            default: 1,
                        },
                    },

                    {
                        name: 'fields',
                        in: 'query',
                        schema: {
                            type: 'string',
                            example: 'name,slug',
                        },
                    },

                    {
                        name: 'use_in_menu',
                        in: 'query',
                        schema: {
                            type: 'boolean',
                        },
                    },
                ],

                responses: {
                    200: {
                        description:
                            'Lista de categorias retornada com sucesso',
                    },

                    400: {
                        description: 'Parâmetros de busca inválidos',
                    },
                },
            },
        },

        '/v1/category': {
            post: {
                tags: ['Categories'],

                summary: 'Cadastrar nova categoria',

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,

                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CategoryInput',
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description: 'Categoria criada com sucesso',

                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Category',
                                },
                            },
                        },
                    },

                    400: {
                        description: 'Dados inválidos',
                    },

                    401: {
                        description: 'Não autorizado',
                    },
                },
            },
        },

        '/v1/category/{id}': {

            get: {
                tags: ['Categories'],

                summary: 'Obter categoria pelo ID',

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                responses: {
                    200: {
                        description: 'Categoria encontrada',

                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Category',
                                },
                            },
                        },
                    },

                    404: {
                        description: 'Categoria não encontrada',
                    },
                },
            },

            put: {
                tags: ['Categories'],

                summary: 'Atualizar categoria',

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                requestBody: {
                    required: true,

                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CategoryInput',
                            },
                        },
                    },
                },

                responses: {
                    204: {
                        description: 'Categoria atualizada com sucesso (sem corpo)',
                    },

                    400: {
                        description: 'Dados inválidos',
                    },

                    401: {
                        description: 'Não autorizado',
                    },

                    404: {
                        description: 'Categoria não encontrada',
                    },
                },
            },

            delete: {
                tags: ['Categories'],

                summary: 'Deletar categoria',

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                responses: {
                    204: {
                        description: 'Categoria deletada com sucesso (sem corpo)',
                    },

                    401: {
                        description: 'Não autorizado',
                    },

                    404: {
                        description: 'Categoria não encontrada',
                    },
                },
            },
        },

        // PRODUTOS

        '/v1/product/search': {
            get: {
                tags: ['Products'],

                summary: 'Listar produtos com filtros e paginação',

                parameters: [
                    {
                        name: 'limit',
                        in: 'query',
                        schema: {
                            type: 'integer',
                            default: 12,
                        },
                    },

                    {
                        name: 'page',
                        in: 'query',
                        schema: {
                            type: 'integer',
                            default: 1,
                        },
                    },

                    {
                        name: 'fields',
                        in: 'query',
                        schema: {
                            type: 'string',
                            example: 'name,images,price',
                        },
                    },

                    {
                        name: 'match',
                        in: 'query',
                        schema: {
                            type: 'string',
                            example: 'Tênis',
                        },
                    },

                    {
                        name: 'category_ids',
                        in: 'query',
                        schema: {
                            type: 'string',
                            example: '15,24',
                        },
                    },

                    {
                        name: 'price-range',
                        in: 'query',
                        schema: {
                            type: 'string',
                            example: '100-200',
                        },
                    },
                ],

                responses: {
                    200: {
                        description: 'Lista de produtos retornada com sucesso',
                    },

                    400: {
                        description: 'Parâmetros inválidos',
                    },
                },
            },
        },

        '/v1/product': {
            post: {
                tags: ['Products'],

                summary: 'Cadastrar novo produto',

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,

                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ProductCreateInput',
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description: 'Produto criado com sucesso',

                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Product',
                                },
                            },
                        },
                    },

                    400: {
                        description: 'Dados inválidos',
                    },

                    401: {
                        description: 'Não autorizado',
                    },
                },
            },
        },

        '/v1/product/{id}': {

            get: {
                tags: ['Products'],

                summary: 'Obter informações do produto pelo ID',

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                responses: {
                    200: {
                        description: 'Produto encontrado',

                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Product',
                                },
                            },
                        },
                    },

                    404: {
                        description: 'Produto não encontrado',
                    },
                },
            },

            put: {
                tags: ['Products'],

                summary: 'Atualizar produto',

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                requestBody: {
                    required: true,

                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ProductUpdateInput',
                            },
                        },
                    },
                },

                responses: {
                    204: {
                        description: 'Produto atualizado com sucesso (sem corpo)',
                    },

                    400: {
                        description: 'Dados inválidos',
                    },

                    401: {
                        description: 'Não autorizado',
                    },

                    404: {
                        description: 'Produto não encontrado',
                    },
                },
            },

            delete: {
                tags: ['Products'],

                summary: 'Deletar produto',

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,

                        schema: {
                            type: 'integer',
                        },
                    },
                ],

                responses: {
                    204: {
                        description: 'Produto deletado com sucesso (sem corpo)',
                    },

                    401: {
                        description: 'Não autorizado',
                    },

                    404: {
                        description: 'Produto não encontrado',
                    },
                },
            },
        },
    },
};

module.exports = swaggerSpec