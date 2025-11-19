const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', CartController.getCart);
router.get('/count', CartController.getCartCount);
router.post('/add', CartController.addToCart);
router.put('/update', CartController.updateCartItem);
router.delete('/remove/:id', CartController.removeCartItem);
router.delete('/clear', CartController.clearCart);

module.exports = router;
