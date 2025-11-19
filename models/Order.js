const db = require('../config/database');

class Order {
    static async create(orderData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const {
                user_id,
                total_amount,
                shipping_address,
                shipping_city,
                shipping_state,
                shipping_zip,
                shipping_country,
                payment_method,
                items
            } = orderData;

            const [orderResult] = await connection.query(
                `INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, 
                 shipping_state, shipping_zip, shipping_country, payment_method) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user_id,
                    total_amount,
                    shipping_address,
                    shipping_city,
                    shipping_state,
                    shipping_zip,
                    shipping_country,
                    payment_method
                ]
            );

            const orderId = orderResult.insertId;

            for (const item of items) {
                await connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.price]
                );

                await connection.query(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                    [item.quantity, item.product_id]
                );
            }

            await connection.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

            await connection.commit();
            return orderId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findById(orderId, userId = null) {
        let query = `
            SELECT o.*, u.email, u.first_name, u.last_name
            FROM orders o
            INNER JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        `;
        const params = [orderId];

        if (userId) {
            query += ' AND o.user_id = ?';
            params.push(userId);
        }

        const [rows] = await db.query(query, params);
        return rows[0];
    }

    static async getOrderItems(orderId) {
        const [rows] = await db.query(
            `SELECT oi.*, p.product_name, p.image_url, p.brand
             FROM order_items oi
             INNER JOIN products p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [orderId]
        );
        return rows;
    }

    static async getUserOrders(userId, limit = 20, offset = 0) {
        const [rows] = await db.query(
            `SELECT o.*, COUNT(oi.order_item_id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.order_id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.order_id
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        return rows;
    }

    static async getAll(filters = {}, limit = 50, offset = 0) {
        let query = `
            SELECT o.*, u.email, u.first_name, u.last_name,
                   COUNT(oi.order_item_id) as item_count
            FROM orders o
            INNER JOIN users u ON o.user_id = u.user_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND o.status = ?';
            params.push(filters.status);
        }

        if (filters.payment_status) {
            query += ' AND o.payment_status = ?';
            params.push(filters.payment_status);
        }

        query += ' GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async updateStatus(orderId, status) {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid order status');
        }

        const [result] = await db.query(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [status, orderId]
        );
        return result.affectedRows > 0;
    }

    static async updatePaymentStatus(orderId, paymentStatus) {
        const validStatuses = ['pending', 'completed', 'failed'];
        
        if (!validStatuses.includes(paymentStatus)) {
            throw new Error('Invalid payment status');
        }

        const [result] = await db.query(
            'UPDATE orders SET payment_status = ? WHERE order_id = ?',
            [paymentStatus, orderId]
        );
        return result.affectedRows > 0;
    }

    static async getDashboardStats() {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(total_amount) as total_revenue,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) as today_revenue
            FROM orders
        `);
        return stats[0];
    }
}

module.exports = Order;
