import { FunctionDeclaration, Type } from '@google/genai';

export const askClarificationFunctionDeclaration: FunctionDeclaration = {
  name: 'ask_clarification',
  description:
    'Ask for clearer description when you cannot determine location. Be punny with the question, the user likely gave you a riddle.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: 'Ask the user for more information',
      },
      possibilities: {
        type: Type.ARRAY,
        description: 'The list of possible locations',
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'The name of the location',
            },
            confidence: {
              type: Type.NUMBER,
              minimum: 0,
              maximum: 1,
              description: 'The confidence that this is the correct location',
            },
            latitude: {
              type: Type.NUMBER,
              description: 'The latitude',
            },
            longitude: {
              type: Type.NUMBER,
              description: 'The longitude',
            },
          },
          required: ['name', 'confidence', 'latitude', 'longitude'],
        },
      },
    },
    required: ['possibilities', 'question'],
  },
};

export const confirmLocationFunctionDeclaration: FunctionDeclaration = {
  name: 'confirm_location',
  description:
    'Provide a human-readable confirmation message about finding the location before proceeding with weather.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      message: {
        type: Type.STRING,
        description: 'Human-readable message about finding the location (e.g., "Looks like you want to know what to wear in New York, let me figure that out")',
      },
      latitude: {
        type: Type.NUMBER,
        description: 'The latitude of the location',
      },
      longitude: {
        type: Type.NUMBER,
        description: 'The longitude of the location',
      },
      name: {
        type: Type.STRING,
        description: 'The name of the location',
      },
    },
    required: ['message', 'latitude', 'longitude', 'name'],
  },
};
