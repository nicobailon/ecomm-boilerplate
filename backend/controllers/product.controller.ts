import { Request, Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { redis } from '../lib/redis.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { Product } from '../models/product.model.js';



export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const { category, page = 1, limit = 12 } = req.query;
  
  // Validate and sanitize pagination parameters
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 12));
  
  const query = category ? { category } : {};
  const skip = (pageNum - 1) * limitNum;
  
  const [products, total] = await Promise.all([
    Product.find(query).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  let featuredProducts = await redis.get("featured_products");
  if (featuredProducts) {
    res.json(JSON.parse(featuredProducts));
    return;
  }

  const featuredProductsData = await Product.find({ isFeatured: true }).lean();

  if (!featuredProductsData || featuredProductsData.length === 0) {
    res.status(404).json({ message: "No featured products found" });
    return;
  }

  await redis.set("featured_products", JSON.stringify(featuredProductsData), 'EX', 3600);

  res.json(featuredProductsData);
});

export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, price, image, category } = req.body;

  if (!image) {
    throw new AppError('Product image URL is required', 400);
  }

  const product = await Product.create({
    name,
    description,
    price,
    image,
    category,
  });

  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, price, image, category } = req.body;
  
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { name, description, price, image, category },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.image) {
    // Extract the file key from the UploadThing URL
    const fileKey = product.image.substring(product.image.lastIndexOf("/") + 1);
    try {
      // Use utapi to delete the file from cloud storage
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi();
      await utapi.deleteFiles([fileKey]);
      console.log("Deleted image from UploadThing");
    } catch (error) {
      console.error("Error deleting image from UploadThing", error);
      // Do not block product deletion if image deletion fails, but log the error.
    }
  }

  await Product.findByIdAndDelete(req.params.id);

  res.json({ message: "Product deleted successfully" });
});

export const getRecommendedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.aggregate([
    {
      $sample: { size: 4 },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        image: 1,
        price: 1,
      },
    },
  ]);

  res.json(products);
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const products = await Product.find({ category });
  res.json({ products });
});

export const toggleFeaturedProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductsCache();
    res.json(updatedProduct);
  } else {
    throw new AppError('Product not found', 404);
  }
});

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts), 'EX', 3600);
  } catch (error) {
    console.log("error in update cache function");
  }
}