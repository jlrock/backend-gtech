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


// Converte valores como "4px" ou 4 para inteiro não negativo.

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


// Normaliza `values` ou `value` de uma opção para string separada por vírgulas.

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


// Formata uma instância de Product com suas associações para o contrato JSON da API.

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


// Faz a interseção entre um conjunto acumulado de IDs e um novo array de IDs.

function intersectIds(currentSet, newIds) {
    if (currentSet === null) {
        return new Set(newIds);
    }
    const incoming = new Set(newIds);
    return new Set([...currentSet].filter((id) => incoming.has(id)));
}

class ProductService {
    
    // Pesquisa produtos com paginação, seleção de campos e filtros avançados.
    
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
            idQueryOptions.offset = (page - 1)// limit;
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

    
    // Busca um produto completo pelo ID.
    
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

    
    // Cria um produto juntamente com suas categorias, imagens e opções dentro de uma transação.
    
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

        } catch (error) {
            await transaction.rollback();
            // Remove eventuais imagens salvas em disco caso a transação falhe
            await Promise.all(savedLocalFiles.map((filePath) => deleteLocalImage(filePath)));
            throw error;
        }

        return this.getProductById(product.id, baseUrl);
    }

    
    // Atualiza um produto e gerencia criação, edição e exclusão de imagens, opções e categorias.
    
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

        } catch (error) {
            await transaction.rollback();
            await Promise.all(newLocalFiles.map((filePath) => deleteLocalImage(filePath)));
            throw error;
        }

        const cleanupResults = await Promise.allSettled(filesToDeleteAfterCommit.map(deleteLocalImage));

        for (const result of cleanupResults) {
            if (result.status === 'rejected') {
                console.error('Falha ao remover imagem antiga:', result.reason);
            }
        }
    }

    
    // Remove um produto e limpa suas imagens locais associadas.
    
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

module.exports = new ProductService()