import { Content, Part } from '@google/genai';
import {
  Message,
  MessageToStore,
  PromptRequestBody,
  Role,
  StoredConversation,
} from '../types';
import Storage from './Storage';

class Memory {
  private conversation: Message[];
  private history: Record<string, StoredConversation>;
  public readonly convoId: string;
  public readonly userId: string;
  public readonly model: string;

  constructor(requestBody: PromptRequestBody, private storage: Storage) {
    this.model = 'gemini-2.5-flash';
    this.convoId = requestBody.convoId ?? crypto.randomUUID();
    this.userId = requestBody.userId;
    const fullConversation = this.storage.getFullConversation(
      this.userId,
      this.convoId
    );
    this.conversation = fullConversation.messages;
    this.history = this.storage.getHistory(this.userId);
  }

  public recordMessage(role: Role, input: string | Part) {
    const dateTime = new Date().toISOString();
    const part: Part = typeof input === 'string' ? { text: input } : input;
    const messageToStore: MessageToStore = {
      role,
      text: JSON.stringify(part),
      dateTime,
    };

    this.storage.addMessage(this.userId, this.convoId, messageToStore);

    this.conversation.push({
      role,
      text: part,
      dateTime,
    });
  }

  public getConversation(): Content[] {
    return this.conversation.map(
      (message): Content => ({
        role: message.role,
        parts: [message.text],
      })
    );
  }

  public getHistory(last: number): StoredConversation[] {
    return Object.values(this.history).slice(-last);
  }
}

export default Memory;
