const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AppError = require('./AppError');

const UPLOADS_PRODUCTS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'products');

const MIME_TO_EXT = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
};

/*
 * Salva uma imagem enviada em base64 (ou retorna a URL se já for HTTP/HTTPS).
 * @param {string} content - String base64, Data URI ou URL externa.
 * @param {string} [mimeType] - Tipo MIME opcional (ex: "image/png").
 * @param {string} [fallbackExt='.png'] - Extensão padrão caso não haja mimeType.
 * @returns {Promise<{ path: string, isLocal: boolean }>} Caminho relativo salvo ou URL externa.
 */
async function saveImageContent(content, mimeType, fallbackExt = '.png') {
    if (typeof content !== 'string' || content.trim() === '') {
        throw new AppError('O conteúdo (content) da imagem é obrigatório.', 400);
    }

    const trimmed = content.trim();

    // Caso seja uma URL externa já hospedada
    if (/^https?:\/\//i.test(trimmed)) {
        return { path: trimmed, isLocal: false };
    }

    let base64Data = trimmed;
    let ext = fallbackExt;

    // Suporta Data URI no formato "data:image/png;base64,..."
    const dataUriMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (dataUriMatch) {
        const detectedMime = dataUriMatch[1].toLowerCase();
        ext = MIME_TO_EXT[detectedMime] || fallbackExt;
        base64Data = dataUriMatch[2];
    } else if (mimeType) {
        const normalizedMime = String(mimeType).toLowerCase().trim();
        if (!MIME_TO_EXT[normalizedMime]) {
            throw new AppError(`Tipo de imagem não suportado: ${mimeType}`, 400);
        }
        ext = MIME_TO_EXT[normalizedMime];
    }

    fs.mkdirSync(UPLOADS_PRODUCTS_DIR, { recursive: true });

    const fileName = `${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(UPLOADS_PRODUCTS_DIR, fileName);
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.promises.writeFile(fullPath, buffer);

    return {
        path: `media/products/${fileName}`,
        isLocal: true,
    };
}

/*
 * Remove uma imagem armazenada localmente no servidor.
 * @param {string} relativePath - Caminho salvo na coluna `path` do banco.
 */
async function deleteLocalImage(relativePath) {
    if (typeof relativePath !== 'string' || !relativePath.startsWith('media/products/')) {
        return;
    }

    const fileName = path.basename(relativePath);
    const fullPath = path.join(UPLOADS_PRODUCTS_DIR, fileName);

    try {
        await fs.promises.unlink(fullPath);
    } catch (err) {
        // Ignora caso o arquivo não exista mais no disco
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
}

/*
 * Monta a URL completa da imagem para resposta da API.
 * @param {string} storedPath - Caminho armazenado no banco.
 * @param {string} baseUrl - URL base do servidor (ex: http://localhost:3000).
 * @returns {string}
 */
function resolveImageUrl(storedPath, baseUrl) {
    if (!storedPath) return '';
    if (/^https?:\/\//i.test(storedPath)) {
        return storedPath;
    }
    const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
    const cleanPath = storedPath.replace(/^\/+/, '');
    return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
}

module.exports = {
    saveImageContent,
    deleteLocalImage,
    resolveImageUrl,
}