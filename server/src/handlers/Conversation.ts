import { FastifyReply, FastifyRequest } from 'fastify';
import Storage from '../storage/Storage';
import Handler from './Handler';

class Conversation extends Handler {
  static get(storage: Storage) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.cookies;
      const { convoId } = request.query as { convoId?: string };

      if (!convoId || !userId) {
        reply.code(400).send({ message: 'Missing convoId parameter' });
        return;
      }

      try {
        const isValid = await storage.isValidUser(userId, convoId);
        if (!isValid) {
          reply.code(404).send({ message: 'Conversation not found' });
          return;
        }
        const messages = await storage.getFrontendMessages(userId, convoId);
        reply.send({ messages });
      } catch (error) {
        console.error('Error fetching conversation:', error);
        reply.code(404).send({ message: 'Conversation not found' });
      }
    };
  }

  static post(storage: Storage) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.cookies;

      if (!userId) {
        reply.code(400).send({ message: 'Missing userId' });
        return;
      }

      const convoId = await storage.createConversation(userId);
      reply.send({ convoId });
    };
  }
}

export default Conversation;
