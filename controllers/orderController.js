const Order = require('../models/Order');
const Cart = require('../models/Cart');

class OrderController {
    static async createOrder(req, res) {
        try {
            const userId = req.user.userId;
            const {
                shipping_address,
                shipping_city,
                shipping_state,
                shipping_zip,
                shipping_country,
                payment_method
            } = req.body;

            const cartItems = await Cart.getItems(userId);

            if (cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            for (const item of cartItems) {
                if (item.stock_quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${item.product_name}`
                    });
                }
            }

            const totalAmount = await Cart.getCartTotal(userId);

            const orderData = {
                user_id: userId,
                total_amount: totalAmount,
                shipping_address,
                shipping_city,
                shipping_state,
                shipping_zip,
                shipping_country,
                payment_method,
                items: cartItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const orderId = await Order.create(orderData);

            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                data: {
                    orderId
                }
            });

        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order',
                error: error.message
            });
        }
    }

    static async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.role === 'admin' ? null : req.user.userId;

            const order = await Order.findById(id, userId);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const items = await Order.getOrderItems(id);

            res.json({
                success: true,
                data: {
                    ...order,
                    items
                }
            });

        } catch (error) {
            console.error('Get order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order',
                error: error.message
            });
        }
    }

    static async getUserOrders(req, res) {
        try {
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const orders = await Order.getUserOrders(userId, limit, offset);

            res.json({
                success: true,
                data: orders,
                pagination: {
                    page,
                    limit
                }
            });

        } catch (error) {
            console.error('Get user orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    }
}

module.exports = OrderController;
