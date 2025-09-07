import { searchProductsFunctionDeclaration } from '../apis/search_products/searchProducts';
import Memory from '../storage/Memory';
import { Attire } from '../types';
import Agent from './Agent';

class AttireAgent extends Agent {
  constructor(memory: Memory) {
    super('attire', memory);
  }

  public async run(): Promise<Attire> {
    const response = await this.generateContent({
      tools: [
        {
          functionDeclarations: [searchProductsFunctionDeclaration],
        },
      ],
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const result: Attire = {
      recommendation: '',
      listings: [],
    };

    await Promise.all(
      parts.map(async (part) => {
        const { functionCall, text } = part;
        await this.memory.recordPart('model', {
          text,
          functionCall,
        });

        if (text) {
          result.recommendation = text.trim();
        }

        if (functionCall) {
          switch (functionCall.name) {
            case 'search_products':
              const { searchQuery } = functionCall.args as {
                searchQuery: string;
              };
            // result.listings = await searchProducts(searchQuery);
            // this.memory.recordMessage('user', {
            //   text,
            //   functionResponse: {
            //     name: functionCall.name,
            //     response: {
            //       listings: result.listings,
            //     },
            //   },
            // });
          }
        }
      })
    );

    return result;
  }
}

export default AttireAgent;
