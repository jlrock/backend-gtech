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
