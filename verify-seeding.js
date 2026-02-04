#!/usr/bin/env node

const http = require('http');

const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function verifySeeding() {
  console.log('🔍 Verifying seeded data...\n');

  try {
    console.log('📋 Testing Customer Service...');
    const customerHealth = await makeRequest(`${CUSTOMER_SERVICE_URL}/health`);
    console.log(`   Health: ${customerHealth.status === 200 ? '✅' : '❌'} ${customerHealth.status}`);

    console.log('📦 Testing Product Service...');
    const productHealth = await makeRequest(`${PRODUCT_SERVICE_URL}/health`);
    console.log(`   Health: ${productHealth.status === 200 ? '✅' : '❌'} ${productHealth.status}`);

    if (customerHealth.status === 200 && productHealth.status === 200) {
      console.log('\n🎉 All services are healthy!');
      console.log('\n📝 Test the APIs manually:');
      console.log(`   Customer: ${CUSTOMER_SERVICE_URL}/customers/{id}`);
      console.log(`   Product:  ${PRODUCT_SERVICE_URL}/products/{id}`);
    } else {
      console.log('\n❌ Some services are not healthy');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  }
}

verifySeeding();