import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store uploads in backend/uploads directory
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class ImageServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'ImageServiceError';
    this.statusCode = statusCode;
  }
}

const ALLOWED_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg']
]);

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

export class ImageService {
  /**
   * Save uploaded file stream to disk
   */
  async saveImageStream(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<{
    filename: string;
    url: string;
    mimetype: string;
  }> {
    const extFromMime = ALLOWED_MIME_TYPES.get(mimetype.toLowerCase());
    const originalExt = path.extname(originalFilename).toLowerCase();
    const ext = extFromMime || originalExt;

    if (!ALLOWED_MIME_TYPES.has(mimetype.toLowerCase()) && !MIME_BY_EXT[originalExt]) {
      throw new ImageServiceError(
        `Invalid file type '${mimetype}'. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed.`,
        400
      );
    }

    const uniqueId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const safeFilename = `inst-${Date.now()}-${uniqueId}${ext || '.png'}`;
    const targetPath = path.join(UPLOAD_DIR, safeFilename);

    const writeStream = fs.createWriteStream(targetPath);
    await pipeline(fileStream, writeStream);

    return {
      filename: safeFilename,
      url: `/images/${safeFilename}`,
      mimetype: extFromMime ? mimetype : (MIME_BY_EXT[originalExt] || 'application/octet-stream')
    };
  }

  /**
   * Save buffer directly (e.g. from base64 or form)
   */
  async saveImageBuffer(buffer: Buffer, originalFilename: string, mimetype: string): Promise<{
    filename: string;
    url: string;
    mimetype: string;
  }> {
    const extFromMime = ALLOWED_MIME_TYPES.get(mimetype.toLowerCase());
    const originalExt = path.extname(originalFilename).toLowerCase();
    const ext = extFromMime || originalExt;

    if (!ALLOWED_MIME_TYPES.has(mimetype.toLowerCase()) && !MIME_BY_EXT[originalExt]) {
      throw new ImageServiceError(
        `Invalid file type '${mimetype}'. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed.`,
        400
      );
    }

    const uniqueId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const safeFilename = `inst-${Date.now()}-${uniqueId}${ext || '.png'}`;
    const targetPath = path.join(UPLOAD_DIR, safeFilename);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      filename: safeFilename,
      url: `/images/${safeFilename}`,
      mimetype: extFromMime ? mimetype : (MIME_BY_EXT[originalExt] || 'application/octet-stream')
    };
  }

  /**
   * Get absolute filepath and mimetype for a given filename
   */
  getImagePath(filename: string): { filePath: string; exists: boolean; mimetype: string } {
    // Sanitize filename against directory traversal
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);
    const exists = fs.existsSync(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const mimetype = MIME_BY_EXT[ext] || 'application/octet-stream';

    return { filePath, exists, mimetype };
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(filename: string): Promise<boolean> {
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    } catch {
      // Ignore cleanup error
    }
    return false;
  }

  /**
   * Delete an image by its full URL (e.g. /images/inst-123.png)
   */
  async deleteImageByUrl(url: string | null | undefined): Promise<boolean> {
    if (!url) return false;
    const match = url.match(/\/images\/([^/?#]+)/);
    const filename = match ? match[1] : path.basename(url);
    return this.deleteImage(filename);
  }
}

export const imageService = new ImageService();
