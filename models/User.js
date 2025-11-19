const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { first_name, last_name, email, password, phone, role = 'customer' } = userData;
        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            'INSERT INTO users (first_name, last_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, phone, role]
        );

        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async findById(userId) {
        const [rows] = await db.query(
            'SELECT user_id, first_name, last_name, email, phone, role, created_at FROM users WHERE user_id = ?',
            [userId]
        );
        return rows[0];
    }

    static async update(userId, updateData) {
        const allowedFields = ['first_name', 'last_name', 'phone'];
        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            return false;
        }

        values.push(userId);
        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
        );

        return true;
    }

    static async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }

    static async getAll(limit = 50, offset = 0) {
        const [rows] = await db.query(
            'SELECT user_id, first_name, last_name, email, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        return rows;
    }

    static async delete(userId) {
        const [result] = await db.query(
            'DELETE FROM users WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = User;
