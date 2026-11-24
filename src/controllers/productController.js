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
