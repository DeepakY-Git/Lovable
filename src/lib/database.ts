import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'database.sqlite');

class Database {
  private db: sqlite3.Database;
  private initialized: boolean = false;

  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.initTables();
  }

  private async initTables() {
    const run = promisify(this.db.run.bind(this.db));

    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('operator', 'technician', 'management')),
        employee_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Problem requests table
    await run(`
      CREATE TABLE IF NOT EXISTS problem_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
        operator_id INTEGER NOT NULL,
        technician_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operator_id) REFERENCES users (id),
        FOREIGN KEY (technician_id) REFERENCES users (id)
      )
    `);

    // Notifications table
    await run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        problem_request_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (problem_request_id) REFERENCES problem_requests (id)
      )
    `);

    // Create default admin user if not exists
    await this.createDefaultUsers();
    this.initialized = true;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initTables();
    }
  }

  private async createDefaultUsers() {
    const get = promisify(this.db.get.bind(this.db));
    const run = promisify(this.db.run.bind(this.db));

    // Check if any users exist
    const existingUser = await get('SELECT id FROM users LIMIT 1');
    
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Create default management user
      await run(`
        INSERT INTO users (username, email, password, role, employee_id, full_name, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['admin', 'admin@daawatfoods.com', hashedPassword, 'management', 'EMP001', 'System Administrator', true]);

      // Create sample technician
      const techPassword = await bcrypt.hash('tech123', 10);
      await run(`
        INSERT INTO users (username, email, password, role, employee_id, full_name, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['technician1', 'tech1@daawatfoods.com', techPassword, 'technician', 'EMP002', 'John Technician', true]);

      // Create sample operator
      const opPassword = await bcrypt.hash('op123', 10);
      await run(`
        INSERT INTO users (username, email, password, role, employee_id, full_name, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['operator1', 'op1@daawatfoods.com', opPassword, 'operator', 'EMP003', 'Jane Operator', true]);
    }
  }

  async getUser(identifier: string, isEmail = false) {
    await this.ensureInitialized();
    const get = promisify(this.db.get.bind(this.db));
    const field = isEmail ? 'email' : 'username';
    return await get(`SELECT * FROM users WHERE ${field} = ?`, [identifier]);
  }

  async createUser(userData: any) {
    await this.ensureInitialized();
    const run = promisify(this.db.run.bind(this.db));
    return await run(`
      INSERT INTO users (username, email, password, role, employee_id, full_name, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userData.username, userData.email, userData.password, userData.role, userData.employee_id, userData.full_name, false]);
  }

  async createProblemRequest(requestData: any) {
    const run = promisify(this.db.run.bind(this.db));
    const result = await run(`
      INSERT INTO problem_requests (title, description, priority, operator_id)
      VALUES (?, ?, ?, ?)
    `, [requestData.title, requestData.description, requestData.priority, requestData.operator_id]);
    
    return result;
  }

  async getProblemRequests(userId?: number, role?: string) {
    const all = promisify(this.db.all.bind(this.db));
    
    let query = `
      SELECT pr.*, 
             u1.full_name as operator_name,
             u2.full_name as technician_name
      FROM problem_requests pr
      LEFT JOIN users u1 ON pr.operator_id = u1.id
      LEFT JOIN users u2 ON pr.technician_id = u2.id
    `;
    
    if (role === 'operator' && userId) {
      query += ` WHERE pr.operator_id = ${userId}`;
    } else if (role === 'technician' && userId) {
      query += ` WHERE pr.technician_id = ${userId} OR pr.technician_id IS NULL`;
    }
    
    query += ` ORDER BY pr.created_at DESC`;
    
    return await all(query);
  }

  async updateProblemRequest(id: number, updates: any) {
    const run = promisify(this.db.run.bind(this.db));
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    return await run(`
      UPDATE problem_requests 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [...values, id]);
  }

  async createNotification(notificationData: any) {
    const run = promisify(this.db.run.bind(this.db));
    return await run(`
      INSERT INTO notifications (user_id, problem_request_id, message)
      VALUES (?, ?, ?)
    `, [notificationData.user_id, notificationData.problem_request_id, notificationData.message]);
  }

  async getNotifications(userId: number) {
    const all = promisify(this.db.all.bind(this.db));
    return await all(`
      SELECT n.*, pr.title as problem_title
      FROM notifications n
      LEFT JOIN problem_requests pr ON n.problem_request_id = pr.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `, [userId]);
  }

  async getTechnicians() {
    const all = promisify(this.db.all.bind(this.db));
    return await all(`
      SELECT id, username, full_name, email
      FROM users 
      WHERE role = 'technician' AND is_verified = TRUE
    `);
  }
}

export const database = new Database();