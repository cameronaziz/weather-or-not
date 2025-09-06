import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { Message, MessageToStore, Role, StoredConversation } from '../types';

type RawMessage = {
  id: string;
  text: string;
  date_time: string;
  role: string;
  internal: boolean;
};

type RawConversation = {
  id: string;
  last_message_datetime: string;
};

class Storage {
  private pool: Pool;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this.initTables();
    await this.initPromise;
    this.initialized = true;
  }

  private async initTables(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          last_message_datetime TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          text TEXT NOT NULL,
          role TEXT NOT NULL,
          date_time TEXT NOT NULL,
          internal BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        );
      `);
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  }

  async createUser(userId?: string): Promise<string> {
    await this.ensureInitialized();
    const id = userId ?? randomUUID();
    
    try {
      await this.pool.query('INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [id]);
      return id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async verifyUser(userId: string): Promise<string> {
    await this.ensureInitialized();
    try {
      const result = await this.pool.query('SELECT id FROM users WHERE id = $1', [userId]);

      if (result.rows.length > 0) {
        return userId;
      }

      const newUserId = randomUUID();
      await this.pool.query('INSERT INTO users (id) VALUES ($1)', [newUserId]);
      return newUserId;
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  }

  async getHistory(userId: string): Promise<Record<string, StoredConversation>> {
    await this.ensureInitialized();
    await this.ensureUser(userId);

    try {
      const convResult = await this.pool.query(
        'SELECT id, last_message_datetime FROM conversations WHERE user_id = $1',
        [userId]
      );

      const result: Record<string, StoredConversation> = {};

      for (const conv of convResult.rows) {
        const msgResult = await this.pool.query(
          'SELECT id, text, date_time, role, internal FROM messages WHERE conversation_id = $1 ORDER BY date_time ASC',
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
    convoId: string,
    includeInternal: boolean = true
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
        'SELECT id, text, date_time, role, internal FROM messages WHERE conversation_id = $1 ORDER BY date_time ASC',
        [key]
      );

      const messages = this.transformRawMessages(msgResult.rows);
      const filteredMessages = includeInternal
        ? messages
        : messages.filter((msg) => !msg.internal);

      return {
        convoId: key,
        lastMessageDateTime: conversation.last_message_datetime,
        messages: filteredMessages,
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

  async getPublicConversation(userId: string, convoId: string): Promise<Message[]> {
    const conversation = await this.getFullConversation(userId, convoId, false);
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
        'INSERT INTO messages (id, conversation_id, text, role, date_time, internal) VALUES ($1, $2, $3, $4, $5, $6)',
        [messageId, key, JSON.stringify(message.text), message.role, message.dateTime, message.internal]
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

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getAllUsers(): Promise<string[]> {
    await this.ensureInitialized();
    try {
      const result = await this.pool.query('SELECT id FROM users');
      return result.rows.map(row => row.id);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  private transformRawMessages(rawMessages: RawMessage[]): Message[] {
    return rawMessages.map(
      (msg): Message => ({
        id: msg.id,
        text: JSON.parse(msg.text),
        dateTime: msg.date_time,
        role: msg.role as Role,
        internal: msg.internal,
      })
    );
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
          'INSERT INTO conversations (id, user_id, last_message_datetime) VALUES ($1, $2, $3)',
          [conversationId, userId, timestamp]
        );
      }
    } catch (error) {
      console.error('Error ensuring conversation:', error);
      throw error;
    }
  }

  private async ensureUser(userId: string): Promise<void> {
    try {
      const result = await this.pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      
      if (result.rows.length === 0) {
        await this.pool.query('INSERT INTO users (id) VALUES ($1)', [userId]);
      }
    } catch (error) {
      console.error('Error ensuring user:', error);
      throw error;
    }
  }
}

export default Storage;