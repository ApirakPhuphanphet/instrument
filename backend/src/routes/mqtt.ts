import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  mqttRequestReplySchema,
  mqttRequestReplyResponseSchema,
  mqttErrorResponseSchema,
  mqttStatusResponseSchema
} from '../schemas/mqtt.schema.js';
import { mqttService, MqttTimeoutError } from '../services/mqtt.service.js';

export const mqttRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/mqtt/status', {
    schema: {
      tags: ['MQTT'],
      summary: 'Get MQTT client connection status',
      description: 'Check broker connectivity, client ID, and active pending request count',
      response: {
        200: mqttStatusResponseSchema
      }
    }
  }, async (_request, reply) => {
    return reply.status(200).send(mqttService.getStatus());
  });

  fastify.post('/mqtt/request', {
    schema: {
      tags: ['MQTT'],
      summary: 'Publish MQTT message and wait for reply',
      description:
        'Workflow: Frontend sends HTTP POST -> Fastify backend publishes message with requestId to MQTT topic -> Device responds on replyTopic -> Fastify matches requestId and returns response to Frontend',
      body: mqttRequestReplySchema,
      response: {
        200: mqttRequestReplyResponseSchema,
        503: mqttErrorResponseSchema,
        504: mqttErrorResponseSchema,
        500: mqttErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    const { topic, payload, replyTopic, timeout } = request.body;

    try {
      const result = await mqttService.requestReply({
        topic,
        payload,
        replyTopic,
        timeout
      });

      return reply.status(200).send({
        success: true,
        requestId: result.requestId,
        topic: result.topic,
        replyTopic: result.replyTopic,
        durationMs: result.durationMs,
        data: result.data
      });
    } catch (error: any) {
      if (error instanceof MqttTimeoutError) {
        return reply.status(504).send({
          success: false,
          requestId: error.requestId,
          error: error.message
        });
      }

      if (error.message?.includes('not connected')) {
        return reply.status(503).send({
          success: false,
          error: error.message
        });
      }

      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to complete MQTT request-reply'
      });
    }
  });
};
