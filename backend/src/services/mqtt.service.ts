import mqtt, { MqttClient } from 'mqtt';
import { randomUUID } from 'node:crypto';

export class MqttTimeoutError extends Error {
  requestId: string;
  topic: string;
  replyTopic: string;
  timeoutMs: number;

  constructor(requestId: string, topic: string, replyTopic: string, timeoutMs: number) {
    super(`MQTT request timed out after ${timeoutMs}ms waiting on topic "${replyTopic}"`);
    this.name = 'MqttTimeoutError';
    this.requestId = requestId;
    this.topic = topic;
    this.replyTopic = replyTopic;
    this.timeoutMs = timeoutMs;
  }
}

interface PendingRequest {
  requestId: string;
  replyTopic: string;
  customSubscribed: boolean;
  startTime: number;
  resolve: (value: { data: any; durationMs: number; replyTopic: string }) => void;
  reject: (reason: any) => void;
  timer: NodeJS.Timeout;
}

export class MqttService {
  private client: MqttClient | null = null;
  private brokerUrl: string;
  private clientId: string;
  private defaultResponseTopicPrefix = 'instrument/responses/';
  private defaultWildcardTopic = 'instrument/responses/+';
  private defaultTimeoutMs: number;
  private status: 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'error' = 'offline';
  private pendingRequests = new Map<string, PendingRequest>();

  constructor() {
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
    const prefix = process.env.MQTT_CLIENT_ID_PREFIX || 'instrument_backend_';
    this.clientId = `${prefix}${Math.random().toString(36).substring(2, 9)}`;
    this.defaultTimeoutMs = Number(process.env.MQTT_DEFAULT_TIMEOUT_MS || 5000);

    this.connect();
  }

  private connect(): void {
    console.log(`[MQTT] Connecting to broker: ${this.brokerUrl} with clientId: ${this.clientId}`);
    this.status = 'connecting';

    try {
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 3000
      });

      this.client.on('connect', () => {
        this.status = 'connected';
        console.log(`[MQTT] Successfully connected to broker: ${this.brokerUrl}`);

        // Subscribe to default response wildcard
        this.client?.subscribe(this.defaultWildcardTopic, { qos: 0 }, (err) => {
          if (err) {
            console.error(`[MQTT] Failed to subscribe to ${this.defaultWildcardTopic}:`, err.message);
          } else {
            console.log(`[MQTT] Subscribed to default response topic: ${this.defaultWildcardTopic}`);
          }
        });
      });

      this.client.on('reconnect', () => {
        this.status = 'reconnecting';
        console.log('[MQTT] Reconnecting to broker...');
      });

      this.client.on('offline', () => {
        this.status = 'offline';
        console.warn('[MQTT] Broker connection is offline');
      });

      this.client.on('error', (err) => {
        this.status = 'error';
        console.error('[MQTT] Connection error:', err.message);
      });

