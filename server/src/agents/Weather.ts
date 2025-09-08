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

    const textPart = parts.find((part) => part.text);
    if (textPart?.text) {
      await this.memory.recordPart('model', {
        text: textPart.text,
      });
    }

    if (functionCall) {
      await this.memory.recordPart('model', {
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
        await this.memory.recordPart('user', {
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
        await this.memory.recordPart('user', {
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
        const {
          message,
          latitude,
          longitude,
          name,
          dateType,
          startDate,
          endDate,
          timeContext,
        } = functionCall.args as {
          message: string;
          latitude: number;
          longitude: number;
          name: string;
          dateType?: string;
          startDate?: string;
          endDate?: string;
          timeContext?: string;
        };
        const weather = await getWeather({
          latitude,
          longitude,
          name,
          dateType: dateType || 'default',
          startDate,
          endDate,
          timeContext,
        });

        await this.memory.recordPart('user', {
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

        await this.memory.recordPart('user', {
          functionResponse: {
            name: functionCall?.name,
            response: {
              question,
            },
          },
        });

        return {
          action: 'followup',
          convoId: this.memory.convoId,
          data: {
            question,
          },
        };
      }
      case 'get_weather': {
        const {
          name,
          latitude,
          longitude,
          dateType,
          startDate,
          endDate,
          timeContext,
        } = functionCall.args as {
          name: string;
          latitude: number;
          longitude: number;
          dateType?: string;
          startDate?: string;
          endDate?: string;
          timeContext?: string;
        };

        const weather = await getWeather({
          latitude,
          longitude,
          name,
          dateType: dateType || 'default',
          startDate,
          endDate,
          timeContext,
        });

        await this.memory.recordPart('user', {
          functionResponse: {
            name: functionCall?.name,
            response: weather,
          },
        });

        return {
          action: 'location_confirmed',
          convoId: this.memory.convoId,
          data: {
            message: name,
            weather,
          },
        };
      }
      default:
        const textPart = parts.find((part) => part.text);
        if (textPart?.text) {
          return {
            action: 'followup',
            convoId: this.memory.convoId,
            data: {
              question: textPart.text,
            },
          };
        }

        return this.run();
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
