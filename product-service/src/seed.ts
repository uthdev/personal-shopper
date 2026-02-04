import { Product } from './models/Product';
import Database from './database';
import logger from './utils/logger';

const productData = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest Apple iPhone with A17 Pro chip and titanium design',
    price: 999.99,
    category: 'electronics',
    brand: 'Apple',
    sku: 'IPHONE15PRO128',
    stock: 50,
    images: ['https://example.com/iphone15pro.jpg'],
    specifications: {
      storage: '128GB',
      color: 'Natural Titanium',
      display: '6.1-inch Super Retina XDR',
    },
    isActive: true,
  },
  {
    name: 'Samsung Galaxy S24',
    description: 'Premium Android smartphone with AI features',
    price: 799.99,
    category: 'electronics',
    brand: 'Samsung',
    sku: 'GALAXYS24256',
    stock: 30,
    images: ['https://example.com/galaxys24.jpg'],
    specifications: {
      storage: '256GB',
      color: 'Phantom Black',
      display: '6.2-inch Dynamic AMOLED',
    },
    isActive: true,
  },
  {
    name: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Max Air cushioning',
    price: 150.00,
    category: 'footwear',
    brand: 'Nike',
    sku: 'AIRMAX270BLK10',
    stock: 25,
    images: ['https://example.com/airmax270.jpg'],
    specifications: {
      size: '10',
      color: 'Black/White',
      material: 'Mesh and synthetic',
    },
    isActive: true,
  },
  {
    name: 'MacBook Pro 14"',
    description: 'Professional laptop with M3 chip for creative work',
    price: 1999.99,
    category: 'electronics',
    brand: 'Apple',
    sku: 'MBP14M3512',
    stock: 15,
    images: ['https://example.com/macbookpro14.jpg'],
    specifications: {
      processor: 'M3 Pro',
      memory: '18GB',
      storage: '512GB SSD',
      color: 'Space Gray',
    },
    isActive: true,
  },
  {
    name: 'Levi\'s 501 Jeans',
    description: 'Classic straight-fit jeans in vintage wash',
    price: 89.99,
    category: 'clothing',
    brand: 'Levi\'s',
    sku: 'LEVIS50132X32',
    stock: 40,
    images: ['https://example.com/levis501.jpg'],
    specifications: {
      size: '32x32',
      fit: 'Straight',
      wash: 'Medium Blue',
      material: '100% Cotton',
    },
    isActive: true,
  },
];

async function seedProducts(): Promise<void> {
  try {
    logger.info('Starting product seeding...');
    const db = Database.getInstance();
    await db.connect();
    await Product.deleteMany({});
    const products = await Product.insertMany(productData);
    logger.info(`Seeded ${products.length} products successfully`);
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();