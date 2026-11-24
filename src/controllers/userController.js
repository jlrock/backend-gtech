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
