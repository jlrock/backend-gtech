const { Router } = require('express');

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeSelf = require('../middleware/authorizeSelf');

const router = Router();

router.post('/token', userController.generateToken);
router.post('/', userController.create);

router.get('/:id', userController.getById);

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

module.exports = router