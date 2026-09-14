# TCB POS & Staff Tab Management System

A high-performance, touch-first **Point-of-Sale (POS)** and **Staff Tab Management** Progressive Web Application (PWA). Engineered specifically for cafes, specialty coffee bars, and retail hospitality venues, this platform unifies front-counter checkout, itemized employee tab tracking, real-time audit logs, and catalog administration under an integer-precision financial engine.

---

## Architecture & Tech Stack

```
                     ┌──────────────────────────────────────────────┐
                     │            Next.js 16 Client (PWA)           │
                     │  - React 19 & Tailwind CSS v4               │
                     │  - Zustand (Cart Store) & React Hook Form    │
                     │  - Dexie.js IndexedDB (Offline Persistence)  │
                     └──────────────────────┬───────────────────────┘
                                            │ HTTP / REST / SSE Stream
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │           Node.js & Express 5 API            │
                     │  - Helmet & Express Rate Limiter             │
                     │  - JWT Auth & Bcrypt PIN Validation          │
                     │  - Integer-Cent Discount & Math Engine       │
                     │  - Server-Sent Events (SSE) Broadcaster      │
                     └──────────────────────┬───────────────────────┘
                                            │ Mongoose ODM
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │               MongoDB Database               │
                     │  - Compound Indices & Atomic Counters        │
                     │  - Point-in-time Snapshotting                │
                     │  - Automated Error Logging & TTL Retention   │
                     └──────────────────────────────────────────────┘
```

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with slate dark-mode palette & touch-optimized targets
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) for reactive cart transactions and order state
- **Offline & Storage:** [Dexie.js](https://dexie.org/) (IndexedDB wrapper) for catalog offline caching and background transaction queues
- **Icons & UI:** [Lucide React](https://lucide.dev/)

### Backend
- **Server:** [Express 5](https://expressjs.com/) on [Node.js](https://nodejs.org/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) schemas and compound indexing
- **Security:** [Helmet](https://helmetjs.github.io/), CORS origin policies, [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- **Auth:** [JSON Web Tokens (JWT)](https://jwt.io/) and [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for terminal PIN verification
- **Validation:** [Zod](https://zod.dev/) schema enforcement
- **Real-time:** Native Server-Sent Events (SSE) broadcasting stream

---

## Core System Features

### 1. High-Speed Touch POS Terminal (`/`)
- **Visual Catalog Navigation:** Filter items rapidly using color-coded category pills or instant substring search (matching SKU, name, or category snapshot).
- **Active Ticket Manager:** Real-time quantity adjustments, per-item percentage/amount discounts, global ticket promos, and custom order notes.
- **Flexible Checkout Modes:**
  - **CASH / CARD:** Instant paid order settlement.
  - **TAB DEFERRED:** Assigns order directly to an active staff member's running account.
  - **PAYROLL DEDUCTION:** Direct wage settlement option.
- **Point-in-Time Snapshots:** Freezes item name, SKU, category name, and price in cents at the moment of checkout, guaranteeing historical records remain immune to future catalog modifications.

### 2. Consolidated Staff Tab Management (`/tabs`)
- **Consolidated Tab View:** Displays total unpaid balances per staff member and itemized quantities consumed.
- **Nested Occurrence Audit Trail:** Drill down into any product to inspect exact timestamps, serving cashier names, and transaction reference numbers for every occurrence.
- **Whole-Transaction Settlement Modal:** Select specific open transactions or batch-settle all pending tickets with one click using Cash, Card, or Payroll Deduction.

### 3. Financial Integrity & Integer Precision
- **Zero Floating-Point Drift:** All currency calculations (unit prices, subtotals, line discounts, global discounts, and grand totals) are computed strictly in **integer cents** (e.g., \$4.50 is stored and calculated as `450`).
- **Sequential Transaction Numbering:** Generates human-readable, gapless sequential transaction identifiers (e.g., `TXN-2026-000001`) via atomic MongoDB `$inc` counters.

### 4. Transaction Ledger & Audit Log (`/ledger`)
- **Comprehensive Audit Table:** Review all historical transactions with cashier attribution, staff assignment, line items count, timestamps, and payment status.
- **Multi-Factor Filtering:** Filter by status (`ALL`, `PAID`, `UNPAID_TAB`), custom date intervals (`startDate`, `endDate`), and keyword search (TXN number, cashier name, or staff member).
- **Executive Summaries:** Real-time tally cards displaying total settled revenue, outstanding tab liabilities, and total discounts granted.
- **Server-Side Pagination:** Smooth traversal across high-volume transaction histories.

### 5. Sales & Consumption Analytics (`/reports`)
- **Key Performance Indicators:** Net settled revenue, open tab liabilities, total discounts, and gross transaction volume.
- **Staff Consumption Breakdown:** Highlights staff members with highest tab liabilities and historical spend.
- **Top-Moving Products:** Ranks products by units sold and net revenue generated.
- **Custom Timeframe Filtering:** Date-range selector to isolate shifts, days, or pay periods.

### 6. Administration & Catalog Management (`/admin`)
- **Product Management:** Full CRUD (Create, Read, Update, Delete) for SKUs, names, selling prices, cost prices, category assignments, and stock levels.
- **Category Management:** Create, reorder, and color-code product categories that dynamically theme the POS interface.
- **User & Staff Provisioning:** Register staff members, cashiers, and administrators with role-based permissions and encrypted terminal PIN codes.
- **Discount Presets:** Configure fixed or percentage discount buttons for one-touch cashier application.

### 7. Offline Resilience & Real-Time Sync
- **Client Cache:** IndexedDB mirrors products, categories, and staff lists for offline catalog browsing.
- **Offline Transaction Queueing:** If network connectivity drops, tickets are stored in an offline queue with client-generated UUIDs for synchronization upon reconnecting.
- **Server-Sent Events (SSE):** Endpoint `/api/updates-stream` broadcasts changes across terminals to keep balances and inventory synchronized.

### 8. Security & Terminal Protection
- **Terminal PIN Authentication:** Fast numpad-based login for floor staff and cashiers. PINs are salted and hashed with bcrypt.
- **Brute-Force Rate Limiting:** Limits PIN login attempts to 5 requests per minute per IP address on `/api/users/pin-login`.
- **Protected Endpoints:** Token-based middleware validates permissions and enforces administrator-only routes (`requireRole('admin')`).
- **Secure HTTP Headers:** Pre-configured Helmet policies for XSS, MIME sniffing, and clickjacking protection.

---

## Project Structure

```
tcb-product-record/
├── package.json              # Root script orchestrator (concurrent dev runners)
├── .gitignore                # Repository ignore rules
├── README.md                 # Project documentation
│
├── backend/                  # Express 5 API Server
│   ├── config/               # Database & service configurations (MongoDB, Firebase)
│   ├── controllers/          # Business logic (categories, products, tabs, txns, etc.)
│   ├── middleware/           # Auth validation, role guards, and centralized error handling
│   ├── models/               # Mongoose schemas (User, Product, Transaction, Counter, etc.)
│   ├── routes/               # Express endpoint definitions
│   ├── scripts/              # Database seeding scripts (seed.js)
│   ├── tests/                # Automated verification suites
│   ├── utils/                # Financial discount engine, sequence service, SSE broadcaster
│   ├── server.js             # API entrypoint and HTTP server
│   ├── package.json          # Backend dependencies
│   └── .env.example          # Environment variable template
│
└── frontend/                 # Next.js 16 PWA Client
    ├── public/               # Static assets & PWA manifest.json
    ├── src/
    │   ├── app/              # App router pages
    │   │   ├── page.js       # POS Terminal interface
    │   │   ├── tabs/         # Staff Tab Management & Settlement
    │   │   ├── ledger/       # Transaction Ledger & Audit Log
    │   │   ├── reports/      # Sales & Staff Consumption Analytics
    │   │   ├── admin/        # Catalog, Users & Discounts Admin Dashboard
    │   │   ├── layout.js     # Root layout & providers
    │   │   └── globals.css   # Tailwind CSS v4 styling
    │   ├── components/       # Header, POS layout components, PIN modal
    │   ├── context/          # Auth Context & session management
    │   ├── hooks/            # Axios API wrappers (useAxiosPublic, useAxiosSecure)
    │   ├── store/            # Zustand cart store (useCartStore)
    │   └── utils/            # Axios base configuration & Dexie.js offline DB
    └── package.json          # Frontend dependencies
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection URI

---

### Installation

1. **Clone the repository and install root dependencies:**
   ```bash
   git clone <repository-url>
   cd tcb-product-record
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   npm install --prefix backend
   ```

3. **Install frontend dependencies:**
   ```bash
   npm install --prefix frontend
   ```

---

### Environment Setup

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Configure your environment variables in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/tcb_pos_tab
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_secure_random_jwt_secret_key
```

---

### Database Seeding

Populate the database with initial categories (Hot Coffee, Cold Drinks, Bakery, Kitchen), catalog items, preset discounts, and foundational user roles:

```bash
npm run seed
```

> **Security Note:** Default accounts configured during seed setup should have their terminal credentials updated immediately via the Admin Dashboard (`/admin`) before production deployment.

---

### Running in Development

Start both the Express backend API (`http://localhost:5000`) and the Next.js frontend client (`http://localhost:3000`) concurrently using the root orchestrator:

```bash
npm run dev
```

Or run each service independently in separate terminals:

```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Frontend Client
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your web browser or tablet terminal.

---

## Automated Verification & Tests

The backend includes test scripts to verify business logic, security policies, and financial precision:

```bash
# Run core API, sequential numbering, and discount engine verification
npm run test:backend

# Run Helmet security headers, JWT auth, and PIN rate-limiting verification
npm run test:security
```

---

## API Reference Overview

| Module | Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/users/pin-login` | Public (Rate-Limited) | Terminal login via Employee Code & PIN |
| | `GET` | `/api/users/me` | Authenticated | Fetch current user session profile |
| | `GET` | `/api/staff` | Authenticated | List all active staff members for tab selection |
| | `POST` | `/api/admin/create` | Admin Only | Provision a new staff member, cashier, or admin |
| **Categories** | `GET` | `/api/categories` | Authenticated | Get all active product categories |
| | `POST` | `/api/categories/admin` | Admin Only | Create a new category |
| | `PUT` | `/api/categories/admin/:id` | Admin Only | Update an existing category |
| | `DELETE` | `/api/categories/admin/:id` | Admin Only | Remove a category |
| **Products** | `GET` | `/api/products` | Authenticated | Retrieve catalog items (supports text search & category filter) |
| | `POST` | `/api/products/admin` | Admin Only | Create a catalog item |
| | `PUT` | `/api/products/admin/:id` | Admin Only | Update price, cost, stock, or details |
| | `DELETE` | `/api/products/admin/:id` | Admin Only | Remove product from catalog |
| **Transactions**| `POST` | `/api/transactions` | Authenticated | Process a checkout ticket (paid or unpaid tab) |
| | `GET` | `/api/transactions/ledger` | Authenticated | Query paginated ledger with status and date filters |
| **Staff Tabs** | `GET` | `/api/tabs/consolidated` | Authenticated | Fetch consolidated balance overview across all staff |
| | `GET` | `/api/tabs/staff/:staffId/transactions` | Authenticated | Fetch discrete open transactions for a specific staff member |
| | `POST` | `/api/tabs/settle-transactions` | Authenticated | Settle selected transactions (whole-unit settlement) |
| **Discounts** | `GET` | `/api/discounts/presets` | Authenticated | Fetch active discount preset buttons for POS |
| | `POST` | `/api/discounts/admin` | Admin Only | Create custom discount rules |
| **Reports** | `GET` | `/api/reports/sales-summary` | Admin Only | High-level sales revenue & tab liability KPIs |
| | `GET` | `/api/reports/staff-consumption`| Admin Only | Staff tab consumption and outstanding balance ranking |
| | `GET` | `/api/reports/products` | Admin Only | Top-moving product sales report |
| **Real-Time** | `GET` | `/api/updates-stream` | Public / Terminal | Server-Sent Events (SSE) live updates connection |

---

## Production Deployment & Best Practices

1. **Production Build:**
   ```bash
   npm run build --prefix frontend
   npm run start --prefix frontend
   ```
2. **Reverse Proxy:** Run Express and Next.js behind Nginx, Caddy, or Cloudflare with SSL termination.
3. **Database Safeguards:** Set strong authentication for MongoDB with replica sets enabled for zero-downtime failovers.
4. **Environment Security:** Never commit `.env` files. Ensure secrets, JWT keys, and administrative credentials are provided through encrypted secret managers or secure environment variables.

---

## License

This project is licensed under the [ISC License](LICENSE).
