import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { validateParams } from '../middleware/validation';
import { getProductByIdParamSchema } from '../schemas/product';

const router: Router = Router();
const productController = new ProductController();

// Health check endpoint
router.get('/health', productController.healthCheck);

// Get product by ID
router.get('/products/:id', validateParams(getProductByIdParamSchema), productController.getProductById);

export default router;