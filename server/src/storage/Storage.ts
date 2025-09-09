import { Part } from '@google/genai';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { Message, MessageToStore, Role, StoredConversation } from '../types';
import { Migrations } from './migrations';

type RawMessage = {
  id: string;
  text: string;
  date_time: string;
  role: string;
};

type FrontendMessage = {
  id: string;
  role: string;
  input: string;
  dateTime: string;
};

type RawFrontendMessage = {
  id: string;
  role: string;
  input: string;
  date_time: string;
};

class Storage {
  private pool: Pool;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DEPLOYMENT === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initTables();
    await this.initPromise;
    this.initialized = true;
  }

  private async initTables(): Promise<void> {
    try {
      // Run migrations to create/update all tables
      const migrations = new Migrations(this.pool);
      await migrations.runMigrations();
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  async createUser(hostname: string, userId?: string): Promise<string> {
    await this.ensureInitialized();
    const id = userId ?? randomUUID();

    try {
      const now = new Date().toISOString();
      await this.pool.query(
        'INSERT INTO users (id, hostname, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [id, hostname, now]
      );
      return id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createConversation(userId: string): Promise<string> {
    await this.ensureInitialized();
    await this.ensureUser(userId);
    const id = randomUUID();

    try {
      const now = new Date().toISOString();
      await this.pool.query(
        'INSERT INTO conversations (id, user_id, last_message_datetime, created_at) VALUES ($1, $2, $3, $4)',
        [id, userId, now, now]
      );
      return id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async verifyUser(userId: string): Promise<string> {
    await this.ensureInitialized();
    try {
      const result = await this.pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length > 0) {
        return userId;
      }

      const newUserId = randomUUID();
      const now = new Date().toISOString();
      await this.pool.query(
        'INSERT INTO users (id, hostname, created_at) VALUES ($1, $2, $3)',
        [newUserId, null, now]
      );
      return newUserId;
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  }

  async getHistory(
    userId: string
  ): Promise<Record<string, StoredConversation>> {
    await this.ensureInitialized();
    await this.ensureUser(userId);

    try {
      const convResult = await this.pool.query(
        'SELECT id, last_message_datetime FROM conversations WHERE user_id = $1',
        [userId]
      );

      const result: Record<string, StoredConversation> = {};

      for (const conv of convResult.rows) {
        // N+1 DB queries :(
        const msgResult = await this.pool.query(
          'SELECT id, text, date_time, role FROM messages WHERE conversation_id = $1 ORDER BY date_time ASC',
          [conv.id]
        );

        const messages = this.transformRawMessages(msgResult.rows);

        result[conv.id] = {
          convoId: conv.id,
          lastMessageDateTime: conv.last_message_datetime,
          messages: messages,
        };
      }

      return result;
    } catch (error) {
      console.error('Error getting history:', error);
      throw error;
    }
  }

  async getFullConversation(
    userId: string,
    convoId: string
  ): Promise<StoredConversation> {
    await this.ensureInitialized();
    const key = convoId || 'default';
    await this.ensureUser(userId);

    try {
      const convResult = await this.pool.query(
        'SELECT id, last_message_datetime FROM conversations WHERE id = $1 AND user_id = $2',
        [key, userId]
      );

      if (convResult.rows.length === 0) {
        const now = new Date().toISOString();
        await this.ensureConversation(key, userId, now);

        return {
          convoId: key,
          lastMessageDateTime: now,
          messages: [],
        };
      }

      const conversation = convResult.rows[0];

      const msgResult = await this.pool.query(
        'SELECT id, text, date_time, role FROM messages WHERE conversation_id = $1 ORDER BY date_time ASC',
        [key]
      );

      const messages = this.transformRawMessages(msgResult.rows);

      return {
        convoId: key,
        lastMessageDateTime: conversation.last_message_datetime,
        messages: messages,
      };
    } catch (error) {
      console.error('Error getting full conversation:', error);
      throw error;
    }
  }

  async getConversation(userId: string, convoId: string): Promise<Message[]> {
    const conversation = await this.getFullConversation(userId, convoId);
    return conversation.messages;
  }

  async getPublicConversation(
    userId: string,
    convoId: string
  ): Promise<Message[]> {
    const conversation = await this.getFullConversation(userId, convoId);
    return conversation.messages;
  }

  async addMessage(
    userId: string,
    convoId: string,
    message: MessageToStore
  ): Promise<void> {
    await this.ensureInitialized();
    const key = convoId || 'default';
    await this.ensureUser(userId);
    await this.ensureConversation(key, userId, message.dateTime);

    try {
      const messageId = randomUUID();

      await this.pool.query(
        'INSERT INTO messages (id, conversation_id, text, role, date_time) VALUES ($1, $2, $3, $4, $5)',
        [messageId, key, message.text, message.role, message.dateTime]
      );

      await this.pool.query(
        'UPDATE conversations SET last_message_datetime = $1 WHERE id = $2 AND user_id = $3',
        [message.dateTime, key, userId]
      );
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  async addFrontendMessage(
    userId: string,
    convoId: string,
    message: FrontendMessage
  ): Promise<void> {
    await this.ensureInitialized();
    const key = convoId || 'default';
    await this.ensureUser(userId);
    await this.ensureConversation(key, userId, message.dateTime);

    try {
      await this.pool.query(
        'INSERT INTO frontend_messages (id, conversation_id, input, role, date_time) VALUES ($1, $2, $3, $4, $5)',
        [message.id, key, message.input, message.role, message.dateTime]
      );

      await this.pool.query(
        'UPDATE conversations SET last_message_datetime = $1 WHERE id = $2 AND user_id = $3',
        [message.dateTime, key, userId]
      );
    } catch (error) {
      console.error('Error adding frontend message:', error);
      throw error;
    }
  }

  async getFrontendMessages(userId: string, convoId: string) {
    await this.ensureInitialized();
    await this.ensureUser(userId);

    try {
      const isValidUser = this.isValidUser(userId, convoId);
      if (!isValidUser) {
        return [];
      }

      const result = await this.pool.query(
        'SELECT id, input, role, date_time FROM frontend_messages WHERE conversation_id = $1 ORDER BY date_time ASC',
        [convoId]
      );

      return result.rows.map((row: RawFrontendMessage) => ({
        id: row.id,
        role: row.role,
        text: row.input,
        dateTime: row.date_time,
      }));
    } catch (error) {
      console.error('Error getting frontend messages:', error);
      throw error;
    }
  }

  async isValidUser(userId: string, convoId: string) {
    const convResult = await this.pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [convoId, userId]
    );

    return convResult.rows.length > 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getAllUsers(): Promise<string[]> {
    await this.ensureInitialized();
    try {
      const result = await this.pool.query('SELECT id FROM users');
      return result.rows.map((row) => row.id);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  private transformRawMessages(rawMessages: RawMessage[]): Message[] {
    return rawMessages.map((msg): Message => {
      let parsedText;
      try {
        parsedText = JSON.parse(msg.text);
        if (typeof parsedText === 'string') {
          parsedText = JSON.parse(parsedText);
        }
      } catch (error) {
        parsedText = { text: msg.text };
      }

      const validPart = this.ensureValidPart(parsedText);
      return {
        id: msg.id,
        text: validPart,
        dateTime: msg.date_time,
        role: msg.role as Role,
      };
    });
  }

  private ensureValidPart(parsedText: any): Part {
    if (parsedText && typeof parsedText.text === 'string') {
      return { text: parsedText.text };
    }

    if (typeof parsedText === 'string') {
      return { text: parsedText };
    }

    if (parsedText && parsedText.functionCall) {
      return { text: parsedText.text || '' };
    }

    if (parsedText && parsedText.functionResponse) {
      return { text: parsedText.text || '' };
    }

    return { text: '' };
  }

  private async ensureConversation(
    conversationId: string,
    userId: string,
    timestamp: string
  ): Promise<void> {
    try {
      const result = await this.pool.query(
        'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );

      if (result.rows.length === 0) {
        await this.pool.query(
          'INSERT INTO conversations (id, user_id, last_message_datetime, created_at) VALUES ($1, $2, $3, $4)',
          [conversationId, userId, timestamp, timestamp]
        );
      }
    } catch (error) {
      console.error('Error ensuring conversation:', error);
      throw error;
    }
  }

  private async ensureUser(userId: string): Promise<void> {
    try {
      const result = await this.pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        const now = new Date().toISOString();
        await this.pool.query(
          'INSERT INTO users (id, hostname, created_at) VALUES ($1, $2, $3)',
          [userId, null, now]
        );
      }
    } catch (error) {
      console.error('Error ensuring user:', error);
      throw error;
    }
  }
}

export default Storage;
