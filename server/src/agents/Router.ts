import Memory from '../storage/Memory';
import { Route } from '../types';
import Agent from './Agent';

const ACCEPTABLE_OUTPUTS = new Set(['location_description', 'direct_weather']);

const isAcceptableType = (output: string): output is Route =>
  ACCEPTABLE_OUTPUTS.has(output);

class RouterAgent extends Agent {
  constructor(memory: Memory) {
    super('router', memory);
  }

  async run(): Promise<Route> {
    // Use filtered conversation without internal messages
    const conversation = await this.memory.getConversationForRouter();

    const response = await this.model.generateContent({
      model: this.memory.model,
      contents: conversation,
      config: this.config,
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const classification = part?.text?.trim().toLowerCase() || 'error';

    await this.memory.recordMessage('model', `Router: ${classification}`, true);

    if (isAcceptableType(classification)) {
      return classification;
    }

    return 'location_description';
  }
}

export default RouterAgent;
