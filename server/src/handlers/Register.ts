import { FastifyReply, FastifyRequest } from 'fastify';
import { getHostname } from '../lib/processRequest';
import Storage from '../storage/Storage';
import Handler from './Handler';

class Register extends Handler {
  static get(storage: Storage) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.cookies.userId) {
        const userId = await storage.createUser(
          getHostname(request),
          request.cookies.userId
        );
        reply.send({
          userId,
          isNew: false,
        });
      } else {
        const userId = await storage.createUser(getHostname(request));
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
    };
  }
}

export default Register;
