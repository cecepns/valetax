# Inventory Management Backend

Backend server for the inventory management system built with Express.js and MySQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory with the following variables:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=inventory_db
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

3. Make sure your MySQL database is running and the `inventory_db` database exists.

## Running the Server

### Development mode (with auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Incoming Goods
- `GET /api/incoming-goods` - Get all incoming goods
- `POST /api/incoming-goods` - Add incoming goods

### Outgoing Goods
- `GET /api/outgoing-goods` - Get all outgoing goods
- `POST /api/outgoing-goods` - Add outgoing goods

### Damaged Goods
- `GET /api/damaged-goods` - Get all damaged goods
- `POST /api/damaged-goods` - Add damaged goods
- `PUT /api/damaged-goods/:id` - Update damaged goods
- `DELETE /api/damaged-goods/:id` - Delete damaged goods

### Reports
- `GET /api/reports` - Get reports (stock, incoming, outgoing)

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

## Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **mysql2** - MySQL client for Node.js
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File upload handling
- **dotenv** - Environment variable management 