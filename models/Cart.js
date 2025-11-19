const db = require('../config/database');

class Cart {
    static async addItem(userId, productId, quantity = 1) {
        const [result] = await db.query(
            `INSERT INTO cart (user_id, product_id, quantity) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
            [userId, productId, quantity, quantity]
        );
        return result.insertId || result.affectedRows;
    }

    static async getItems(userId) {
        const [rows] = await db.query(
            `SELECT c.cart_id, c.quantity, c.added_at,
                    p.product_id, p.product_name, p.price, p.image_url, 
                    p.stock_quantity, p.brand
             FROM cart c
             INNER JOIN products p ON c.product_id = p.product_id
             WHERE c.user_id = ? AND p.is_active = TRUE
             ORDER BY c.added_at DESC`,
            [userId]
        );
        return rows;
    }

    static async updateQuantity(cartId, userId, quantity) {
        if (quantity <= 0) {
            return await this.removeItem(cartId, userId);
        }

        const [result] = await db.query(
            'UPDATE cart SET quantity = ? WHERE cart_id = ? AND user_id = ?',
            [quantity, cartId, userId]
        );
        return result.affectedRows > 0;
    }

    static async removeItem(cartId, userId) {
        const [result] = await db.query(
            'DELETE FROM cart WHERE cart_id = ? AND user_id = ?',
            [cartId, userId]
        );
        return result.affectedRows > 0;
    }

    static async clearCart(userId) {
        const [result] = await db.query(
            'DELETE FROM cart WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows;
    }

    static async getCartTotal(userId) {
        const [rows] = await db.query(
            `SELECT SUM(c.quantity * p.price) as total
             FROM cart c
             INNER JOIN products p ON c.product_id = p.product_id
             WHERE c.user_id = ? AND p.is_active = TRUE`,
            [userId]
        );
        return rows[0].total || 0;
    }

    static async getItemCount(userId) {
        const [rows] = await db.query(
            'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?',
            [userId]
        );
        return rows[0].count || 0;
    }
}

module.exports = Cart;
