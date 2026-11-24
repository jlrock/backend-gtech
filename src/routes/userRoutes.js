const { Router } = require('express');

const userController = require('../controllers/userController');

const authMiddleware = require('../middleware/authMiddleware');

const authorizeSelf = require('../middleware/authorizeSelf');

const {
    loginRateLimiter,
} = require('../middleware/rateLimiters');

const router = Router();

// Cadastro e login permanecem públicos
// para permitir a criação da sessão.
router.post(
    '/token',
    loginRateLimiter,
    userController.generateToken
);

router.post(
    '/',
    userController.create
);

// Consulta permanece pública conforme
// o contrato documentado do projeto.
router.get(
    '/:id',
    userController.getById
);

// Escrita em conta de usuário exige
// autenticação e autorização do próprio titular.
router.put(
    '/:id',
    authMiddleware,
    authorizeSelf,
    userController.update
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeSelf,
    userController.delete
);

module.exports = router;