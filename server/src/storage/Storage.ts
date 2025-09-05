import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { Message, MessageToStore, Role, StoredConversation } from '../types';

class Storage {
  private database: Database.Database;

  constructor() {
    const dataDir = path.join(__dirname, '..', `data`);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      this.database = new Database('./data/weather-or-not.db');
      this.initializeTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  }

  private ensureUser(userId: string) {
    const userExists = this.database
      .prepare('SELECT id FROM users WHERE id = ?')
      .get(userId);
    if (!userExists) {
      this.database.prepare('INSERT INTO users (id) VALUES (?)').run(userId);
    }
  }

  getHistory(userId: string): Record<string, StoredConversation> {
    this.ensureUser(userId);

    // Get all conversations for this user
    const conversations = this.database
      .prepare(
        `SELECT id, last_message_datetime
         FROM conversations
         WHERE user_id = ?
         ORDER BY last_message_datetime DESC`
      )
      .all(userId) as Array<{ id: string; last_message_datetime: string }>;

    const result: Record<string, StoredConversation> = {};

    for (const conv of conversations) {
      // Get messages for this conversation
      const rawMessages = this.database
        .prepare(
          `SELECT text, date_time, role
           FROM messages
           WHERE conversation_id = ?
           ORDER BY date_time ASC`
        )
        .all(conv.id) as Array<{
        text: string;
        date_time: string;
        role: string;
      }>;

      const messages = rawMessages.map(
        (msg): Message => ({
          ...msg,
          text: JSON.parse(msg.text),
          dateTime: msg.date_time,
          role: msg.role as Role,
        })
      );

      result[conv.id] = {
        convoId: conv.id,
        lastMessageDateTime: conv.last_message_datetime,
        messages: messages,
      };
    }

    return result;
  }

  getFullConversation(userId: string, convoId: string): StoredConversation {
    const key = convoId || 'default';

    this.ensureUser(userId);

    // Check if conversation exists
    const conversation = this.database
      .prepare(
        `SELECT id, last_message_datetime
         FROM conversations
         WHERE id = ? AND user_id = ?`
      )
      .get(key, userId) as
      | { id: string; last_message_datetime: string }
      | undefined;

    if (!conversation) {
      // Create new conversation
      const now = new Date().toISOString();
      this.database
        .prepare(
          `INSERT INTO conversations (id, user_id, last_message_datetime)
           VALUES (?, ?, ?)`
        )
        .run(key, userId, now);

      return {
        convoId: key,
        lastMessageDateTime: now,
        messages: [],
      };
    }

    // Get messages for existing conversation
    const rawMessages = this.database
      .prepare(
        `SELECT text, date_time, role
         FROM messages
         WHERE conversation_id = ?
         ORDER BY date_time ASC`
      )
      .all(key) as Array<{ text: string; date_time: string; role: string }>;

    const messages = rawMessages.map((msg) => ({
      ...msg,
      text: JSON.parse(msg.text),
      dateTime: msg.date_time,
      role: msg.role as Role,
    }));

    return {
      convoId: key,
      lastMessageDateTime: conversation.last_message_datetime,
      messages: messages,
    };
  }

  getConversation(userId: string, convoId: string): Message[] {
    return this.getFullConversation(userId, convoId).messages;
  }

  addMessage(userId: string, convoId: string, message: MessageToStore): void {
    const key = convoId || 'default';

    // Ensure user exists
    this.ensureUser(userId);

    // Ensure conversation exists
    const conversationExists = this.database
      .prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?')
      .get(key, userId);

    if (!conversationExists) {
      this.database
        .prepare(
          `INSERT INTO conversations (id, user_id, last_message_datetime)
           VALUES (?, ?, ?)`
        )
        .run(key, userId, message.dateTime);
    }

    // Insert message
    this.database
      .prepare(
        `INSERT INTO messages (conversation_id, text, role, date_time)
         VALUES (?, ?, ?, ?)`
      )
      .run(key, message.text, message.role, message.dateTime);

    // Update conversation's last message datetime
    this.database
      .prepare(
        `UPDATE conversations
         SET last_message_datetime = ?
         WHERE id = ? AND user_id = ?`
      )
      .run(message.dateTime, key, userId);
  }

  private initializeTables(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        last_message_datetime DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        text TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'model')),
        date_time DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id
      ON conversations(user_id)
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
      ON messages(conversation_id)
    `);

    this.database.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_date_time
      ON messages(date_time)
    `);
  }

  close(): void {
    this.database.close();
  }
}

export default Storage;
