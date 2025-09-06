import { GenerateContentResponse, ToolListUnion } from '@google/genai';
import { getHistoryFunctionDeclaration } from '../apis/get_history/getHistory';
import getWeather, {
  getWeatherFunctionDeclaration,
} from '../apis/get_weather/getWeather';
import webSearch, {
  webSearchFunctionDeclaration,
} from '../apis/web_search/webSearch';
import {
  askClarificationFunctionDeclaration,
  confirmLocationFunctionDeclaration,
} from '../functionDeclarations';
import Memory from '../storage/Memory';
import { LocationResult } from '../types';
import Agent from './Agent';

class WeatherAgent extends Agent {
  constructor(memory: Memory) {
    super('weather', memory);
  }

  async run(): Promise<LocationResult> {
    const response = await this.generateContent({
      tools: WeatherAgent.tools,
    });

    return this.executeFunction(response);
  }

  private async executeFunction(
    response: GenerateContentResponse
  ): Promise<LocationResult> {
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCall = parts.find((part) => part.functionCall)?.functionCall;

    if (functionCall) {
      await this.memory.recordMessage('model', {
        functionCall: {
          name: functionCall.name,
          args: functionCall.args,
        },
      });
    }

    switch (functionCall?.name) {
      case 'web_search': {
        const { searchString } = functionCall.args as {
          searchString: string;
        };
        const searchResults = await webSearch(searchString);
        await this.memory.recordMessage('user', {
          functionResponse: {
            name: functionCall?.name,
            response: {
              text: searchResults,
            },
          },
        });

        return this.run();
      }
      case 'get_history': {
        const { last } = functionCall.args as { last: number };
        const history = await this.memory.getHistory(last);
        await this.memory.recordMessage('user', {
          functionResponse: {
            name: functionCall?.name,
            response: {
              history,
            },
          },
        });

        return this.run();
      }
      // Exits
      case 'confirm_location': {
        const { message, latitude, longitude, name } = functionCall.args as {
          message: string;
          latitude: number;
          longitude: number;
          name: string;
        };
        await this.memory.recordMessage('model', {
          text: message,
        });
        const weather = await getWeather({
          latitude,
          longitude,
          name,
        });

        await this.memory.recordMessage('user', {
          functionResponse: {
            name: functionCall?.name,
            response: weather,
          },
        });
        return {
          action: 'location_confirmed',
          convoId: this.memory.convoId,
          data: {
            message,
            weather,
          },
        };
      }
      case 'ask_clarification': {
        const { question } = functionCall.args as {
          question: string;
        };

        await this.memory.recordMessage('user', {
          functionResponse: {
            name: functionCall?.name,
            response: {
              question,
            },
          },
        });

        // Record the clarification question in memory so it's included in subsequent conversations
        await this.memory.recordMessage('model', question);

        return {
          action: 'followup',
          convoId: this.memory.convoId,
          data: {
            question,
          },
        };
      }
      default:
        return {
          action: 'followup',
          convoId: this.memory.convoId,
          data: {
            question: 'Cannot determine location',
          },
        };
    }
  }

  private static tools: ToolListUnion = [
    {
      functionDeclarations: [
        webSearchFunctionDeclaration,
        askClarificationFunctionDeclaration,
        confirmLocationFunctionDeclaration,
        getWeatherFunctionDeclaration,
        getHistoryFunctionDeclaration,
      ],
    },
  ];
}

export default WeatherAgent;
