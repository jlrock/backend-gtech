const authorizeSelf = require('../src/middleware/authorizeSelf');

describe('authorizeSelf', () => {

    function responseMock() {
        const res = {};

        res.status = jest.fn().mockReturnValue(res);

        res.json = jest.fn().mockReturnValue(res);

        return res;
    }

    it('permite alterar a própria conta', () => {

        const req = {
            userId: 7,
            params: {
                id: '7',
            },
        };

        const res = responseMock();

        const next = jest.fn();

        authorizeSelf(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);

        expect(res.status).not.toHaveBeenCalled();
    });

    it('retorna 403 ao tentar alterar a conta de outra pessoa', () => {

        const req = {
            userId: 7,
            params: {
                id: '8',
            },
        };

        const res = responseMock();

        const next = jest.fn();

        authorizeSelf(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);

        expect(res.json).toHaveBeenCalledWith({
            error: 'Você não tem permissão para modificar este usuário.',
        });

        expect(next).not.toHaveBeenCalled();
    });

    it('deixa IDs inválidos seguirem para o service responder 404', () => {

        const req = {
            userId: 7,
            params: {
                id: 'abc',
            },
        };

        const res = responseMock();

        const next = jest.fn();

        authorizeSelf(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });
});