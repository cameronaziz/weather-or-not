import { RouteHandlerMethod } from 'fastify';
import Storage from '../storage/Storage';

abstract class Handler {
  static get?(storage: Storage): RouteHandlerMethod;
  static options?(storage: Storage): RouteHandlerMethod;
  static post?(storage: Storage): RouteHandlerMethod;
}

export default Handler;
