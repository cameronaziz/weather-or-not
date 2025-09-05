import { FunctionDeclaration, Type } from '@google/genai';
import { ProductListing } from '../../types';
import getRefreshToken from './refreshToken';

const MARKETPLACE_ID = 'ATVPDKIKX0DER';
const BASE_URL =
  'https://sellingpartnerapi-na.amazon.com/catalog/2022-04-01/items';

type Item = {
  asin: string;
  attributes?: {
    title?: [{ value?: string }];
    images?: [{ link?: string }];
  };
};

type ProductReponse = {
  items?: Item[];
};

export const searchProductsFunctionDeclaration: FunctionDeclaration = {
  name: 'search_products',
  description: 'Search for clothing products based on weather conditions',
  parameters: {
    type: Type.OBJECT,
    properties: {
      searchQuery: {
        type: Type.STRING,
        description: 'The search query for clothing products',
      },
    },
    required: ['searchQuery'],
  },
};

const searchProducts = async (
  searchQuery: string
): Promise<ProductListing[]> => {
  const tokenResponse = await getRefreshToken();
  const tokenData = JSON.parse(tokenResponse);
  const accessToken = tokenData.access_token;
  const keywords = encodeURIComponent(searchQuery);
  const url = `${BASE_URL}?keywords=${keywords}&marketplaceIds=${MARKETPLACE_ID}&pageSize=10`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-amz-access-token': accessToken,
    },
  });

  if (response.status !== 200) {
    return [];
  }

  const data = (await response.json()) as ProductReponse;

  return (
    data.items?.slice(0, 5).map((item) => ({
      name: item.attributes?.title?.[0]?.value || 'Unknown Product',
      imageURL: item.attributes?.images?.[0]?.link || '',
      link: `https://www.amazon.com/dp/${item.asin}`,
    })) || []
  );
};

export default searchProducts;
