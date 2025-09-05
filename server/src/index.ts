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

fastify.get('/register', async (request, reply) => {
  const { userId } = request.cookies;

  if (userId) {
    reply.send({
      userId,
      isNew: false,
    });
  } else {
    const newUserId = crypto.randomUUID();
    reply.setCookie('userId', newUserId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      partitioned: true,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
    reply.send({
      userId: newUserId,
      isNew: true,
    });
  }
});

fastify.post('/prompt', async (request, reply) => {
  const requestBody = await processRequest(request);

  if (!requestBody.userId) {
    reply.code(400).send({ message: 'Missing userId' });
    return;
  }

  if (!requestBody.userId || !requestBody.prompt) {
    reply.code(400).send({ message: 'Missing required fields' });
    return;
  }

  // Set streaming headers (CORS handled by plugin)
  reply.headers(STREAM_HEADERS);
  reply.hijack();

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
