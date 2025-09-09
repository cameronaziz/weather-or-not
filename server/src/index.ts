import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import Conversation from './handlers/Conversation';
import Prompt from './handlers/Prompt';
import Register from './handlers/Register';
import Storage from './storage/Storage';

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

fastify.get('/api/register', Register.get(storage));
fastify.get('/api/conversation', Conversation.get(storage));
fastify.post('/api/conversation', Conversation.post(storage));
fastify.options('/api/prompt', Prompt.options(storage));
fastify.post('/api/prompt', Prompt.post(storage));

const run = async (req: any, res: any) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};

export default (req: any, res: any) => run(req, res);

module.exports = (req: any, res: any) => run(req, res);

// For local development
if (process.env.DEPLOYMENT === 'local') {
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
