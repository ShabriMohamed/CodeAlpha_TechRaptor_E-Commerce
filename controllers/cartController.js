const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartController {
    static async addToCart(req, res) {
        try {
            const { product_id, quantity = 1 } = req.body;
            const userId = req.user.userId;

            const product = await Product.findById(product_id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (product.stock_quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock available'
                });
            }

            await Cart.addItem(userId, product_id, quantity);

            const cartCount = await Cart.getItemCount(userId);

            res.json({
                success: true,
                message: 'Product added to cart',
                data: {
                    cartCount
                }
            });

        } catch (error) {
            console.error('Add to cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add product to cart',
                error: error.message
            });
        }
    }

    static async getCart(req, res) {
        try {
            const userId = req.user.userId;
            const items = await Cart.getItems(userId);
            const total = await Cart.getCartTotal(userId);

            res.json({
                success: true,
                data: {
                    items,
                    total,
                    itemCount: items.length
                }
            });

        } catch (error) {
            console.error('Get cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch cart',
                error: error.message
            });
        }
    }

    static async updateCartItem(req, res) {
        try {
            const { cart_id, quantity } = req.body;
            const userId = req.user.userId;

            const updated = await Cart.updateQuantity(cart_id, userId, quantity);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            const total = await Cart.getCartTotal(userId);

            res.json({
                success: true,
                message: 'Cart updated successfully',
                data: {
                    total
                }
            });

        } catch (error) {
            console.error('Update cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update cart',
                error: error.message
            });
        }
    }

    static async removeCartItem(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const removed = await Cart.removeItem(id, userId);

            if (!removed) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            res.json({
                success: true,
                message: 'Item removed from cart'
            });

        } catch (error) {
            console.error('Remove cart item error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove item from cart',
                error: error.message
            });
        }
    }

    static async clearCart(req, res) {
        try {
            const userId = req.user.userId;
            await Cart.clearCart(userId);

            res.json({
                success: true,
                message: 'Cart cleared successfully'
            });

        } catch (error) {
            console.error('Clear cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clear cart',
                error: error.message
            });
        }
    }

    static async getCartCount(req, res) {
        try {
            const userId = req.user.userId;
            const count = await Cart.getItemCount(userId);

            res.json({
                success: true,
                data: {
                    count
                }
            });

        } catch (error) {
            console.error('Get cart count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch cart count',
                error: error.message
            });
        }
    }
}

module.exports = CartController;
