import Database from 'better-sqlite3';
import { parentPort } from 'worker_threads';

let db;
let statements;

const initDatabase = (dataDir) => {
  db = new Database(`${dataDir}/weather-or-not.db`);
  
  // Force database file creation by executing a simple query
  db.exec('PRAGMA journal_mode = WAL');

  db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

  db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        last_message_datetime DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

  db.exec(`
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

  statements = {
    insertUser: db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)'),
    selectUser: db.prepare('SELECT id FROM users WHERE id = ?'),
    selectConversation: db.prepare(
      'SELECT id, last_message_datetime FROM conversations WHERE id = ? AND user_id = ?'
    ),
    insertConversation: db.prepare(
      'INSERT OR IGNORE INTO conversations (id, user_id, last_message_datetime) VALUES (?, ?, ?)'
    ),
    selectMessages: db.prepare(
      'SELECT text, date_time, role FROM messages WHERE conversation_id = ? ORDER BY date_time ASC'
    ),
    insertMessage: db.prepare(
      'INSERT INTO messages (conversation_id, text, role, date_time) VALUES (?, ?, ?, ?)'
    ),
    updateConversationTimestamp: db.prepare(
      'UPDATE conversations SET last_message_datetime = ? WHERE id = ? AND user_id = ?'
    ),
    selectConversations: db.prepare(
      'SELECT id, last_message_datetime FROM conversations WHERE user_id = ? ORDER BY last_message_datetime DESC'
    ),
  };
};

parentPort.on('message', ({ id, method, args }) => {
  try {
    let result;

    switch (method) {
      case 'init':
        initDatabase(args[0]);
        result = 'initialized';
        break;
      case 'insertUser':
        result = statements.insertUser.run(args[0]);
        break;
      case 'selectUser':
        result = statements.selectUser.get(args[0]);
        break;
      case 'selectConversation':
        result = statements.selectConversation.get(args[0], args[1]);
        break;
      case 'insertConversation':
        result = statements.insertConversation.run(args[0], args[1], args[2]);
        break;
      case 'selectMessages':
        result = statements.selectMessages.all(args[0]);
        break;
      case 'insertMessage':
        result = statements.insertMessage.run(args[0], args[1], args[2], args[3]);
        break;
      case 'updateConversationTimestamp':
        result = statements.updateConversationTimestamp.run(args[0], args[1], args[2]);
        break;
      case 'selectConversations':
        result = statements.selectConversations.all(args[0]);
        break;
    }

    parentPort.postMessage({ id, result });
  } catch (error) {
    parentPort.postMessage({ id, error: error.message });
  }
});
