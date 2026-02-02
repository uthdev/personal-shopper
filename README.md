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
- MongoDB
- RabbitMQ
- Docker (optional)

### Installation

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

## Development Status

- [x] Project structure initialized with TypeScript
- [x] pnpm workspace configuration
- [ ] Docker configuration
- [ ] Database schemas
- [ ] Service implementations
- [ ] Integration tests

## Contributing

This project follows a feature branch workflow. Create feature branches from `develop` for each GitHub issue.
