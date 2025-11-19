const db = require('../config/database');

class Product {
    static async create(productData) {
        const {
            category_id,
            product_name,
            description,
            specifications,
            price,
            stock_quantity,
            image_url,
            brand,
            model,
            is_featured = false
        } = productData;

        const [result] = await db.query(
            `INSERT INTO products (category_id, product_name, description, specifications, price, 
             stock_quantity, image_url, brand, model, is_featured) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category_id,
                product_name,
                description,
                JSON.stringify(specifications),
                price,
                stock_quantity,
                image_url,
                brand,
                model,
                is_featured
            ]
        );

        return result.insertId;
    }

    static async findById(productId) {
        const [rows] = await db.query(
            `SELECT p.*, c.category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.category_id 
             WHERE p.product_id = ? AND p.is_active = TRUE`,
            [productId]
        );
        return rows[0];
    }

    static async getAll(filters = {}, limit = 20, offset = 0) {
        let query = `
            SELECT p.*, c.category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id 
            WHERE p.is_active = TRUE
        `;
        const params = [];

        if (filters.category_id) {
            query += ' AND p.category_id = ?';
            params.push(filters.category_id);
        }

        if (filters.search) {
            query += ' AND (p.product_name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (filters.min_price) {
            query += ' AND p.price >= ?';
            params.push(filters.min_price);
        }

        if (filters.max_price) {
            query += ' AND p.price <= ?';
            params.push(filters.max_price);
        }

        if (filters.brand) {
            query += ' AND p.brand = ?';
            params.push(filters.brand);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getFeatured(limit = 6) {
        const [rows] = await db.query(
            `SELECT p.*, c.category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.category_id 
             WHERE p.is_featured = TRUE AND p.is_active = TRUE 
             ORDER BY p.created_at DESC 
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async update(productId, updateData) {
        const allowedFields = [
            'category_id', 'product_name', 'description', 'specifications',
            'price', 'stock_quantity', 'image_url', 'brand', 'model',
            'is_featured', 'is_active'
        ];

        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(key === 'specifications' ? JSON.stringify(value) : value);
            }
        }

        if (updates.length === 0) {
            return false;
        }

        values.push(productId);
        await db.query(
            `UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`,
            values
        );

        return true;
    }

    static async updateStock(productId, quantity) {
        const [result] = await db.query(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
            [quantity, productId]
        );
        return result.affectedRows > 0;
    }

    static async delete(productId) {
        const [result] = await db.query(
            'UPDATE products SET is_active = FALSE WHERE product_id = ?',
            [productId]
        );
        return result.affectedRows > 0;
    }

    static async getCategories() {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY category_name');
        return rows;
    }

    static async getBrands() {
        const [rows] = await db.query(
            'SELECT DISTINCT brand FROM products WHERE is_active = TRUE ORDER BY brand'
        );
        return rows.map(row => row.brand);
    }

    static async getAllAdmin(filters = {}, limit = 50, offset = 0) {
        let query = `
            SELECT p.*, c.category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id 
            WHERE 1=1
        `;
        const params = [];

        if (!filters.includeInactive) {
            query += ' AND p.is_active = TRUE';
        }

        if (filters.category_id) {
            query += ' AND p.category_id = ?';
            params.push(filters.category_id);
        }

        if (filters.search) {
            query += ' AND (p.product_name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async findByIdAdmin(productId) {
        const [rows] = await db.query(
            `SELECT p.*, c.category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id 
            WHERE p.product_id = ?`,
            [productId]
        );
        return rows[0];
    }

    // Category Management Methods
    static async createCategory(categoryData) {
        const { category_name, description, image_url } = categoryData;
        
        const [result] = await db.query(
            'INSERT INTO categories (category_name, description, image_url) VALUES (?, ?, ?)',
            [category_name, description, image_url]
        );
        
        return result.insertId;
    }

    static async updateCategory(categoryId, updateData) {
        const allowedFields = ['category_name', 'description', 'image_url'];
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

        values.push(categoryId);
        const [result] = await db.query(
            `UPDATE categories SET ${updates.join(', ')} WHERE category_id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    static async deleteCategory(categoryId) {
        // Check if category has products
        const [products] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [categoryId]
        );

        if (products[0].count > 0) {
            throw new Error('Cannot delete category with existing products');
        }

        const [result] = await db.query(
            'DELETE FROM categories WHERE category_id = ?',
            [categoryId]
        );

        return result.affectedRows > 0;
    }

    static async getCategoryById(categoryId) {
        const [rows] = await db.query(
            'SELECT * FROM categories WHERE category_id = ?',
            [categoryId]
        );
        return rows[0];
    }


    }

module.exports = Product;
