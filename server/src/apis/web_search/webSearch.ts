import { FunctionDeclaration, Type } from '@google/genai';
import { get } from 'https';
import { JSDOM } from 'jsdom';

const fetchHtmlContent = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    get(url, (res) => {
      let html = '';
      res.on('data', (chunk) => {
        html += chunk;
      });
      res.on('end', () => {
        resolve(html);
      });
      res.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });

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
  const results = data.web?.results || [];

  const pagesPromises = results.slice(0, 3).map(async (result) => {
    try {
      const content = await fetchHtmlContent(result.url as string);
      const dom = new JSDOM(content);

      return {
        title: result.title,
        description: result.title,
        content: dom.window.document.body.textContent,
      };
    } catch {
      return {
        title: result.title,
        description: result.title,
      };
    }
  });

  const fetchedPages = await Promise.allSettled(pagesPromises);
  const unfetchedPages = results.slice(3).map((result) => ({
    title: result.title,
    description: result.title,
  }));

  return JSON.stringify([...fetchedPages, ...unfetchedPages]);
};

export default webSearch;
