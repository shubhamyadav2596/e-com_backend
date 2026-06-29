const path = require('path');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const fallbackImageUrl = 'https://via.placeholder.com/300x300?text=ShopNest';

const hasCloudinaryConfig = () =>
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

const buildCloudinaryOptions = (filename) => ({
  folder: 'shopnest-products',
  public_id: `${Date.now()}-${path.parse(filename).name}`
});

const uploadBufferToCloudinary = async (file) => {
  if (!hasCloudinaryConfig()) {
    return { secure_url: fallbackImageUrl };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      buildCloudinaryOptions(file.originalname || 'image'),
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

const uploadBase64ToCloudinary = async (base64String, filename = 'image') => {
  if (!hasCloudinaryConfig()) {
    return { secure_url: fallbackImageUrl };
  }

  const base64Data = base64String.includes(';base64,')
    ? base64String.split(';base64,')[1]
    : base64String;

  if (!base64Data) {
    throw new Error('Invalid base64 image data');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      buildCloudinaryOptions(filename),
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(Buffer.from(base64Data, 'base64'));
  });
};

const uploadUrlToCloudinary = async (imageUrl, filename = 'image') => {
  if (!hasCloudinaryConfig()) {
    return { secure_url: imageUrl };
  }

  return cloudinary.uploader.upload(imageUrl, buildCloudinaryOptions(filename));
};

const isBase64DataUrl = (value) =>
  typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,');

const isHttpUrl = (value) =>
  typeof value === 'string' && /^https?:\/\//i.test(value);

const resolveImageUpload = async (req) => {
  if (req.file && req.file.buffer) {
    return uploadBufferToCloudinary(req.file);
  }

  if (isBase64DataUrl(req.body.image)) {
    return uploadBase64ToCloudinary(req.body.image, req.body.imageName);
  }

  if (isBase64DataUrl(req.body.imageUrl)) {
    return uploadBase64ToCloudinary(req.body.imageUrl, req.body.imageName);
  }

  if (isHttpUrl(req.body.imageUrl)) {
    return uploadUrlToCloudinary(req.body.imageUrl, req.body.imageName);
  }

  if (isHttpUrl(req.body.image)) {
    return uploadUrlToCloudinary(req.body.image, req.body.imageName);
  }

  return { secure_url: fallbackImageUrl };
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

    try {
      const result = await resolveImageUpload(req);
      imageUrl = result?.secure_url || fallbackImageUrl;
    } catch (error) {
      console.error('Image upload failed:', error.message);
      imageUrl = fallbackImageUrl;
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

      if (req.file || req.body.image || req.body.imageUrl) {
        try {
          const result = await resolveImageUpload(req);
          product.imageUrl = result?.secure_url || product.imageUrl || fallbackImageUrl;
        } catch (error) {
          console.error('Image upload failed:', error.message);
          product.imageUrl = product.imageUrl || fallbackImageUrl;
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
