/*
 * Restringe atualização e exclusão de usuários
 * à própria conta.
 *
 * IDs inválidos seguem para o service,
 * que responde 404.
*/
function authorizeSelf(req, res, next) {
    const requestedId = Number(req.params.id);

    if (
        !Number.isSafeInteger(requestedId) ||
        requestedId <= 0
    ) {
        return next();
    }

    if (requestedId !== req.userId) {
        return res.status(403).json({
            error: 'Você não tem permissão para modificar este usuário.',
        });
    }

    return next();
}

module.exports = authorizeSelf;