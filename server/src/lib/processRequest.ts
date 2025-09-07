import {
  FastifyRequest,
  RawServerDefault,
  RouteGenericInterface,
} from 'fastify';
import { PromptRequestBody } from '../types';

const sanitizePrompt = (text: string) =>
  text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(
      /\b(ignore|disregard|forget)\s+(previous|above|all)\s+(instructions?|prompts?)/gi,
      '[removed]'
    )
    .replace(/```[\s\S]*?```/g, '[code removed]')
    .replace(/<[^>]*>/g, '')
    .trim();

const processRequest = async (
  request: FastifyRequest<RouteGenericInterface, RawServerDefault>
) => {
  const { userId } = request.cookies;
  const parts = request.parts();

  const body = {
    userId,
    hostname: request.headers.host,
  } as PromptRequestBody;

  for await (const part of parts) {
    switch (part.type) {
      case 'field':
        if (typeof part.value === 'string') {
          switch (part.fieldname) {
            case 'convoId':
              body.convoId = part.value;
              break;
            case 'prompt':
              body.prompt = sanitizePrompt(part.value);
              break;
          }
        }
        break;
      case 'file':
        const buffer = await part.toBuffer();
        body.image = buffer;
        break;
    }
  }

  return body;
};

export default processRequest;
