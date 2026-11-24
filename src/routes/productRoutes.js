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
