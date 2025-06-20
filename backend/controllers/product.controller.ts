import { Request, Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { productService } from '../services/product.service.js';

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const { search, page = '1', limit = '12' } = req.query;
  
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 12;
  
  const result = await productService.getAllProducts(
    pageNum as number, 
    limitNum as number, 
    search as string | undefined,
  );
  
  res.json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const featuredProducts = await productService.getFeaturedProducts();
  res.json(featuredProducts);
});

export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, price, image, collectionId, isFeatured = false, variants = [], relatedProducts = [] } = req.body as {
    name: string;
    description: string;
    price: number;
    image: string;
    collectionId?: string;
    isFeatured?: boolean;
    variants?: any[];
    relatedProducts?: string[];
  };

  const product = await productService.createProduct({
    name,
    description,
    price,
    image,
    collectionId,
    isFeatured,
    variants,
    relatedProducts,
  });

  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, price, image, collectionId, isFeatured, variants, relatedProducts } = req.body as {
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    collectionId?: string;
    isFeatured?: boolean;
    variants?: any[];
    relatedProducts?: string[];
  };
  
  const product = await productService.updateProduct(req.params.id, {
    name,
    description,
    price,
    image,
    collectionId,
    isFeatured,
    variants,
    relatedProducts,
  });

  res.json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id);
  res.json({ message: 'Product deleted successfully' });
});

export const getRecommendedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productService.getRecommendedProducts();
  res.json(products);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  res.json(product);
});

export const toggleFeaturedProduct = asyncHandler(async (req: Request, res: Response) => {
  const updatedProduct = await productService.toggleFeaturedProduct(req.params.id);
  res.json(updatedProduct);
});