      this.client.on('message', (topic, payloadBuffer) => {
        this.handleIncomingMessage(topic, payloadBuffer);
      });
    } catch (err: any) {
      this.status = 'error';
      console.error('[MQTT] Failed to initialize connection:', err.message);
    }
  }

  private handleIncomingMessage(topic: string, payloadBuffer: Buffer): void {
    const rawMessage = payloadBuffer.toString('utf-8');
    let parsedData: any = rawMessage;

    try {
      parsedData = JSON.parse(rawMessage);
    } catch {
      // Keep as raw string if not JSON
    }

    // Try matching pending request by requestId
    let matchedRequestId: string | null = null;

    // 1. Topic-based match: instrument/responses/<requestId>
    if (topic.startsWith(this.defaultResponseTopicPrefix)) {
      matchedRequestId = topic.substring(this.defaultResponseTopicPrefix.length);
    }

    // 2. Payload-based match if requestId or correlationId is present in JSON
    if ((!matchedRequestId || !this.pendingRequests.has(matchedRequestId)) && typeof parsedData === 'object' && parsedData !== null) {
      if (parsedData.requestId && this.pendingRequests.has(parsedData.requestId)) {
        matchedRequestId = parsedData.requestId;
      } else if (parsedData.correlationId && this.pendingRequests.has(parsedData.correlationId)) {
        matchedRequestId = parsedData.correlationId;
      }
    }

    // 3. Fallback: match by custom replyTopic if an exact match exists
    if (!matchedRequestId || !this.pendingRequests.has(matchedRequestId)) {
      for (const [id, req] of this.pendingRequests.entries()) {
        if (req.replyTopic === topic) {
          matchedRequestId = id;
          break;
        }
      }
    }

    if (matchedRequestId && this.pendingRequests.has(matchedRequestId)) {
      const pending = this.pendingRequests.get(matchedRequestId)!;
      clearTimeout(pending.timer);

      if (pending.customSubscribed && this.client) {
        this.client.unsubscribe(pending.replyTopic);
      }

      this.pendingRequests.delete(matchedRequestId);

      const durationMs = Date.now() - pending.startTime;
      console.log(`[MQTT] Received reply for requestId "${matchedRequestId}" in ${durationMs}ms`);

      // Extract inner data if wrapped in standard reply format
      const responseData = typeof parsedData === 'object' && parsedData !== null && 'data' in parsedData
        ? parsedData.data
        : parsedData;

      pending.resolve({
        data: responseData,
        durationMs,
        replyTopic: topic
      });
    }
  }

  public async requestReply(options: {
    topic: string;
    payload: any;
    replyTopic?: string;
    timeout?: number;
  }): Promise<{
    requestId: string;
    topic: string;
    replyTopic: string;
    durationMs: number;
    data: any;
  }> {
    if (!this.client || this.status !== 'connected') {
      throw new Error(`MQTT broker is not connected (current status: ${this.status})`);
    }

    const requestId = randomUUID();
    const replyTopic = options.replyTopic || `${this.defaultResponseTopicPrefix}${requestId}`;
    const timeoutMs = options.timeout || this.defaultTimeoutMs;
    const isCustomTopic = !replyTopic.startsWith(this.defaultResponseTopicPrefix);

    // If custom reply topic, subscribe before publishing
    if (isCustomTopic) {
      await new Promise<void>((resolve, reject) => {
        this.client!.subscribe(replyTopic, { qos: 0 }, (err) => {
          if (err) return reject(new Error(`Failed to subscribe to reply topic "${replyTopic}": ${err.message}`));
          resolve();
        });
      });
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const timer = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          const req = this.pendingRequests.get(requestId)!;
          if (req.customSubscribed && this.client) {
            this.client.unsubscribe(req.replyTopic);
          }
          this.pendingRequests.delete(requestId);
          console.warn(`[MQTT] RequestId "${requestId}" timed out after ${timeoutMs}ms`);
          reject(new MqttTimeoutError(requestId, options.topic, replyTopic, timeoutMs));
        }
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        requestId,
        replyTopic,
        customSubscribed: isCustomTopic,
        startTime,
        resolve: (result) => {
          resolve({
            requestId,
            topic: options.topic,
            replyTopic: result.replyTopic,
            durationMs: result.durationMs,
            data: result.data
          });
        },
        reject,
        timer
      });

      // Construct message payload with correlation metadata
      const messageObject =
        typeof options.payload === 'object' && options.payload !== null
          ? {
              requestId,
              replyTopic,
              timestamp: new Date().toISOString(),
              ...options.payload
            }
          : {
              requestId,
              replyTopic,
              timestamp: new Date().toISOString(),
              data: options.payload
            };

      const payloadString = JSON.stringify(messageObject);

      console.log(`[MQTT] Publishing request [${requestId}] to "${options.topic}" with replyTopic "${replyTopic}"`);

      this.client!.publish(options.topic, payloadString, { qos: 0 }, (err) => {
        if (err) {
          clearTimeout(timer);
          if (isCustomTopic && this.client) {
            this.client.unsubscribe(replyTopic);
          }
          this.pendingRequests.delete(requestId);
          return reject(new Error(`Failed to publish message to topic "${options.topic}": ${err.message}`));
        }
      });
    });
  }

  public getStatus() {
    return {
      connected: this.status === 'connected',
      status: this.status,
      brokerUrl: this.brokerUrl,
      clientId: this.clientId,
      defaultResponseTopic: this.defaultWildcardTopic,
      pendingRequestsCount: this.pendingRequests.size
    };
  }

  public async disconnect(): Promise<void> {
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(new Error('MQTT service shutting down'));
    }
    this.pendingRequests.clear();

    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(false, () => {
          console.log('[MQTT] Disconnected from broker');
          this.status = 'offline';
          resolve();
        });
      });
    }
  }
}

export const mqttService = new MqttService();
