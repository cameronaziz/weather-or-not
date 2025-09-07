import { FastifyRequest } from 'fastify';
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

export const getHostname = (request: FastifyRequest): string => {
  const forwardedHost = request.headers['x-forwarded-host'];
  if (forwardedHost) {
    return Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  }

  const host = request.headers.host;
  return Array.isArray(host) ? host[0] : host || 'unknown';
};

const processRequest = async (request: FastifyRequest) => {
  const { userId } = request.cookies;
  const parts = request.parts();

  const body = {
    userId,
    hostname: getHostname(request),
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
