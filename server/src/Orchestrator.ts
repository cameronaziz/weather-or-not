import AttireAgent from './agents/Attire';
import ImageAnalysisAgent from './agents/ImageAnalysis';
import RouterAgent from './agents/Router';
import WeatherAgent from './agents/Weather';
import Memory from './storage/Memory';
import Storage from './storage/Storage';
import { Attire, PromptRequestBody, SystemResultGeneric } from './types';

class Orchestrator {
  private _weatherAgent: WeatherAgent | null;
  private _attireAgent: AttireAgent | null;
  private _imageAnalysisAgent: ImageAnalysisAgent | null;
  private _routerAgent: RouterAgent | null;
  private memory: Memory;

  constructor(requestBody: PromptRequestBody, storage: Storage) {
    this.memory = new Memory(requestBody, storage);
    this._attireAgent = null;
    this._routerAgent = null;
    this._weatherAgent = null;
    this._imageAnalysisAgent = null;
  }

  run(prompt: string, image?: Buffer) {
    this.memory.recordMessage('user', prompt);
    if (image) {
      return this.imageInput(image);
    }
    return this.textInput(prompt);
  }

  private async *textInput(prompt: string) {
    await this.memory.recordPart('user', prompt);
    const route = await this.routerAgent.run();

    switch (route) {
      case 'direct_weather':
        const attire = await this.attireAgent.run();
        await this.memory.recordMessage('model', attire.recommendation);
        const completeResponse = {
          action: 'complete' as const,
          convoId: this.memory.convoId,
          data: {
            ...attire,
          },
        };
        yield completeResponse;
        break;
      case 'location_description':
        const weatherData = await this.weatherAgent.run();
        const message =
          weatherData.action === 'followup'
            ? weatherData.data.question
            : weatherData.action === 'location_confirmed'
            ? weatherData.data.message
            : null;
        if (message) {
          await this.memory.recordMessage('model', message);
        }

        yield weatherData;
        if (weatherData.action !== 'followup') {
          const attire = await this.attireAgent.run();
          await this.memory.recordMessage('model', attire.recommendation);
          const completeResponse: SystemResultGeneric<'complete', Attire> = {
            action: 'complete',
            convoId: this.memory.convoId,
            data: {
              ...attire,
            },
          };

          yield completeResponse;
        }
        break;
      default:
        break;
    }
  }

  private async *imageInput(image: Buffer) {
    const imageData = image.toString('base64');
    await this.imageAnalysisAgent.run(imageData);

    yield* this.getAttireStream();
  }

  private async *getAttireStream() {
    const weatherData = await this.weatherAgent.run();

    switch (weatherData.action) {
      case 'followup': {
        await this.memory.recordMessage('model', weatherData.data.question);
        const response = {
          ...weatherData,
          convoId: this.memory.convoId,
        };
        yield response;
        break;
      }
      case 'location_confirmed': {
        await this.memory.recordMessage('model', weatherData.data.message);
        const locationResponse = {
          action: 'location' as const,
          convoId: this.memory.convoId,
          data: {
            message: weatherData.data.message,
          },
        };

        yield locationResponse;

        const attire = await this.attireAgent.run();
        await this.memory.recordMessage('model', attire.recommendation);
        const completeResponse = {
          action: 'complete' as const,
          convoId: this.memory.convoId,
          data: {
            locationName: weatherData.data.weather.name,
            ...attire,
          },
        };
        yield completeResponse;
        break;
      }
      case 'weather': {
        const attire = await this.attireAgent.run();
        await this.memory.recordMessage('model', attire.recommendation);
        const completeResponse = {
          action: 'complete' as const,
          convoId: this.memory.convoId,
          data: {
            locationName: weatherData.data.name,
            ...attire,
          },
        };
        yield completeResponse;
        break;
      }
    }
  }

  // Getters
  private get routerAgent() {
    if (this._routerAgent) {
      return this._routerAgent;
    }
    this._routerAgent = new RouterAgent(this.memory);
    return this._routerAgent;
  }

  private get attireAgent() {
    if (this._attireAgent) {
      return this._attireAgent;
    }
    this._attireAgent = new AttireAgent(this.memory);
    return this._attireAgent;
  }

  private get weatherAgent() {
    if (this._weatherAgent) {
      return this._weatherAgent;
    }
    this._weatherAgent = new WeatherAgent(this.memory);
    return this._weatherAgent;
  }

  private get imageAnalysisAgent() {
    if (this._imageAnalysisAgent) {
      return this._imageAnalysisAgent;
    }
    this._imageAnalysisAgent = new ImageAnalysisAgent(this.memory);
    return this._imageAnalysisAgent;
  }
}

export default Orchestrator;
