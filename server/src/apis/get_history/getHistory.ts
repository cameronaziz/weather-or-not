import { FunctionDeclaration, Type } from '@google/genai';
import Storage from '../../storage/Storage';
import { Message, StoredConversation } from '../../types';

export const getHistoryFunctionDeclaration: FunctionDeclaration = {
  name: 'get_history',
  description: 'Loads conversation history into context',
  parameters: {
    type: Type.OBJECT,
    properties: {
      last: {
        type: Type.NUMBER,
        description: 'The amount of history items to retrieve',
      },
    },
    required: ['last'],
  },
};

const getHistory = (storage: Storage, userId: string, convoId: string, last: number): Message[] => {
  const conversation = storage.getFullConversation(userId, convoId);
  return conversation.messages.slice(-last);
};

export default getHistory;
