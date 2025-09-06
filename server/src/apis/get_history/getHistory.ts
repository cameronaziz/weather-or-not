import { FunctionDeclaration, Type } from '@google/genai';
import Memory from '../../storage/Memory';

export const getHistoryFunctionDeclaration: FunctionDeclaration = {
  name: 'get_history',
  description:
    'Loads user conversation history into context for better understanding of user preferences and past interactions',
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

const getHistory = async (memory: Memory, last: number): Promise<string> => {
  const conversations = await memory.getHistory(last);

  if (conversations.length === 0) {
    return 'No previous conversation history found for this user.';
  }

  const formattedHistory = conversations
    .map((conversation, index) => {
      const messageCount = conversation.messages.length;
      const lastMessageDate = new Date(
        conversation.lastMessageDateTime
      ).toLocaleDateString();

      const conversationSummary = conversation.messages
        .slice(-3)
        .map((msg) => {
          const role = msg.role === 'user' ? 'User' : 'Assistant';
          const text =
            typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text);
          return `${role}: ${text.slice(0, 100)}${
            text.length > 100 ? '...' : ''
          }`;
        })
        .join('\n  ');

      return `Conversation ${
        index + 1
      } (${lastMessageDate}, ${messageCount} messages):
  ${conversationSummary}`;
    })
    .join('\n\n');

  return `Previous conversation history (${conversations.length} conversations):\n\n${formattedHistory}`;
};

export default getHistory;
