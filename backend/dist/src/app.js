import dotenv from 'dotenv';
dotenv.config();
import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { healthRoutes } from './routes/health.js';
import { transactionRoutes } from './routes/transaction.js';
import { rfidRoutes } from './routes/rfid.js';
import { userRoutes } from './routes/user.js';
import { prisma } from './lib/prisma.js';
export async function buildApp() {
    const app = Fastify({
        logger: false
    }).withTypeProvider();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(formbody);
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Instrument API',
                description: 'API documentation for instrument and RFID tracking system',
                version: '1.0.0'
            },
            servers: []
        },
        transform: jsonSchemaTransform
    });
    await app.register(swaggerUi, {
        routePrefix: '/docs'
    });
    await app.register(healthRoutes);
    await app.register(transactionRoutes);
    await app.register(rfidRoutes);
    await app.register(userRoutes);
    return app;
}
const port = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
    const app = await buildApp();
    const start = async () => {
        try {
            await app.listen({ port, host: '0.0.0.0' });
            console.log(`🚀 Server is running on http://localhost:${port}`);
            try {
                await prisma.$queryRaw `SELECT NOW()`;
                console.log('✅ Connected to PostgreSQL');
            }
            catch (error) {
                console.error('❌ PostgreSQL connection failed:', error.message);
                console.error('Set DATABASE_URL in backend/.env');
            }
            console.log('Waiting for requests...');
        }
        catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
    const gracefulShutdown = async () => {
        await app.close();
        await prisma.$disconnect();
        process.exit(0);
    };
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    start();
}
