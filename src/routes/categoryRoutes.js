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
