const express = require('express');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, upload.any(), createProduct);
router.route('/:id').get(getProductById).put(protect, admin, upload.any(), updateProduct).delete(protect, admin, deleteProduct);

module.exports = router;
