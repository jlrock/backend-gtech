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
