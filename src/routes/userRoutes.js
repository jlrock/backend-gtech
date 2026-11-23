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
