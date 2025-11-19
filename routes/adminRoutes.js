const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: fileFilter
});

const categoryUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/categories/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: fileFilter
});

router.use(authenticateToken);
router.use(isAdmin);

router.get('/dashboard', AdminController.getDashboard);

router.get('/orders', AdminController.getAllOrders);
router.put('/orders/:id/status', AdminController.updateOrderStatus);

router.get('/products', AdminController.getAllProducts);
router.get('/products/:id', AdminController.getProductById);
router.post('/products', upload.single('image'), AdminController.createProduct);
router.put('/products/:id', upload.single('image'), AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);

router.get('/users', AdminController.getAllUsers);

router.get('/categories', AdminController.getAllCategories);
router.get('/categories/:id', AdminController.getCategoryById);
router.post('/categories', categoryUpload.single('image'), AdminController.createCategory);
router.put('/categories/:id', categoryUpload.single('image'), AdminController.updateCategory);
router.delete('/categories/:id', AdminController.deleteCategory);

module.exports = router;
