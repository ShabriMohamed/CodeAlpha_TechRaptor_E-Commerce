const Product = require('../models/Product');

class ProductController {
    static async getProducts(req, res) {
        try {
            const { category, search, min_price, max_price, brand, page = 1, limit = 20 } = req.query;
            
            const filters = {};
            if (category) filters.category_id = parseInt(category);
            if (search) filters.search = search;
            if (min_price) filters.min_price = parseFloat(min_price);
            if (max_price) filters.max_price = parseFloat(max_price);
            if (brand) filters.brand = brand;

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const products = await Product.getAll(filters, parseInt(limit), offset);

            res.json({
                success: true,
                data: products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get products error:', error);
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
            const product = await Product.findById(id);

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

    static async getFeaturedProducts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 6;
            const products = await Product.getFeatured(limit);

            res.json({
                success: true,
                data: products
            });

        } catch (error) {
            console.error('Get featured products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch featured products',
                error: error.message
            });
        }
    }

    static async getCategories(req, res) {
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

    static async getBrands(req, res) {
        try {
            const brands = await Product.getBrands();

            res.json({
                success: true,
                data: brands
            });

        } catch (error) {
            console.error('Get brands error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brands',
                error: error.message
            });
        }
    }
}

module.exports = ProductController;
