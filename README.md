# ES-Hub · Instrument & RFID Tracking System

[![Fastify](https://img.shields.io/badge/Fastify-5.2+-black?style=flat&logo=fastify)](https://fastify.dev/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5+-4FC08D?style=flat&logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2+-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4+-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/OpenAPI-Swagger%20UI-85EA2D?style=flat&logo=swagger)](http://localhost:3000/docs)

**ES-Hub** is a laboratory instrument inventory and automated tracking platform. It integrates dual-frequency RFID hardware (LF for user identification badges and HF for instrument tags), barcode identification, automated borrow/return workflows, maintenance logging, image asset management, and a reactive Vue.js 3 single-page dashboard.

---

## 📑 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Hardware Integration & Workflow](#-hardware-integration--workflow)
- [API Overview](#-api-overview)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Database Setup](#installation--database-setup)
  - [Running the Application](#running-the-application)
- [Frontend Dashboard](#-frontend-dashboard)
- [License](#-license)

---

## 🚀 Features

- **Dual-Frequency RFID Tracking**:
  - **LF (Low Frequency - 125 kHz)**: User / operator badge identification.
  - **HF (High Frequency - 13.56 MHz / NFC)**: Instrument-attached identification tags.
- **Automated Borrow & Return**:
  - Instant hardware check-in / check-out with automatic instrument status transitions (`available` ↔ `borrowed`).
  - Offline / synchronized timestamp logging with `/time` endpoint.
- **Instrument Grouping & Hierarchy**:
  - Group identical or related models (e.g. multiple units of the same oscilloscope).
  - Real-time aggregation of group availability counts (e.g. *3 total, 2 available, 1 borrowed*).
  - Collapsible accordion interface on the frontend.
- **Lifecycle & Status Management**:
  - Full status lifecycle: `available`, `borrowed`, `maintenance`, `lost`, `retired`.
  - Dedicated **Retired** instruments tab excluding decommissioned equipment from active counts.
- **Barcode Support**:
  - Direct barcode indexing for physical scanning and manual entry.
- **Maintenance Tracking**:
  - Dispatch instruments to maintenance with technician notes and reason tracking.
  - Track maintenance history, turnaround duration, and resolution status.
- **Image & Asset Management**:
  - Image uploads for both individual units and instrument groups (supporting JPEG, PNG, WEBP, GIF, SVG).
  - Automated disk cleanup: orphaned image files are safely deleted when instruments or groups are deleted or updated.
- **Interactive Documentation**:
  - OpenAPI specification and interactive Swagger UI accessible directly at `/docs`.
- **Modern Vue 3 SPA Dashboard**:
  - Built with **Vue 3** (Composition API, `<script setup>`) and **Vite**.
  - Served directly at `/ui/` by Fastify or via Vite HMR dev server at `http://localhost:5173/ui/`.
  - Dark / Light mode toggle, live backend connection health monitor, quick search, and filter tabs.

---

## 🏗 System Architecture

```mermaid
graph TD
    subgraph Hardware ["Hardware / RFID Readers"]
        LF[LF Reader<br/>125 kHz Badges] -->|User Tap| ESP[Controller / Scanner]
        HF[HF Reader<br/>13.56 MHz Tags] -->|Instrument Tap| ESP
        BC[Barcode Scanner] -.->|Optional Scan| ESP
    end

    subgraph Backend ["Fastify Backend (:3000)"]
        ESP -->|POST /borrow<br/>POST /return| API[Fastify 5 REST API]
        ESP -->|GET /time<br/>GET /*/load| API
        API --> V[Zod Validation]
        API --> S[Services Layer]
        S --> P[Prisma ORM 6]
        S --> IMG[Image Storage<br/>backend/uploads/]
    end

    subgraph Storage ["Database"]
        P --> DB[(PostgreSQL)]
    end

    subgraph Frontend ["Web Dashboard (/ui/)"]
        BROWSER[Web Browser] <-->|SPA REST API| API
    end
```

---

## 📁 Project Structure

```text
instrument/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Prisma data models & enums
│   ├── prisma.config.ts         # Prisma 6 configuration (engine & datasource)
│   ├── scripts/
│   │   └── generate-openapi.ts  # Script to export OpenAPI specification
│   ├── src/
│   │   ├── app.ts               # Fastify server bootstrap & plugin registrations
│   │   ├── lib/
│   │   │   └── prisma.ts        # Prisma client singleton instance
│   │   ├── routes/              # Route controllers with Zod schema validation
│   │   │   ├── health.ts        # Health check endpoints
│   │   │   ├── image.ts         # Image upload, download, and delete
│   │   │   ├── instrument.ts    # Single instrument CRUD & restore
│   │   │   ├── instrument-group.ts # Group CRUD & aggregation
│   │   │   ├── maintenance.ts   # Maintenance dispatch & return
│   │   │   ├── rfid.ts          # RFID sync, registration, and server time
│   │   │   ├── transaction.ts   # Borrow, return, and transaction history
│   │   │   └── user.ts          # User management
│   │   ├── schemas/             # Zod input/output schemas
│   │   └── services/            # Core business logic
│   │       ├── image.service.ts
│   │       ├── instrument.service.ts
│   │       ├── instrument-group.service.ts
│   │       ├── maintenance.service.ts
│   │       ├── rfid.service.ts
│   │       └── user.service.ts
│   ├── uploads/                 # Local image asset storage directory
│   ├── package.json
│   ├── tsconfig.json
│   └── openapi.json             # Generated OpenAPI v3 specification
├── frontend/
│   ├── src/
│   │   ├── App.vue              # Main Vue application shell
│   │   ├── main.js              # Vue entry point
│   │   ├── assets/
│   │   │   └── style.css        # Design tokens & styles
│   │   ├── composables/
│   │   │   ├── useApi.js        # API connection & helper utilities
│   │   │   └── useToast.js      # Reactive toast notification system
│   │   ├── components/
│   │   │   ├── common/          # Modal, ImageUpload, RfidSelect, ToastContainer
│   │   │   ├── instruments/     # GroupCard, GroupGridCard, Modals, Tabs
│   │   │   └── users/           # UserModal
│   │   └── views/
│   │       ├── DashboardView.vue   # Metrics & shortcuts view
│   │       ├── InstrumentsView.vue # Groups accordion, units & sub-tabs
│   │       └── UsersView.vue       # Users directory & RFID management
│   ├── dist/                    # Compiled production build (served by backend)
│   ├── package.json             # Frontend dependencies (Vue 3, Vite)
│   ├── vite.config.js           # Vite config with /ui/ base & backend proxy
│   └── index.html               # Vite HTML entry point
├── .gitignore
└── README.md
```

---

## 📡 Hardware Integration & Workflow

Hardware terminals (e.g. ESP32 / Arduino / Raspberry Pi) interact with the backend via simple JSON HTTP requests:

### 1. Clock Synchronization
Hardware terminals query server time to timestamp transactions accurately, even across offline buffering:
```http
GET /time
```
**Response:**
```json
{
  "iso": "2026-09-08T09:20:00.000Z",
  "unixTime": 1788859200
}
```

### 2. Borrowing an Instrument
When a user scans their user card (LF) followed by an instrument tag (HF):
```http
POST /borrow
Content-Type: application/json

{
  "lfuid": "EA486100",
  "hfuid": "39495001BE2E58",
  "unixTime": 1788859205
}
```
**Behavior:**
- Validates user LF badge exists and is active.
- Validates instrument HF tag exists and is currently `available`.
- Creates a transaction record (`type: "borrow"`).
- Automatically updates instrument status to `borrowed`.

### 3. Returning an Instrument
When an instrument is returned:
```http
POST /return
Content-Type: application/json

{
  "lfuid": "EA486100",
  "hfuid": "39495001BE2E58",
  "unixTime": 1788859260
}
```
**Behavior:**
- Records a transaction record (`type: "return"`).
- Automatically resets instrument status back to `available`.

### 4. RFID Hardware Sync & Registration
- `POST /LF` or `POST /HF`: Register or upsert raw RFID tags into the database.
- `POST /LF/check` or `POST /HF/check`: Query tag validity.
- `GET /LF/load?timestamp=<unix>` or `GET /HF/load?timestamp=<unix>`: Synchronize newly added or updated RFID tags to the hardware reader's local cache.

---

## 📋 API Overview

Explore and test all endpoints interactively through **Swagger UI** at `http://localhost:3000/docs`.

| Method | Endpoint | Description |
|---|---|---|
| **System** | | |
| `GET` | `/health` | Healthcheck for server & PostgreSQL connection |
| `GET` | `/time` | Current server ISO timestamp and Unix epoch |
| `GET` | `/docs` | Interactive Swagger API documentation |
| `GET` | `/ui/` | Web frontend dashboard |
| **Instruments** | | |
| `GET` | `/instruments` | List instruments with pagination, search, status filters |
| `POST` | `/instruments` | Create new instrument (name, RFID, barcode, image) |
| `GET` | `/instruments/:id` | Get instrument details |
| `PATCH`| `/instruments/:id` | Update instrument information |
| `DELETE`| `/instruments/:id` | Soft delete instrument (cleans up unused images) |
| `POST` | `/instruments/:id/restore`| Restore soft-deleted instrument |
| **Instrument Groups** | | |
| `GET` | `/instrument-groups` | List groups with aggregated unit availability stats |
| `POST` | `/instrument-groups` | Create instrument group |
| `GET` | `/instrument-groups/:id` | Get group details with nested units |
| `PATCH`| `/instrument-groups/:id` | Update group attributes |
| `DELETE`| `/instrument-groups/:id` | Soft delete group (cleans up images) |
| `POST` | `/instrument-groups/:id/restore` | Restore soft-deleted group |
| **Transactions** | | |
| `GET` | `/transactions` | Query borrow/return logs with user & instrument data |
| `POST` | `/borrow` | Borrow instrument via RFID scan (`lfuid`, `hfuid`, `unixTime`) |
| `POST` | `/return` | Return instrument via RFID scan (`lfuid`, `hfuid`, `unixTime`) |
| **Maintenance** | | |
| `GET` | `/maintenance` | List maintenance log history |
| `POST` | `/maintenance/send` | Send instrument to maintenance |
| `POST` | `/maintenance/return`| Return instrument from maintenance |
| **Users** | | |
| `GET` | `/users` | List users with pagination and search |
| `POST` | `/users` | Register a new user |
| `GET` | `/users/:id` | Get user details |
| `PATCH`| `/users/:id` | Update user details or assign RFID |
| `DELETE`| `/users/:id` | Soft delete user |
| `POST` | `/users/:id/restore` | Restore soft-deleted user |
| **Image Storage** | | |
| `POST` | `/images/upload` | Upload image file (multipart/form-data or Base64) |
| `GET` | `/images/:filename` | View/serve uploaded image |
| `GET` | `/images/:filename/download` | Download image as an attachment |
| `DELETE`| `/images/:filename`| Delete image file |

---

## 🗄 Database Schema

The system uses **PostgreSQL** managed by **Prisma ORM**. Key models include:

- **`Rfid`**: Registered RFID tags (`id` as tag string, `type` enum: `LF` or `HF`).
- **`User`**: Laboratory members (`id` as UUID, `name`, `rfid` foreign key to `Rfid`).
- **`InstrumentGroup`**: Category or model group (`id` as UUID, `name`, `brand`, `model`, `description`, `image_url`).
- **`Instrument`**: Individual instrument unit (`id` as UUID, `group_id`, `name`, `status`, `rfid`, `barcode`, `image_url`).
- **`Transaction`**: Borrow / Return audit trail (`user_id`, `instrument_id`, `type`, `timestamp`).
- **`Maintenance`**: Service records (`instrument_id`, `status`, `sent_at`, `returned_at`, `reason`, `maintainer`, `notes`).

All tables support soft deletes (`deletedAt`) and timezone-aware timestamps (`TIMESTAMPTZ`).

---

## 🛠 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later
- **PostgreSQL**: `14` or later (or running via Docker)

### Environment Configuration

Navigate to the `backend/` directory and configure `.env`:

```bash
cd backend
cp .env.example .env
```

Update your database credentials in `backend/.env`:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/coop

# Server port (default: 3000)
PORT=3000
```

### Installation & Database Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

3. **Synchronize database schema:**
   ```bash
   npx prisma db push
   ```
   *(or run `npm run prisma:migrate` for versioned migrations)*

### Running the Application

Frontend and Backend run as separate services. You can start them individually in separate terminals or use the root convenience scripts:

#### Option A: Using Root Workspace Commands
```bash
# Terminal 1: Backend API (port 3000)
npm run backend:dev

# Terminal 2: Vue 3 Frontend (port 5173)
npm run frontend:dev
```

#### Option B: Navigating into Each Directory
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- **Backend API & Swagger Docs:** `http://localhost:3000` (`/docs`)
- **Frontend Dashboard:** `http://localhost:5173/`

#### Building for Production:
```bash
# Build Frontend
npm run frontend:build
# Or inside frontend/: npm run build

# Build Backend
npm run backend:build
# Or inside backend/: npm run build
```

---

## 🖥 Frontend Dashboard

The Vue 3 web dashboard runs on its dedicated Vite dev server at:
```
http://localhost:5173/
```

### Key UI Features:
- **Vue 3 Reactive Architecture**: Built using Vue 3 Composition API (`<script setup>`) with reactive state and instant component updates.
- **Dashboard Overview**: Active borrow metrics, instrument status counts, and latest activity feed.
- **Instrument Management**:
  - Accordion view of instrument groups showing model, brand, image, and availability count.
  - Expand groups to view individual units, assign RFID/barcodes, and view unit status.
  - **Retired Tab**: Separate view to audit decommissioned instruments without cluttering active inventory.
  - Image upload directly from the browser with automatic thumbnail previews and download options.
- **User Directory**: View registered staff/students, assign LF RFID cards, and track borrowing history.
- **Transaction Logs**: Searchable and filterable history of check-outs and check-ins with pagination.
- **Maintenance Records**: Dispatch instruments for maintenance, record notes, and quick "Bring Back" return workflow.
- **Theme Switcher**: One-click toggle between Dark and Light color themes.

---

## 📄 License

This project is licensed under the [ISC License](backend/package.json).
