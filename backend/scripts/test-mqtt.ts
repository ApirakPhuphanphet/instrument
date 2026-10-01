import { buildApp } from '../src/app.js';
import { mqttService } from '../src/services/mqtt.service.js';
import mqtt from 'mqtt';

async function test() {
  console.log('Building Fastify app...');
  const app = await buildApp();
  await app.ready();

  // Wait for MQTT to connect
  console.log('Waiting for MQTT client to connect...');
  for (let i = 0; i < 10; i++) {
    if (mqttService.getStatus().connected) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  // 1. Test /mqtt/status
  const statusRes = await app.inject({
    method: 'GET',
    url: '/mqtt/status'
  });
  console.log('1. Status Check:', statusRes.statusCode, statusRes.json());

  // 2. Setup mock IoT Device
  const testTopic = `instrument/test/device_${Math.random().toString(36).substring(2, 7)}/command`;
  const mockDevice = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883');

  await new Promise<void>((resolve) => {
    mockDevice.on('connect', () => {
      console.log('Mock Device connected to broker');
      mockDevice.subscribe(testTopic, () => {
        console.log('Mock Device subscribed to topic:', testTopic);
        resolve();
      });
    });
  });

  mockDevice.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Mock Device received command on topic:', topic);
      console.log('Mock Device command payload:', data);

      // Reply back to replyTopic
      const replyPayload = {
        requestId: data.requestId,
        data: {
          status: 'SUCCESS',
          deviceSerialNumber: 'SN-987654',
          actionExecuted: data.action,
          readings: { voltage: 3.3, current: 0.15 }
        }
      };

      console.log('Mock Device sending reply to:', data.replyTopic);
      mockDevice.publish(data.replyTopic, JSON.stringify(replyPayload));
    } catch (err: any) {
      console.error('Mock Device error:', err.message);
    }
  });

  // 3. Test successful request-reply through HTTP
  console.log('2. Testing HTTP POST /mqtt/request...');
  const postRes = await app.inject({
    method: 'POST',
    url: '/mqtt/request',
    payload: {
      topic: testTopic,
      payload: { action: 'READ_STATUS' },
      timeout: 5000
    }
  });

  console.log('POST Response status code:', postRes.statusCode);
  console.log('POST Response body:', JSON.stringify(postRes.json(), null, 2));

  // 4. Test timeout when no reply
  console.log('3. Testing Timeout handling when target topic has no subscriber...');
  const timeoutRes = await app.inject({
    method: 'POST',
    url: '/mqtt/request',
    payload: {
      topic: 'instrument/device/unreachable_channel',
      payload: { action: 'PING' },
      timeout: 1000
    }
  });

  console.log('Timeout Response status code:', timeoutRes.statusCode);
  console.log('Timeout Response body:', JSON.stringify(timeoutRes.json(), null, 2));

  mockDevice.end();
  await app.close();
  await mqttService.disconnect();
  console.log('All tests completed successfully!');
  process.exit(0);
}

test().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
