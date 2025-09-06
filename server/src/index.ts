import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import processRequest from './lib/processRequest';
import Orchestrator from './Orchestrator';
import Storage from './storage/Storage';

const STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'production'
      ? 'https://weatherornot.cameronaziz.dev'
      : 'http://localhost:5173',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const storage = new Storage();

const fastify = Fastify({
  logger: true,
});

fastify.register(cors, {
  origin: [
    'http://localhost:5173',
    'http://localhost:5432',
    'http://localhost:3000',
    'http://localhost:9876',
    'https://weatherornot.cameronaziz.dev',
  ],
  credentials: true,
});

fastify.register(multipart);
fastify.register(cookie);

fastify.get('/api/register', async (request, reply) => {
  if (request.cookies.userId) {
    const userId = await storage.createUser(request.cookies.userId);
    reply.send({
      userId,
      isNew: false,
    });
  } else {
    const userId = await storage.createUser();
    reply.setCookie('userId', userId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      partitioned: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    reply.send({
      userId,
      isNew: true,
    });
  }
});

fastify.get('/api/conversation', async (request, reply) => {
  const { userId } = request.cookies;
  const { convoId } = request.query as { convoId?: string };

  if (!convoId || !userId) {
    reply.code(400).send({ message: 'Missing convoId parameter' });
    return;
  }

  try {
    const conversation = await storage.getPublicConversation(userId, convoId);
    const messages = conversation
      .filter((message) => message.text.text)
      .map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text.text,
      }));
    reply.send({ messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    reply.code(404).send({ message: 'Conversation not found' });
  }
});

fastify.options('/api/prompt', async (request, reply) => {
  reply.headers({
    'Access-Control-Allow-Origin':
      process.env.NODE_ENV === 'production'
        ? 'https://weatherornot.cameronaziz.dev'
        : 'http://localhost:5173',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  reply.code(200).send();
});

fastify.post('/api/prompt', async (request, reply) => {
  const requestBody = await processRequest(request);

  if (!requestBody.userId) {
    const userId = await storage.createUser();
    requestBody.userId = userId;
  }

  if (!requestBody.prompt) {
    reply.code(400).send({ message: 'Missing required fields' });
    return;
  }

  reply.hijack();

  // Set CORS and streaming headers on the raw response
  reply.raw.writeHead(200, STREAM_HEADERS);

  try {
    const orchestrator = new Orchestrator(requestBody, storage);
    const stream = orchestrator.run(requestBody.prompt, requestBody.image);
    for await (const data of stream) {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    }
    reply.raw.end();
  } catch (error) {
    console.error('Stream error:', error);
    reply.raw.write(
      `data: ${JSON.stringify({ error: 'Processing failed' })}\n\n`
    );
    reply.raw.end();
  }
});

// For Vercel serverless deployment
export default async (req: any, res: any) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};

// Also export as module.exports for CommonJS compatibility
module.exports = async (req: any, res: any) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  const start = async () => {
    const port = Number(process.env.VITE_SERVER_PORT);
    try {
      if (isNaN(port)) {
        throw new Error(`VITE_SERVER_PORT is not a number`);
      }
      await fastify.listen({ port, host: '0.0.0.0' });
      console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    storage.close();
    fastify.close();
  });

  process.on('SIGINT', () => {
    storage.close();
    fastify.close();
  });

  start();
}
