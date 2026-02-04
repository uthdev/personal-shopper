# E-commerce Microservices

A microservices-based e-commerce platform built with Node.js, TypeScript, Express.js, MongoDB, and RabbitMQ.

## Architecture

This project consists of 5 microservices:

- **Customer Service** (Port 3001) - Manages customer data
- **Product Service** (Port 3002) - Manages product catalog
- **Order Service** (Port 3003) - Handles order creation and management
- **Payment Service** (Port 3004) - Processes payments and publishes to message queue
- **Worker Service** - Consumes messages and saves transaction history

## Project Structure

```
personal-shopper/
├── customer-service/
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── product-service/
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── order-service/
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── payment-service/
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── worker-service/
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Docker and Docker Compose (for containerized deployment)
- MongoDB (if running locally)
- RabbitMQ (if running locally)

### Installation

#### Option 1: Docker (Production)

1. Install Docker and Docker Compose

2. Build and start all services:

```bash
# Build all Docker images
pnpm docker:build

# Start all services (MongoDB, RabbitMQ, and microservices)
pnpm docker:up

# View logs
pnpm docker:logs

# Stop all services
pnpm docker:down

# Clean up (remove volumes and orphaned containers)
pnpm docker:clean
```

3. Access services:

- Customer Service: http://localhost:3001/health
- Product Service: http://localhost:3002/health
- Order Service: http://localhost:3003/health
- Payment Service: http://localhost:3004/health
- RabbitMQ Management: http://localhost:15672 (admin/password123)
- MongoDB: localhost:27017 (admin/password123)

#### Option 2: Hybrid Development (Recommended for Development)

1. Start infrastructure services with Docker:

```bash
# Start only MongoDB and RabbitMQ
pnpm docker:dev:up
```

2. Install dependencies and run services locally:

```bash
# Install dependencies
pnpm install

# Start all services in development mode with hot reload
pnpm dev:all
```

3. Stop infrastructure when done:

```bash
pnpm docker:dev:down
```

#### Option 3: Full Local Development

1. Install pnpm globally (if not already installed):

```bash
npm install -g pnpm
```

2. Install all dependencies:

```bash
pnpm install
```

3. Start services in development mode:

```bash
# All services at once (recommended)
pnpm dev:all

# Or individual services
pnpm dev:customer
pnpm dev:product
pnpm dev:order
pnpm dev:payment
pnpm dev:worker

# Or in separate terminals
cd customer-service && pnpm dev
cd product-service && pnpm dev
cd order-service && pnpm dev
cd payment-service && pnpm dev
cd worker-service && pnpm dev
```

4. Build all services:

```bash
pnpm build:all
```

5. Start all services in production mode:

```bash
pnpm start:all
```

## Data Seeding

The project includes seeding scripts to populate the database with demo data.

### Seeding Commands

```bash
# Seed all data (customers and products)
pnpm seed

# Seed only customers
pnpm seed:customers

# Seed only products
pnpm seed:products

# Verify seeded data
pnpm verify:seeding
```

### Docker Seeding

When using Docker, seeding runs automatically after services start. The seed service:
- Waits for customer and product services to be healthy
- Seeds demo customers and products
- Exits after completion

### Sample Data

**Customers:**
- John Doe (john.doe@example.com)
- Jane Smith (jane.smith@example.com) 
- Bob Johnson (bob.johnson@example.com)

**Products:**
- iPhone 15 Pro ($999.99)
- Samsung Galaxy S24 ($799.99)
- Nike Air Max 270 ($150.00)
- MacBook Pro 14" ($1999.99)
- Levi's 501 Jeans ($89.99)

## Development Status

- [x] Project structure initialized with TypeScript
- [x] pnpm workspace configuration
- [x] Environment configuration with Zod validation
- [x] Centralized error handling and logging
- [x] Docker configuration with multi-stage builds
- [x] Docker Compose orchestration with MongoDB and RabbitMQ
- [x] Customer and product data seeding scripts
- [x] Database schemas
- [ ] Service implementations
- [ ] Integration tests

## Contributing

This project follows a feature branch workflow. Create feature branches from `develop` for each GitHub issue.
