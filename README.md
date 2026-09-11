# ES-Hub · Instrument & RFID Tracking System

[![Fastify](https://img.shields.io/badge/Fastify-5.2+-black?style=flat&logo=fastify)](https://fastify.dev/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5+-4FC08D?style=flat&logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2+-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4+-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/OpenAPI-Swagger%20UI-85EA2D?style=flat&logo=swagger)](http://localhost:3000/docs)

**ES-Hub** is a laboratory instrument inventory and automated tracking platform. It integrates dual-frequency RFID hardware (LF badges for user identification and HF tags for equipment), barcode support, automated borrow/return workflows, maintenance lifecycle tracking, image asset management, and a modern reactive **Vue 3 single-page dashboard**.

The frontend and backend run as **two decoupled, independent services**:
- **Backend API Server**: Fastify 5 REST API running on `http://localhost:3000`
- **Frontend Web Dashboard**: Vue 3 + Vite running on `http://localhost:5173/`

---

## 📑 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Hardware Integration & Workflow](#-hardware-integration--workflow)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [Running the Services](#running-the-services)
  - [Building for Production](#building-for-production)
- [Frontend Dashboard Overview](#-frontend-dashboard-overview)
- [License](#-license)

---

## 🚀 Features

- **Dual-Frequency RFID Tracking**:
  - **LF (125 kHz)**: User / technician identification badges.
  - **HF (13.56 MHz / NFC)**: Instrument-attached identification tags.
- **Automated Borrow & Return Workflow**:
  - Instant hardware-triggered check-in / check-out (`POST /borrow`, `POST /return`).
  - Automatic status updates (`available` ↔ `borrowed`) and transaction auditing.
  - Server time synchronization via `/time` for reliable timestamping.
- **Instrument Grouping & Hierarchy**:
  - Hierarchical grouping of identical or related equipment (e.g. multiple units of the same oscilloscope).
  - Real-time aggregated group availability counts (*e.g., 3 total, 2 available, 1 borrowed*).
  - Collapsible accordion interface and grid card view with progress bars.
- **Lifecycle & Status Management**:
  - Full status lifecycle: `available`, `borrowed`, `maintenance`, `lost`, and `retired`.
  - Dedicated **Retired** instruments tab keeping active inventory counts clean while allowing one-click reactivation.
- **Barcode Support**:
  - Direct barcode indexing for physical optical scanning and rapid search.
- **Maintenance Lifecycle**:
  - Dispatch instruments to maintenance with technician notes and issue reasons.
  - Track maintenance history, service provider, turnaround duration, and resolution notes.
  - Quick "Bring Back" workflow to restore repaired equipment to `available`.
- **Image & Media Management**:
  - Photo upload for both instrument groups and individual units (JPEG, PNG, WEBP, GIF, SVG).
  - Built-in thumbnail preview, full-screen lightbox viewer, and direct download buttons.
  - Automatic cleanup: orphaned image files are safely removed from disk when records are deleted or updated.
- **Modern Vue 3 SPA**:
  - Built with **Vue 3 Composition API** (`<script setup>`) and **Vite**.
  - Dark / Light mode toggle, live backend connection health monitor, and reactive toast notifications.
- **Interactive Documentation**:
  - OpenAPI specification and interactive Swagger UI at `http://localhost:3000/docs`.

---

## 🏗 System Architecture

```mermaid
graph TD
    subgraph Hardware ["Hardware / RFID Readers"]
        LF[LF Reader<br/>125 kHz Badges] -->|User Tap| ESP[Controller / ESP32]
        HF[HF Reader<br/>13.56 MHz Tags] -->|Instrument Tap| ESP
        BC[Barcode Scanner] -.->|Optional Scan| ESP
    end

    subgraph Backend ["Fastify 5 REST API (:3000)"]
        ESP -->|POST /borrow<br/>POST /return| API[REST API & Validation]
        ESP -->|GET /time<br/>GET /*/load| API
        API --> V[Zod Validation]
        API --> S[Service Layer]
        S --> P[Prisma ORM 6]
        S --> IMG[Image Storage<br/>backend/uploads/]
    end

    subgraph Storage ["PostgreSQL Database"]
        P --> DB[(PostgreSQL 14+)]
    end

    subgraph Frontend ["Vue 3 + Vite SPA (:5173)"]
        UI[Vue 3 Components] <-->|CORS / Proxy| API
    end
```

---

## 📁 Project Structure

```text
instrument/
├── package.json                 # Workspace root scripts (run both services)
├── .gitignore                   # Ignores node_modules, .env, uploads, dist
├── README.md                    # Project documentation
│
├── backend/                     # Node.js Fastify API Server
│   ├── prisma/
│   │   └── schema.prisma        # Prisma schema & PostgreSQL models
│   ├── prisma.config.ts         # Prisma 6 engine & datasource config
│   ├── scripts/
│   │   └── generate-openapi.ts  # OpenAPI specification generator
│   ├── src/
│   │   ├── app.ts               # Fastify server bootstrap & route registration
│   │   ├── lib/
│   │   │   └── prisma.ts        # Prisma client singleton
│   │   ├── routes/              # Fastify route controllers with Zod schemas
│   │   │   ├── health.ts        # GET /health
│   │   │   ├── image.ts         # /images/upload, /images/:filename
│   │   │   ├── instrument.ts    # /instruments (CRUD & restore)
│   │   │   ├── instrument-group.ts # /instrument-groups (CRUD & stats)
│   │   │   ├── maintenance.ts   # /maintenance (send, return, list)
│   │   │   ├── rfid.ts          # /LF, /HF, /time, sync
│   │   │   ├── transaction.ts   # /borrow, /return, /transactions
│   │   │   └── user.ts          # /users (CRUD & restore)
│   │   ├── schemas/             # Zod validation schemas
│   │   └── services/            # Core business logic layer
│   │       ├── image.service.ts
│   │       ├── instrument.service.ts
│   │       ├── instrument-group.service.ts
│   │       ├── maintenance.service.ts
│   │       ├── rfid.service.ts
│   │       └── user.service.ts
│   ├── uploads/                 # Storage for uploaded instrument photos
│   ├── package.json             # Backend dependencies (Fastify, Prisma, Zod)
│   ├── tsconfig.json
│   └── openapi.json             # Generated OpenAPI v3 specification
│
└── frontend/                    # Vue 3 + Vite Single Page Application
    ├── src/
    │   ├── App.vue              # Main app shell (Sidebar, Header, Views)
    │   ├── main.js              # Vue 3 entry point
    │   ├── assets/
    │   │   └── style.css        # Unified design tokens & dark/light theme CSS
    │   ├── composables/
    │   │   ├── useApi.js        # API client, health monitoring, URL resolution
    │   │   └── useToast.js      # Global reactive toast notifications
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Modal.vue            # Reusable modal container
    │   │   │   ├── ToastContainer.vue   # Floating notification alerts
    │   │   │   ├── ImageUpload.vue      # File upload, preview & download
    │   │   │   ├── RfidSelect.vue       # Unassigned tag selector + custom input
    │   │   │   ├── ApiConfigModal.vue   # API URL configuration modal
    │   │   │   └── ImagePreviewModal.vue # Fullscreen lightbox viewer
    │   │   ├── instruments/
    │   │   │   ├── GroupCard.vue        # Accordion card with unit sub-table
    │   │   │   ├── GroupGridCard.vue    # Grid view card with progress bars
    │   │   │   ├── GroupModal.vue       # Create / edit group modal
    │   │   │   ├── UnitModal.vue        # Create / edit unit modal
    │   │   │   ├── SendMaintenanceModal.vue # Dispatch to maintenance modal
    │   │   │   ├── ReturnMaintenanceModal.vue # Return from maintenance modal
    │   │   │   ├── TransactionsTab.vue  # Borrow/return audit logs & pagination
    │   │   │   ├── MaintenanceTab.vue   # Maintenance logs & quick return
    │   │   │   └── RetiredTab.vue       # Retired equipment & reactivate
    │   │   └── users/
    │   │       └── UserModal.vue        # Create / edit user modal
    │   └── views/
    │       ├── DashboardView.vue   # Summary metrics, shortcuts, navigation
    │       ├── InstrumentsView.vue # Sub-tabs container (All, Tx, Maint, Retired)
    │       └── UsersView.vue       # User directory & RFID badge assignments
    ├── package.json             # Frontend dependencies (Vue 3, Vite)
    ├── vite.config.js           # Vite dev server (port 5173) & proxy
    └── index.html               # Vite HTML entry point
```

---

## 📡 Hardware Integration & Workflow

Hardware readers (e.g. ESP32 / Arduino / Raspberry Pi) communicate directly with the backend via JSON HTTP endpoints:

### 1. Clock Synchronization
Hardware terminals query server time to timestamp transactions accurately:
```http
GET /time
```
**Response:**
```json
{
  "iso": "2026-09-09T10:00:00.000Z",
  "unixTime": 1788948000
}
```

### 2. Borrowing an Instrument
User taps their LF badge (125 kHz) followed by the instrument's HF tag (13.56 MHz):
```http
POST /borrow
Content-Type: application/json

{
  "lfuid": "EA486100",
  "hfuid": "39495001BE2E58",
  "unixTime": 1788948005
}
```
**Workflow:**
1. Validates user badge exists and is active.
2. Validates instrument tag exists and status is `available`.
3. Creates a transaction log (`type: "borrow"`).
4. Automatically transitions instrument status to `borrowed`.

### 3. Returning an Instrument
User returns the instrument by scanning badge and instrument tag:
```http
POST /return
Content-Type: application/json

{
  "lfuid": "EA486100",
  "hfuid": "39495001BE2E58",
  "unixTime": 1788948060
}
```
**Workflow:**
1. Creates a transaction log (`type: "return"`).
2. Automatically transitions instrument status back to `available`.

### 4. RFID Tag Management & Sync
- `POST /staff/check` / `GET /staff/check`: Validate staff membership by RFID tag (accepts any RFID tag, LF or HF).
- `POST /instrument/check` / `GET /instrument/check`: Validate physical instrument unit by RFID tag (accepts any RFID tag, LF or HF).
- `GET /staff/load?timestamp=<unix>`: Synchronize active staff RFID tags (LF or HF) updated since timestamp to local hardware cache.
- `GET /staff/load-deleted?timestamp=<unix>`: Synchronize deleted staff RFID tags to local hardware cache.
- `GET /instrument/load?timestamp=<unix>`: Synchronize active instrument RFID tags (HF or LF) updated since timestamp to local hardware cache.
- `GET /instrument/load-deleted?timestamp=<unix>`: Synchronize deleted instrument RFID tags to local hardware cache.
- `POST /LF` / `POST /HF`: Register or upsert raw RFID tags into the database.
- `POST /LF/check` / `POST /HF/check`: Legacy aliases for staff/instrument verification without LF/HF type restrictions.
- `GET /LF/load` / `GET /HF/load`: Legacy aliases for `/staff/load` and `/instrument/load`.
- `GET /LF/load-deleted` / `GET /HF/load-deleted`: Legacy aliases for `/staff/load-deleted` and `/instrument/load-deleted`.
- `GET /rfid/unassigned`: Query unassigned RFID tags (optional `type` filter: `LF` or `HF`).

---

## 📋 API Reference

Interactive API documentation and schema explorer is available at **`http://localhost:3000/docs`**.

| Method | Endpoint | Description |
|---|---|---|
| **System** | | |
| `GET` | `/health` | Healthcheck for server & PostgreSQL connection |
| `GET` | `/time` | Current server ISO timestamp and Unix epoch |
| `GET` | `/docs` | Interactive Swagger API documentation |
| **RFID & Hardware Check / Sync** | | |
| `POST` / `GET` | `/staff/check` | Check staff existence and details by RFID tag (LF or HF) |
| `POST` / `GET` | `/instrument/check` | Check instrument existence and details by RFID tag (LF or HF) |
| `GET` | `/staff/load` | Incremental staff RFID cache load since Unix timestamp (LF or HF) |
| `GET` | `/staff/load-deleted` | Incremental deleted staff RFID sync since Unix timestamp |
| `GET` | `/instrument/load` | Incremental instrument RFID cache load since Unix timestamp (HF or LF) |
| `GET` | `/instrument/load-deleted` | Incremental deleted instrument RFID sync since Unix timestamp |
| `POST` | `/LF/check`, `/HF/check` | Legacy aliases for check endpoints (no LF/HF restriction) |
| `GET` | `/LF/load`, `/HF/load` | Legacy aliases for load endpoints (no LF/HF restriction) |
| `GET` | `/LF/load-deleted`, `/HF/load-deleted` | Legacy aliases for deleted load endpoints |
| `POST` | `/LF`, `/HF` | Register or update raw LF / HF RFID tag |
| `GET` | `/rfid/unassigned` | List RFID tags not assigned to active staff or instrument |
| **Instruments** | | |
| `GET` | `/instruments` | List instruments with pagination, search, and status filters |
| `POST` | `/instruments` | Create physical instrument unit (group, name, RFID, barcode, next_maintain_date, image) |
| `GET` | `/instruments/:id` | Get instrument details |
| `PATCH`| `/instruments/:id` | Update instrument information |
| `DELETE`| `/instruments/:id` | Soft delete or permanent delete (cleans up orphaned images) |
| `POST` | `/instruments/:id/restore`| Restore soft-deleted instrument |
| **Instrument Groups** | | |
| `GET` | `/instrument-groups` | List groups with aggregated unit availability stats |
| `POST` | `/instrument-groups` | Create instrument group |
| `GET` | `/instrument-groups/:id` | Get group details with nested units |
| `PATCH`| `/instrument-groups/:id` | Update group attributes |
| `DELETE`| `/instrument-groups/:id` | Soft delete group (cleans up images) |
| `POST` | `/instrument-groups/:id/restore` | Restore soft-deleted group |
| **Transactions** | | |
| `GET` | `/transactions` | Query borrow/return audit logs with user & instrument data |
| `POST` | `/borrow` | Record borrow transaction (`lfuid`, `hfuid`, `unixTime`) |
| `POST` | `/return` | Record return transaction (`lfuid`, `hfuid`, `unixTime`) |
| **Maintenance** | | |
| `GET` | `/maintenance` | List maintenance records with status filter and search |
| `POST` | `/maintenance/send` | Send instrument to maintenance |
| `POST` | `/maintenance/:id/return`| Return instrument from maintenance (sets status to `available`, updates next_maintain_date) |
| **Users** | | |
| `GET` | `/users` | List users with pagination and search |
| `POST` | `/users` | Register a new user |
| `GET` | `/users/:id` | Get user details |
| `PATCH`| `/users/:id` | Update user details or assign RFID |
| `DELETE`| `/users/:id` | Soft delete user |
| `POST` | `/users/:id/restore` | Restore soft-deleted user |
| **Images** | | |
| `POST` | `/images/upload` | Upload image file (multipart/form-data or Base64) |
| `GET` | `/images/:filename` | Serve uploaded image |
| `GET` | `/images/:filename/download` | Download image file as attachment |
| `DELETE`| `/images/:filename`| Delete image file |

---

## 🗄 Database Schema

Managed with **Prisma ORM** targeting **PostgreSQL**:

- **`Rfid`**: Raw RFID tags (`id` as tag string, `type` enum: `LF` or `HF`).
- **`User`**: Registered lab members (`id` as UUID, `name`, `rfid` foreign key to `Rfid`).
- **`InstrumentGroup`**: Category or model group (`id` as UUID, `name`, `brand`, `model`, `description`, `image_url`).
- **`Instrument`**: Physical unit (`id` as UUID, `group_id`, `name`, `status`, `rfid`, `barcode`, `image_url`).
- **`Transaction`**: Borrow / Return audit log (`user_id`, `instrument_id`, `type`, `timestamp`).
- **`Maintenance`**: Service records (`instrument_id`, `status`, `sent_at`, `returned_at`, `reason`, `maintainer`, `notes`).

All tables implement soft-delete support (`deletedAt`) and timezone-aware timestamps (`TIMESTAMPTZ`).

---

## 🛠 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later
- **PostgreSQL**: `14` or later (or running via Docker)

---

### 1. Backend Setup

1. **Navigate to the backend directory and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `backend/.env` with your PostgreSQL database credentials:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/coop
   PORT=3000
   ```

3. **Generate Prisma Client & Sync Database:**
   ```bash
   npm run prisma:generate
   npx prisma db push
   ```

---

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
```

---

### Running the Services

Because the frontend and backend run separately, open **two terminal tabs**:

#### Terminal 1: Backend API (port 3000)
```bash
# From root workspace:
npm run backend:dev

# Or from backend/:
cd backend && npm run dev
```
> Server running at: **`http://localhost:3000`**  
> Swagger Documentation: **`http://localhost:3000/docs`**

#### Terminal 2: Vue 3 Frontend (port 5173)
```bash
# From root workspace:
npm run frontend:dev

# Or from frontend/:
cd frontend && npm run dev
```
> Web Dashboard running at: **`http://localhost:5173/`**

---

### Building for Production

To build both services for production:

```bash
# Build frontend
npm run frontend:build
# (or: cd frontend && npm run build)

# Build backend
npm run backend:build
# (or: cd backend && npm run build)
```

To start the compiled production backend:
```bash
npm run backend:start
# (or: cd backend && npm start)
```

To preview the production frontend:
```bash
npm run frontend:preview
# (or: cd frontend && npm run preview)
```

---

## 🖥 Frontend Dashboard Overview

Access the web interface at **`http://localhost:5173/`**.

### Key Modules:
- **Dashboard**: High-level counters for total instruments, units available right now, units under maintenance, and registered users. Quick navigation cards and shortcut buttons.
- **Instruments Management**:
  - **All Instruments Tab**: Accordion view grouped by model/brand with real-time availability ratios. Expand to view individual units with barcodes, RFID tags, and status badges. Switchable to Grid View with visual color-coded progress bars.
  - **Transaction History Tab**: Searchable and filterable borrow/return logs with user details, instrument badges, and timestamps.
  - **Maintenance Records Tab**: Complete log of repairs, calibration, technician notes, and a one-click "Bring Back" return button.
  - **Retired Tab**: Dedicated view for decommissioned equipment. Excluded from active counts, with one-click "Reactivate to Available".
- **User Management**: Add and manage lab operators, assign LF RFID cards, and view borrowing status.
- **Image Management**: In-browser image upload, thumbnail rendering, full-screen lightbox preview, and direct image downloads.
- **Theme Switcher**: Instant toggle between Dark and Light color themes.
- **API Configuration**: Easily change the target backend API host on the fly from the UI settings modal.

---

## 📄 License

This project is licensed under the [ISC License](backend/package.json).
