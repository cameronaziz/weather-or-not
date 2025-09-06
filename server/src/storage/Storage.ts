import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { Worker } from 'worker_threads';
import { Message, MessageToStore, Role, StoredConversation } from '../types';

type RawMessage = {
  id: string;
  text: string;
  date_time: string;
  role: string;
  internal: number;
};

type RawConversation = {
  id: string;
  last_message_datetime: string;
};

const DATA_DIR = '../data';

class Storage {
  private worker: Worker;
  private pendingOperations: Map<
    string,
    { resolve: Function; reject: Function }
  > = new Map();

  constructor() {
    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    this.worker = new Worker('./src/storage/worker.mjs');

    this.worker.on('message', ({ id, result, error }) => {
      const pending = this.pendingOperations.get(id);
      if (pending) {
        this.pendingOperations.delete(id);
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(result);
        }
      }
    });

    this.callWorker('init', [DATA_DIR]);
  }

  async createUser(userId?: string): Promise<string> {
    const id = userId ?? crypto.randomUUID();
    await this.callWorker('insertUser', [id]);
    return id;
  }

  async verifyUser(userId: string): Promise<string> {
    const userExists = await this.callWorker('selectUser', [userId]);

    if (userExists) {
      return userId;
    }

    const newUserId = randomUUID();
    await this.callWorker('insertUser', [newUserId]);
    return newUserId;
  }

  async getHistory(
    userId: string
  ): Promise<Record<string, StoredConversation>> {
    await this.ensureUser(userId);

    const conversations = (await this.callWorker('selectConversations', [
      userId,
    ])) as RawConversation[];

    const result: Record<string, StoredConversation> = {};

    // Ensure conversations is an array before iterating
    if (!Array.isArray(conversations)) {
      return result;
    }

    for (const conv of conversations) {
      const rawMessages = (await this.callWorker('selectMessages', [
        conv.id,
      ])) as RawMessage[];

      const messages = this.transformRawMessages(rawMessages);

      result[conv.id] = {
        convoId: conv.id,
        lastMessageDateTime: conv.last_message_datetime,
        messages: messages,
      };
    }

    return result;
  }

  async getFullConversation(
    userId: string,
    convoId: string,
    includeInternal: boolean = true
  ): Promise<StoredConversation> {
    const key = convoId || 'default';

    await this.ensureUser(userId);

    const conversation = (await this.callWorker('selectConversation', [
      key,
      userId,
    ])) as { id: string; last_message_datetime: string } | undefined;

    if (!conversation) {
      const now = new Date().toISOString();
      await this.ensureConversation(key, userId, now);

      return {
        convoId: key,
        lastMessageDateTime: now,
        messages: [],
      };
    }

    const rawMessages = (await this.callWorker('selectMessages', [
      key,
    ])) as RawMessage[];

    const messages = this.transformRawMessages(rawMessages);
    const filteredMessages = includeInternal
      ? messages
      : messages.filter((msg) => !msg.internal);

    return {
      convoId: key,
      lastMessageDateTime: conversation.last_message_datetime,
      messages: filteredMessages,
    };
  }

  async getConversation(userId: string, convoId: string): Promise<Message[]> {
    const conversation = await this.getFullConversation(userId, convoId);
    return conversation.messages;
  }

  async getPublicConversation(
    userId: string,
    convoId: string
  ): Promise<Message[]> {
    const conversation = await this.getFullConversation(userId, convoId, false);
    return conversation.messages;
  }

  async addMessage(
    userId: string,
    convoId: string,
    message: MessageToStore
  ): Promise<void> {
    const key = convoId || 'default';
    await this.ensureUser(userId);

    await this.ensureConversation(key, userId, message.dateTime);

    await this.callWorker('insertMessage', [
      key,
      message.text,
      message.role,
      message.dateTime,
      message.internal,
    ]);

    await this.callWorker('updateConversationTimestamp', [
      message.dateTime,
      key,
      userId,
    ]);
  }

  async close(): Promise<void> {
    await this.worker.terminate();
  }

  private callWorker(method: string, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      this.pendingOperations.set(id, { resolve, reject });
      this.worker.postMessage({ id, method, args });
    });
  }

  private transformRawMessages(rawMessages: RawMessage[]): Message[] {
    return rawMessages.map(
      (msg): Message => ({
        id: msg.id,
        text: JSON.parse(msg.text),
        dateTime: msg.date_time,
        role: msg.role as Role,
        internal: Boolean(msg.internal),
      })
    );
  }

  private async ensureConversation(
    conversationId: string,
    userId: string,
    timestamp: string
  ): Promise<void> {
    const conversationExists = await this.callWorker('selectConversation', [
      conversationId,
      userId,
    ]);

    if (!conversationExists) {
      await this.callWorker('insertConversation', [
        conversationId,
        userId,
        timestamp,
      ]);
    }
  }

  private async ensureUser(userId: string): Promise<void> {
    const userExists = await this.callWorker('selectUser', [userId]);
    if (!userExists) {
      await this.callWorker('insertUser', [userId]);
    }
  }
}

export default Storage;
