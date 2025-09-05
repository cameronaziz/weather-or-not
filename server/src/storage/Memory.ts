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
  private initialized: boolean = false;

  constructor(requestBody: PromptRequestBody, private storage: Storage) {
    this.model = 'gemini-2.5-flash';
    this.convoId = requestBody.convoId ?? crypto.randomUUID();
    this.userId = requestBody.userId;
    this.conversation = [];
    this.history = {};
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const fullConversation = await this.storage.getFullConversation(
      this.userId,
      this.convoId
    );
    this.conversation = fullConversation.messages || [];
    this.history = await this.storage.getHistory(this.userId);
    this.initialized = true;
  }

  public async recordMessage(role: Role, input: string | Part): Promise<void> {
    await this.initialize();

    const dateTime = new Date().toISOString();
    const part: Part = typeof input === 'string' ? { text: input } : input;
    const messageToStore: MessageToStore = {
      role,
      text: JSON.stringify(part),
      dateTime,
    };

    await this.storage.addMessage(this.userId, this.convoId, messageToStore);

    this.conversation.push({
      role,
      text: part,
      dateTime,
    });
  }

  public async getConversation(): Promise<Content[]> {
    await this.initialize();

    return this.conversation.map(
      (message): Content => ({
        role: message.role,
        parts: [message.text],
      })
    );
  }

  public async getHistory(last: number): Promise<StoredConversation[]> {
    await this.initialize();
    return Object.values(this.history).slice(-last);
  }
}

export default Memory;
