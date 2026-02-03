// MongoDB initialization script
// This script creates databases for each microservice

db = db.getSiblingDB('customer_db');
db.createCollection('customers');
print('Created customer_db database');

db = db.getSiblingDB('product_db');
db.createCollection('products');
print('Created product_db database');

db = db.getSiblingDB('order_db');
db.createCollection('orders');
print('Created order_db database');

db = db.getSiblingDB('payment_db');
db.createCollection('payments');
print('Created payment_db database');

db = db.getSiblingDB('transaction_db');
db.createCollection('transactions');
print('Created transaction_db database');

print('MongoDB initialization completed successfully');
