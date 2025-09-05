type GET_ENDPOINT = 'register' | 'conversation';
type POST_ENDPOINT = 'prompt';

class API {
  private static createFormData(input: Record<string, null | string | Blob>) {
    const formData = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, value);
      }
    });
    return formData;
  }

  private static basePath(endpoint: GET_ENDPOINT | POST_ENDPOINT) {
    // In production (including vercel --prod), use relative API routes
    if (import.meta.env.PROD) {
      return `/api/${endpoint}`;
    }
    // In development, use localhost with port
    const port = import.meta.env.VITE_SERVER_PORT;
    return `http://localhost:${port}/${endpoint}`;
  }

  private static path(
    endpoint: GET_ENDPOINT | POST_ENDPOINT,
    params?: Record<string, string>
  ) {
    const basePath = API.basePath(endpoint);
    if (!params) {
      return basePath;
    }
    const queryString = new URLSearchParams(params).toString();

    return `${basePath}?${queryString}`;
  }

  static async get<T>(
    endpoint: GET_ENDPOINT,
    query?: Record<string, string>
  ): Promise<T> {
    const path = API.path(endpoint, query);
    const response = await fetch(path, {
      method: 'GET',
      credentials: 'include',
    });
    return response.json() as Promise<T>;
  }

  static async *post<T>(
    input: Record<string, null | string | Blob>,
    endpoint: POST_ENDPOINT
  ) {
    const path = API.path(endpoint);
    const body = API.createFormData(input);

    try {
      const response = await fetch(path, {
        method: 'POST',
        body,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get reader');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data as T;
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

export default API;
