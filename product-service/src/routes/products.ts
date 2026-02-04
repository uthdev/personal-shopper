import { Router } from 'express';
import { ProductController } from '../controllers/productController';

const router: Router = Router();
const productController = new ProductController();

// Health check endpoint
router.get('/health', productController.healthCheck);

// Get product by ID
router.get('/products/:id', productController.getProductById);

export default router;