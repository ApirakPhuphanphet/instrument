import { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import { imageService, ImageServiceError } from '../services/image.service.js';

export const imageRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /images/upload - Upload an image file (multipart/form-data)
  fastify.post('/images/upload', async (request, reply) => {
    try {
      const isMultipart = request.isMultipart();

      if (isMultipart) {
        const file = await request.file();
        if (!file) {
          return reply.status(400).send({ message: 'No file uploaded. Please provide an image file.' });
        }

        const result = await imageService.saveImageStream(
          file.file,
          file.filename,
          file.mimetype
        );

        return reply.status(201).send({
          message: 'Image uploaded successfully',
          data: result
        });
      }

      // Check if uploaded as JSON base64
      const body = request.body as any;
      if (body && body.base64) {
        const matches = body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;
        let mimetype = body.mimetype || 'image/png';

        if (matches && matches.length === 3) {
          mimetype = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(body.base64, 'base64');
        }

        const filename = body.filename || `image-${Date.now()}.png`;
        const result = await imageService.saveImageBuffer(buffer, filename, mimetype);

        return reply.status(201).send({
          message: 'Image uploaded successfully',
          data: result
        });
      }

      return reply.status(400).send({
        message: 'Invalid request. Please upload via multipart/form-data or JSON base64.'
      });
    } catch (error: any) {
      if (error instanceof ImageServiceError) {
        return reply.status(error.statusCode).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({
        message: 'Internal server error while uploading image',
        error: error.message
      });
    }
  });

  // GET /images/:filename - View / display an image
  fastify.get('/images/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const { filePath, exists, mimetype } = imageService.getImagePath(filename);

    if (!exists) {
      return reply.status(404).send({ message: 'Image not found' });
    }

    reply.header('Content-Type', mimetype);
    reply.header('Cache-Control', 'public, max-age=86400');
    return reply.send(fs.createReadStream(filePath));
  });

  // GET /images/:filename/download - Download image file as attachment
  fastify.get('/images/:filename/download', async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const { filePath, exists, mimetype } = imageService.getImagePath(filename);

    if (!exists) {
      return reply.status(404).send({ message: 'Image not found' });
    }

    reply.header('Content-Type', mimetype);
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    return reply.send(fs.createReadStream(filePath));
  });

  // DELETE /images/:filename - Remove an image
  fastify.delete('/images/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const deleted = await imageService.deleteImage(filename);

    if (!deleted) {
      return reply.status(404).send({ message: 'Image not found or already deleted' });
    }

    return reply.status(200).send({ message: 'Image deleted successfully' });
  });
};
