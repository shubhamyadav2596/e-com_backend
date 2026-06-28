const path = require('path');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const fallbackImageUrl = 'https://via.placeholder.com/300x300?text=ShopNest';

const uploadToCloudinary = async (file) => {
  const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

  if (!hasCloudinaryConfig) {
    return { secure_url: fallbackImageUrl };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'shopnest-products',
        public_id: `${Date.now()}-${path.parse(file.originalname).name}`
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    let imageUrl = fallbackImageUrl;
    if (req.file && req.file.buffer) {
      try {
        const result = await uploadToCloudinary(req.file);
        imageUrl = result?.secure_url || fallbackImageUrl;
      } catch (error) {
        console.error('Image upload failed:', error.message);
        imageUrl = fallbackImageUrl;
      }
    }
    const product = new Product({
      name, description, price, category, stock, imageUrl
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.category = category || product.category;
      product.stock = stock || product.stock;

      if (req.file && req.file.buffer) {
        try {
          const result = await uploadToCloudinary(req.file);
          product.imageUrl = result?.secure_url || fallbackImageUrl;
        } catch (error) {
          console.error('Image upload failed:', error.message);
          product.imageUrl = fallbackImageUrl;
        }
      }
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
