const Product = require('../models/Product');
const { cloudinary, isConfigured: hasCloudinaryConfig } = require('../config/cloudinary');
const fs = require('fs/promises');
const path = require('path');
const { Readable } = require('stream');

const getLocalImageUrl = (file) => {
  if (!file || !file.path) {
    throw new Error('Local file storage is unavailable in this environment. Configure Cloudinary for image uploads.');
  }

  return `/uploads/${path.basename(file.path)}`;
};

const removeLocalFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not remove uploaded temp file: ${error.message}`);
    }
  }
};

const uploadBufferToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'shopnest/products' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

const getProductImageUrl = async (file) => {
  if (!file) {
    throw new Error('Product image is required');
  }

  if (!hasCloudinaryConfig) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cloudinary configuration is required in production for image uploads. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    }
    return getLocalImageUrl(file);
  }

  try {
    const result = file.buffer
      ? await uploadBufferToCloudinary(file.buffer)
      : await cloudinary.uploader.upload(file.path, { folder: 'shopnest/products' });

    if (file.path) {
      await removeLocalFile(file.path);
    }

    return result.secure_url;
  } catch (error) {
    console.error(`Cloudinary upload failed: ${error.message}`, {
      code: error.http_code || error.code,
      request_id: error.request_id,
      status: error.http_code || error.status,
    });
    if (file.path && process.env.NODE_ENV !== 'production') {
      return getLocalImageUrl(file);
    }
    throw new Error('Cloudinary upload failed. Verify your credentials and account permissions.');
  }
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
    const imageUrl = await getProductImageUrl(req.file);
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

      if (req.file) {
        product.imageUrl = await getProductImageUrl(req.file);
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
