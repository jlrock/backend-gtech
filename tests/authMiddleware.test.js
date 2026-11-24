const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/authMiddleware');
const authConfig = require('../src/config/auth');

describe('Middleware de Autenticação (authMiddleware)', () => {
    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    it('deve retornar 401 quando o cabeçalho Authorization não for enviado', () => {
        const req = { headers: {} };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Token de autorização não fornecido.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando o cabeçalho Authorization estiver malformado', () => {
        const req = { headers: { authorization: 'InvalidFormatToken' } };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando o token JWT for inválido', () => {
        const req = { headers: { authorization: 'Bearer token_invalido' } };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Token de autorização inválido ou expirado.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next() e preencher req.userId quando o token JWT for válido', () => {
        const token = jwt.sign({ id: 42, email: 'user@mail.com' }, authConfig.secret, {
            expiresIn: '1h',
        });
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.userId).toBe(42);
        expect(req.userEmail).toBe('user@mail.com');
    });
});
