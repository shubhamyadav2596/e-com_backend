const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const multer = require("multer");
const { isConfigured: cloudinaryConfigured } = require("../config/cloudinary");

const useMemoryUploads =
  process.env.NODE_ENV === 'production' ||
  cloudinaryConfigured;

const upload = multer({ storage: useMemoryUploads ? multer.memoryStorage() : multer.diskStorage({ destination: "uploads/" }) });

const router = express.Router();

router
  .route("/")
  .get(getProducts)
  .post(protect, admin, upload.single("image"), createProduct);
router
  .route("/:id")
  .get(getProductById)
  .put(protect, admin, upload.single("image"), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
