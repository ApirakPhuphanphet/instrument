import { z } from 'zod';

export const mqttRequestReplySchema = z.object({
  topic: z
    .string()
    .min(1, 'Topic is required')
    .describe('The MQTT topic to publish the request command to (e.g. instrument/device/scan)'),
  payload: z
    .any()
    .describe('The payload data to send to the device/subscriber (JSON object, string, number, etc.)'),
  replyTopic: z
    .string()
    .optional()
    .describe('Optional custom topic where the response is expected. Defaults to instrument/responses/{requestId}'),
  timeout: z
    .number()
    .int()
    .min(500, 'Timeout must be at least 500ms')
    .max(60000, 'Timeout cannot exceed 60000ms')
    .optional()
    .describe('Timeout in milliseconds to wait for reply (default: 5000ms)')
});

export type MqttRequestReplyInput = z.infer<typeof mqttRequestReplySchema>;

export const mqttRequestReplyResponseSchema = z.object({
  success: z.boolean().describe('Whether the request-reply cycle succeeded'),
  requestId: z.string().describe('Unique correlation ID generated for this request'),
  topic: z.string().describe('The topic where the request was published'),
  replyTopic: z.string().describe('The topic where the reply was received from'),
  durationMs: z.number().describe('Time taken in milliseconds to receive the reply'),
  data: z.any().describe('The response data received from the MQTT subscriber')
});

export const mqttErrorResponseSchema = z.object({
  success: z.literal(false),
  requestId: z.string().optional(),
  error: z.string().describe('Error message or failure reason')
});

export const mqttStatusResponseSchema = z.object({
  connected: z.boolean(),
  status: z.string(),
  brokerUrl: z.string(),
  clientId: z.string(),
  defaultResponseTopic: z.string(),
  pendingRequestsCount: z.number()
});
