const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

class AdminController {
    static async getDashboard(req, res) {
        try {
            const orderStats = await Order.getDashboardStats();

            const [userCountResult] = await require('../config/database').query(
                'SELECT COUNT(*) as count FROM users WHERE role = "customer"'
            );

            const [productCountResult] = await require('../config/database').query(
                'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE'
            );

            const [lowStockResult] = await require('../config/database').query(
                'SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10 AND is_active = TRUE'
            );

            res.json({
                success: true,
                data: {
                    orders: orderStats,
                    totalUsers: userCountResult[0].count,
                    totalProducts: productCountResult[0].count,
                    lowStockProducts: lowStockResult[0].count
                }
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard data',
                error: error.message
            });
        }
    }

    static async getAllOrders(req, res) {
        try {
            const { status, payment_status, page = 1, limit = 50 } = req.query;
            
            const filters = {};
            if (status) filters.status = status;
            if (payment_status) filters.payment_status = payment_status;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const orders = await Order.getAll(filters, parseInt(limit), offset);

            res.json({
                success: true,
                data: orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get all orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    }

    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const updated = await Order.updateStatus(id, status);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                message: 'Order status updated successfully'
            });

        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    }

    static async getAllProducts(req, res) {
        try {
            const { page = 1, limit = 50, search, category } = req.query;
            
            const filters = {};
            if (search) filters.search = search;
            if (category) filters.category_id = parseInt(category);
            filters.includeInactive = true;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const products = await Product.getAllAdmin(filters, parseInt(limit), offset);

            res.json({
                success: true,
                data: products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get all products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch products',
                error: error.message
            });
        }
    }

    static async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findByIdAdmin(id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                data: product
            });

        } catch (error) {
            console.error('Get product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product',
                error: error.message
            });
        }
    }

    static async createProduct(req, res) {
        try {
            const productData = {
                ...req.body,
                image_url: req.file ? `/uploads/products/${req.file.filename}` : null,
                specifications: req.body.specifications ? JSON.parse(req.body.specifications) : null,
                is_featured: req.body.is_featured === '1' || req.body.is_featured === 'true',
                is_active: req.body.is_active === '1' || req.body.is_active === 'true'
            };

            const productId = await Product.create(productData);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: { productId }
            });

        } catch (error) {
            console.error('Create product error:', error);
            
            if (req.file) {
                await fs.unlink(path.join(__dirname, '..', 'uploads', 'products', req.file.filename))
                    .catch(err => console.error('Failed to delete uploaded file:', err));
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                error: error.message
            });
        }
    }

    static async updateProduct(req, res) {
        try {
            const { id } = req.params;

            const existingProduct = await Product.findByIdAdmin(id);
            if (!existingProduct) {
                if (req.file) {
                    await fs.unlink(path.join(__dirname, '..', 'uploads', 'products', req.file.filename))
                        .catch(err => console.error('Failed to delete uploaded file:', err));
                }
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            const updateData = { ...req.body };

            if (req.file) {
                updateData.image_url = `/uploads/products/${req.file.filename}`;
                
                if (existingProduct.image_url && existingProduct.image_url.startsWith('/uploads/')) {
                    const oldImagePath = path.join(__dirname, '..', existingProduct.image_url);
                    await fs.unlink(oldImagePath).catch(err => 
                        console.log('Old image not found or already deleted:', err.message)
                    );
                }
            }

            if (req.body.specifications) {
                try {
                    updateData.specifications = JSON.parse(req.body.specifications);
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid JSON format in specifications'
                    });
                }
            }

            if (req.body.is_featured !== undefined) {
                updateData.is_featured = req.body.is_featured === '1' || req.body.is_featured === 'true';
            }
            
            if (req.body.is_active !== undefined) {
                updateData.is_active = req.body.is_active === '1' || req.body.is_active === 'true';
            }

            const updated = await Product.update(id, updateData);

            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'No changes made or product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product updated successfully'
            });

        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error.message
            });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            
            const product = await Product.findByIdAdmin(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            const deleted = await Product.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product deactivated successfully'
            });

        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error.message
            });
        }
    }

    static async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const users = await User.getAll(limit, offset);

            res.json({
                success: true,
                data: users,
                pagination: { page, limit }
            });

        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users',
                error: error.message
            });
        }
    }

    // Category Management Methods
    static async getAllCategories(req, res) {
        try {
            const categories = await Product.getCategories();

            res.json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                error: error.message
            });
        }
    }

    static async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const category = await Product.getCategoryById(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.json({
                success: true,
                data: category
            });

        } catch (error) {
            console.error('Get category error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch category',
                error: error.message
            });
        }
    }

    static async createCategory(req, res) {
        try {
            const categoryData = {
                ...req.body,
                image_url: req.file ? `/uploads/categories/${req.file.filename}` : null
            };

            const categoryId = await Product.createCategory(categoryData);

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: { categoryId }
            });

        } catch (error) {
            console.error('Create category error:', error);
            
            if (req.file) {
                await fs.unlink(path.join(__dirname, '..', 'uploads', 'categories', req.file.filename))
                    .catch(err => console.error('Failed to delete uploaded file:', err));
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create category',
                error: error.message
            });
        }
    }

    static async updateCategory(req, res) {
        try {
            const { id } = req.params;

            const existingCategory = await Product.getCategoryById(id);
            if (!existingCategory) {
                if (req.file) {
                    await fs.unlink(path.join(__dirname, '..', 'uploads', 'categories', req.file.filename))
                        .catch(err => console.error('Failed to delete uploaded file:', err));
                }
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const updateData = { ...req.body };

            if (req.file) {
                updateData.image_url = `/uploads/categories/${req.file.filename}`;
                
                if (existingCategory.image_url && existingCategory.image_url.startsWith('/uploads/')) {
                    const oldImagePath = path.join(__dirname, '..', existingCategory.image_url);
                    await fs.unlink(oldImagePath).catch(err => 
                        console.log('Old image not found or already deleted:', err.message)
                    );
                }
            }

            const updated = await Product.updateCategory(id, updateData);

            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'No changes made or category not found'
                });
            }

            res.json({
                success: true,
                message: 'Category updated successfully'
            });

        } catch (error) {
            console.error('Update category error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update category',
                error: error.message
            });
        }
    }

    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;

            const category = await Product.getCategoryById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const deleted = await Product.deleteCategory(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            if (category.image_url && category.image_url.startsWith('/uploads/')) {
                await fs.unlink(path.join(__dirname, '..', category.image_url))
                    .catch(err => console.log('Image already deleted or not found'));
            }

            res.json({
                success: true,
                message: 'Category deleted successfully'
            });

        } catch (error) {
            console.error('Delete category error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete category',
                error: error.message
            });
        }
    }

}

module.exports = AdminController;
