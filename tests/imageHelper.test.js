const fs = require('fs');
const path = require('path');

const {
    saveImageContent,
    deleteLocalImage,
    resolveImageUrl,
    MAX_IMAGE_SIZE_BYTES,
} = require('../src/utils/imageHelper');

const ONE_PIXEL_PNG =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=';

describe('imageHelper', () => {

    let createdPath;

    afterEach(async () => {

        if (createdPath) {
            await deleteLocalImage(createdPath);

            createdPath = undefined;
        }
    });

    it('salva PNG válido e gera um caminho local', async () => {

        const result = await saveImageContent(
            ONE_PIXEL_PNG,
            'image/png'
        );

        createdPath = result.path;

        expect(result.isLocal).toBe(true);

        expect(result.path).toMatch(
            /^media\/products\/.+\.png$/
        );

        expect(
            fs.existsSync(
                path.resolve(
                    __dirname,
                    '..',
                    'uploads',
                    'products',
                    path.basename(result.path)
                )
            )
        ).toBe(true);
    });

    it('rejeita conteúdo que não seja imagem suportada', async () => {

        await expect(
            saveImageContent(
                Buffer.from('not an image').toString('base64')
            )
        ).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejeita divergência entre MIME Type e assinatura real', async () => {

        await expect(
            saveImageContent(
                ONE_PIXEL_PNG,
                'image/jpeg'
            )
        ).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('rejeita imagem maior que 5 MB', async () => {

        const oversized = Buffer
            .alloc(MAX_IMAGE_SIZE_BYTES + 1, 0x41)
            .toString('base64');

        await expect(
            saveImageContent(oversized)
        ).rejects.toMatchObject({
            statusCode: 413,
        });
    });

    it('rejeita SVG por não fazer parte dos formatos permitidos', async () => {

        const svg = Buffer
            .from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
            .toString('base64');

        await expect(
            saveImageContent(svg, 'image/svg+xml')
        ).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('mantém uma URL externa HTTP(S) sem baixar o recurso', async () => {

        const result = await saveImageContent(
            'https://example.com/image.webp'
        );

        expect(result).toEqual({
            path: 'https://example.com/image.webp',
            isLocal: false,
        });
    });

    it('monta URL pública para imagem local e rejeita caminho local inesperado', () => {

        expect(
            resolveImageUrl(
                'media/products/a1.png',
                'http://localhost:3000'
            )
        ).toBe(
            'http://localhost:3000/media/products/a1.png'
        );

        expect(
            resolveImageUrl(
                '../.env',
                'http://localhost:3000'
            )
        ).toBe('');
    });
});