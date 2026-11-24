const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AppError = require('./AppError');

const UPLOADS_PRODUCTS_DIR = path.resolve(
    __dirname,
    '..',
    '..',
    'uploads',
    'products'
);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
};

/**
 * Normaliza o MIME Type recebido.
 */
function normalizeMime(mime) {
    if (!mime) {
        return null;
    }

    const normalized = String(mime)
        .split(';')[0]
        .trim()
        .toLowerCase();

    return normalized === 'image/jpg'
        ? 'image/jpeg'
        : normalized;
}

/**
 * Identifica o formato da imagem
 * através da assinatura binária.
 */
function detectImageType(buffer) {

    // PNG
    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
            Buffer.from([
                0x89,
                0x50,
                0x4e,
                0x47,
                0x0d,
                0x0a,
                0x1a,
                0x0a,
            ])
        )
    ) {
        return {
            mime: 'image/png',
            ext: '.png',
        };
    }

    // JPEG
    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) {
        return {
            mime: 'image/jpeg',
            ext: '.jpg',
        };
    }

    // WEBP
    if (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return {
            mime: 'image/webp',
            ext: '.webp',
        };
    }

    return null;
}

/**
 * Decodifica Base64 e verifica sua validade.
 */
function decodeBase64Strict(value) {
    const compact = value.replace(/\s/g, '');

    if (
        !compact ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(compact) ||
        compact.length % 4 === 1
    ) {
        throw new AppError(
            'Conteúdo Base64 inválido.',
            400
        );
    }

    const buffer = Buffer.from(
        compact,
        'base64'
    );

    const canonical = buffer
        .toString('base64')
        .replace(/=+$/, '');

    if (
        canonical !== compact.replace(/=+$/, '')
    ) {
        throw new AppError(
            'Conteúdo Base64 inválido.',
            400
        );
    }

    if (buffer.length === 0) {
        throw new AppError(
            'A imagem enviada está vazia.',
            400
        );
    }

    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
        throw new AppError(
            'Cada imagem deve possuir no máximo 5 MB.',
            413
        );
    }

    return buffer;
}

/**
 * Salva PNG, JPEG ou WebP enviados como Base64/Data URI.
 *
 * URLs HTTP(S) são armazenadas como referências externas
 * e não são baixadas pelo servidor.
 */
async function saveImageContent(content, mimeType) {
    if (
        typeof content !== 'string' ||
        content.trim() === ''
    ) {
        throw new AppError(
            'O conteúdo (content) da imagem é obrigatório.',
            400
        );
    }

    const trimmed = content.trim();

    // IMPORTANTE: let é necessário porque o MIME
    // pode ser atualizado após a leitura do Data URI.
    let declaredMime = normalizeMime(mimeType);

    if (
        declaredMime &&
        !MIME_TO_EXT[declaredMime]
    ) {
        throw new AppError(
            'Tipo de imagem não suportado. Utilize PNG, JPEG ou WebP.',
            400
        );
    }

    // Caso seja uma URL externa.
    if (/^https?:\/\//i.test(trimmed)) {
        let parsedUrl;

        try {
            parsedUrl = new URL(trimmed);
        } catch (error) {
            throw new AppError(
                'URL de imagem inválida.',
                400
            );
        }

        if (
            !['http:', 'https:'].includes(parsedUrl.protocol) ||
            !parsedUrl.hostname
        ) {
            throw new AppError(
                'A URL da imagem deve utilizar HTTP ou HTTPS.',
                400
            );
        }

        return {
            path: parsedUrl.toString(),
            isLocal: false,
        };
    }

    let base64Data = trimmed;

    // Suporte a Data URI.
    const dataUriMatch = trimmed.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i
    );

    if (dataUriMatch) {
        const dataUriMime = normalizeMime(
            dataUriMatch[1]
        );

        if (
            declaredMime &&
            declaredMime !== dataUriMime
        ) {
            throw new AppError(
                'O MIME Type informado diverge do Data URI.',
                400
            );
        }

        declaredMime = dataUriMime;

        base64Data = dataUriMatch[2];
    }

    if (
        declaredMime &&
        !MIME_TO_EXT[declaredMime]
    ) {
        throw new AppError(
            'Tipo de imagem não suportado. Utilize PNG, JPEG ou WebP.',
            400
        );
    }

    // Decodifica Base64.
    const buffer = decodeBase64Strict(
        base64Data
    );

    // Identifica o formato real.
    const detected = detectImageType(buffer);

    if (!detected) {
        throw new AppError(
            'O conteúdo enviado não corresponde a uma imagem PNG, JPEG ou WebP válida.',
            400
        );
    }

    // Confere se o MIME informado corresponde ao arquivo.
    if (
        declaredMime &&
        declaredMime !== detected.mime
    ) {
        throw new AppError(
            'O conteúdo real da imagem não corresponde ao MIME Type informado.',
            400
        );
    }

    // Garante que a pasta existe.
    await fs.promises.mkdir(
        UPLOADS_PRODUCTS_DIR,
        { recursive: true }
    );

    const fileName = `${crypto.randomUUID()}${detected.ext}`;

    const fullPath = path.join(
        UPLOADS_PRODUCTS_DIR,
        fileName
    );

    await fs.promises.writeFile(
        fullPath,
        buffer,
        { flag: 'wx' }
    );

    return {
        path: `media/products/${fileName}`,
        isLocal: true,
    };
}

/**
 * Remove somente arquivos locais cujo caminho
 * respeita o padrão gerado pela aplicação.
 */
async function deleteLocalImage(relativePath) {
    if (typeof relativePath !== 'string') {
        return;
    }

    const match = relativePath.match(
        /^media\/products\/([A-Za-z0-9_-]+\.(?:png|jpe?g|webp|gif|svg))$/i
    );

    if (!match) {
        return;
    }

    const fileName = path.basename(match[1]);

    const fullPath = path.resolve(
        UPLOADS_PRODUCTS_DIR,
        fileName
    );

    if (
        !fullPath.startsWith(
            `${UPLOADS_PRODUCTS_DIR}${path.sep}`
        )
    ) {
        return;
    }

    try {
        await fs.promises.unlink(fullPath);

    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

/**
 * Monta a URL pública de uma imagem armazenada no banco.
 */
function resolveImageUrl(storedPath, baseUrl) {
    if (!storedPath) {
        return '';
    }

    if (/^https?:\/\//i.test(storedPath)) {
        return storedPath;
    }

    const match = String(storedPath).match(
        /^media\/products\/([A-Za-z0-9_-]+\.(?:png|jpe?g|webp|gif|svg))$/i
    );

    if (!match) {
        return '';
    }

    const cleanBase = String(baseUrl || '')
        .replace(/\/+$/, '');

    const cleanPath = `media/products/${match[1]}`;

    return cleanBase
        ? `${cleanBase}/${cleanPath}`
        : `/${cleanPath}`;
}

module.exports = {
    saveImageContent,
    deleteLocalImage,
    resolveImageUrl,
    MAX_IMAGE_SIZE_BYTES,
};