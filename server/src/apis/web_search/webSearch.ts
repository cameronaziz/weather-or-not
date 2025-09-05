import { FunctionDeclaration, Type } from '@google/genai';

const ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

export const webSearchFunctionDeclaration: FunctionDeclaration = {
  name: 'web_search',
  description: 'Searches internet for more context',
  parameters: {
    type: Type.OBJECT,
    properties: {
      searchString: {
        type: Type.STRING,
        description: 'The search string to the search engine',
      },
    },
    required: ['searchString'],
  },
};

type BraveResponse = Record<string, unknown> & {
  web?: {
    type: 'search';
    results?: Record<string, unknown>[];
    family_friendly: boolean;
  };
};

const webSearch = async (searchString: string): Promise<string> => {
  const response = await fetch(
    `${ENDPOINT}?q=${encodeURIComponent(searchString)}`,
    {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': process.env.BRAVE_API_KEY || '',
      },
    }
  );

  const data = (await response.json()) as BraveResponse;
  return JSON.stringify(data.web?.results?.slice(0, 3) || []);
};

export default webSearch;
