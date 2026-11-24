function authorizeSelf(req, res, next) {
    const authenticatedUserId = String(req.userId);
    const requestedUserId = String(req.params.id);

    if (authenticatedUserId !== requestedUserId) {
        return res.status(403).json({
            error: 'Você não tem permissão para acessar este usuário.',
        });
    }

    return next();
}

module.exports = authorizeSelf;