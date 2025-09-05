import Memory from '../storage/Memory';
import { Route } from '../types';
import Agent from './Agent';

const ACCEPTABLE_OUTPUTS = new Set([
  'location_description',
  'direct_weather',
  'error',
]);

const isAcceptableType = (output: string): output is Route =>
  ACCEPTABLE_OUTPUTS.has(output);

class RouterAgent extends Agent {
  constructor(memory: Memory) {
    super('router', memory);
  }

  async run(): Promise<Route> {
    const response = await this.generateContent();

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const classification = part?.text?.trim().toLowerCase() || 'error';

    await this.memory.recordMessage('model', {
      functionCall: {
        name: 'router',
        args: {
          classification,
        },
      },
    });

    await this.memory.recordMessage('user', {
      functionResponse: {
        name: 'router',
        response: {
          result: classification,
        },
      },
    });

    if (isAcceptableType(classification)) {
      return classification;
    }

    return 'error';
  }
}

export default RouterAgent;
