import { FastifyReply, FastifyRequest } from 'fastify';
import processRequest, { getHostname } from '../lib/processRequest';
import Orchestrator from '../Orchestrator';
import Storage from '../storage/Storage';
import Handler from './Handler';

const STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Access-Control-Allow-Origin':
    process.env.DEPLOYMENT === 'production'
      ? 'https://weatherornot.cameronaziz.dev'
      : 'http://localhost:5173',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

class Prompt extends Handler {
  static post(storage: Storage) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const requestBody = await processRequest(request);

      if (!requestBody.userId) {
        const userId = await storage.createUser(getHostname(request));
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
    };
  }

  static options(_storage: Storage) {
    return async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.headers({
        'Access-Control-Allow-Origin':
          process.env.DEPLOYMENT === 'production'
            ? 'https://weatherornot.cameronaziz.dev'
            : 'http://localhost:5173',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      reply.code(200).send();
    };
  }
}

export default Prompt;
