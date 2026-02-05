import { Product } from '../models/Product';
import { CustomError } from '../middleware/errorHandler';
import { IProduct } from '../types/product';
import logger from '../utils/logger';

export class ProductService {
  async getProductById(id: string): Promise<IProduct> {

    const product = await Product.findById(id);

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    if (!product.isActive) {
      throw new CustomError('Product is not available', 404);
    }

    logger.info(`Product retrieved: ${id}`);
    return product.toObject();
  }
}