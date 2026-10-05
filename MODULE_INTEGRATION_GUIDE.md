# Module Integration & Merge Guide

This document outlines the step-by-step procedure for merging the **Equipment & RFID Tracking Subsystem** (`instrument`, `instrument_group`, `maintenance`, `rfid`, `transaction`, and `mqtt`) into a larger host application ("Big Project") that already maintains its own **User** and **Admin/Authentication** management.

---

## 📑 Table of Contents

1. [Architectural Overview & Scope Boundary](#1-architectural-overview--scope-boundary)
2. [Database Schema & Prisma Migration](#2-database-schema--prisma-migration)
3. [Backend Integration (Node.js / Fastify)](#3-backend-integration-nodejs--fastify)
   - [3.1 Dependencies](#31-dependencies)
   - [3.2 Environment Variables](#32-environment-variables)
   - [3.3 Backend Files to Copy](#33-backend-files-to-copy)
   - [3.4 Bridging the Host User Model](#34-bridging-the-host-user-model)
   - [3.5 Server Registration & Lifecycle Hooks](#35-server-registration--lifecycle-hooks)
4. [Frontend Integration (Vue 3)](#4-frontend-integration-vue-3)
   - [4.1 Components to Migrate](#41-components-to-migrate)
   - [4.2 Routing Configuration](#42-routing-configuration)
   - [4.3 Integrating MQTT RFID Scan into Host User Forms](#43-integrating-mqtt-rfid-scan-into-host-user-forms)
5. [Hardware Integration & MQTT Setup](#5-hardware-integration--mqtt-setup)
6. [Step-by-Step Verification Checklist](#6-step-by-step-verification-checklist)

---

## 1. Architectural Overview & Scope Boundary

When merging this repository into an existing enterprise/host application, modules are divided into:

| Module Status | Feature / Domain | Description & Action |
|---|---|---|
| **IMPORT** | `instrument` | Physical instrument unit CRUD, status lifecycle, barcodes, images, and standalone units |
| **IMPORT** | `instrument_group` | Categorical model grouping, real-time availability ratios, grid/list view |
| **IMPORT** | `maintenance` | Service dispatches, repair records, turnaround time, bring-back workflow |
| **IMPORT** | `rfid` | Dual-frequency LF/HF tag management, auto-saving unknown UIDs, hardware sync endpoints |
| **IMPORT** | `transaction` | Automated borrow and return audit logging, instant status transitions |
| **IMPORT** | `mqtt` | Request-reply RPC bridge, remote hardware scanner control, correlation ID tracking |
| **IMPORT** | `image` | Photo upload, storage, thumbnail preview, lightbox viewer, and disk cleanup |
| **SKIP** | `user` / `auth` | **Do not copy.** The host application's existing User & Auth system will be bridged via foreign keys |

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Big Project (Host App)                          │
│                                                                        │
│   ┌────────────────────────┐         ┌──────────────────────────────┐  │
│   │ Existing User & Admin  │ ◄─────┐ │ Existing Auth / RBAC / JWT   │  │
│   │ Management (User Table)│       │ └──────────────────────────────┘  │
│   └───────────┬────────────┘       │                                   │
└───────────────┼────────────────────┼───────────────────────────────────┘
                │ FK: user_id        │ Active Staff Query
                ▼                    │
┌────────────────────────────────────┴───────────────────────────────────┐
│                      Imported Instrument Subsystem                     │
│                                                                        │
│  ┌───────────────────────┐   ┌───────────────────┐   ┌──────────────┐  │
│  │ Instrument & Groups   │──►│ Transactions Log  │   │ Maintenance  │  │
│  └───────────┬───────────┘   └───────────────────┘   └──────────────┘  │
│              │                                                         │
│              ▼                                                         │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ Rfid Tag Registry     │◄──┤ MQTT Request-Reply Bridge            │  │
│  │ (Auto-Save Unknown)   │   │ (ESP32 Scanner Command / Responses)  │  │
│  └───────────────────────┘   └──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema & Prisma Migration

### 2.1 Enums to Add to Host `schema.prisma`

Copy the following enums into the host project's `prisma/schema.prisma`:

```prisma
enum RfidType {
  LF
  HF

  @@map("rfid_type")
}

enum InstrumentStatus {
  available
  borrowed
  maintenance
  lost
  retired

  @@map("instrument_status")
}

enum MaintenanceStatus {
  in_progress
  completed
  cancelled

  @@map("maintenance_status")
}

enum TransactionType {
  borrow
  return

  @@map("transaction_type")
}
```

### 2.2 Models to Add to Host `schema.prisma`

Copy these 5 models into the host project's `prisma/schema.prisma`:

```prisma
model Rfid {
  id        String    @id
  type      RfidType
  createdAt DateTime  @default(now()) @map("createdat") @db.Timestamptz
  updatedAt DateTime  @default(now()) @updatedAt @map("updatedat") @db.Timestamptz
  deletedAt DateTime? @map("deletedat") @db.Timestamptz

  users       User[]
  instruments Instrument[]

  @@map("rfid")
}

model InstrumentGroup {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  brand       String?
  model       String?
  description String?
  image_url   String?   @map("image_url")
  createdAt   DateTime  @default(now()) @map("createdat") @db.Timestamptz
  updatedAt   DateTime  @default(now()) @updatedAt @map("updatedat") @db.Timestamptz
  deletedAt   DateTime? @map("deletedat") @db.Timestamptz

  instruments Instrument[]

  @@map("instrument_group")
}

model Instrument {
  id                 String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  group_id           String?          @map("group_id") @db.Uuid
  name               String
  status             InstrumentStatus @default(available)
  rfid               String?
  image_url          String?          @map("image_url")
  barcode            String?          @map("barcode")
  next_maintain_date DateTime?        @map("next_maintain_date") @db.Timestamptz
  createdAt          DateTime         @default(now()) @map("createdat") @db.Timestamptz
  updatedAt          DateTime         @default(now()) @updatedAt @map("updatedat") @db.Timestamptz
  deletedAt          DateTime?        @map("deletedat") @db.Timestamptz

  group        InstrumentGroup? @relation(fields: [group_id], references: [id], onDelete: SetNull)
  rfidRef      Rfid?            @relation(fields: [rfid], references: [id], onDelete: SetNull)
  transactions Transaction[]
  maintenances Maintenance[]

  @@map("instrument")
}

model Transaction {
  id            String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id       String          @db.Uuid // Ensure type matches Host User.id
  instrument_id String          @db.Uuid
  type          TransactionType
  timestamp     DateTime        @default(now()) @db.Timestamptz
  createdAt     DateTime        @default(now()) @map("createdat") @db.Timestamptz
  updatedAt     DateTime        @default(now()) @updatedAt @map("updatedat") @db.Timestamptz
  deletedAt     DateTime?       @map("deletedat") @db.Timestamptz

  user       User       @relation(fields: [user_id], references: [id], onDelete: Restrict)
  instrument Instrument @relation(fields: [instrument_id], references: [id], onDelete: Restrict)

  @@map("transaction")
}

model Maintenance {
  id            String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  instrument_id String            @db.Uuid
  status        MaintenanceStatus @default(in_progress)
  sent_at       DateTime          @default(now()) @db.Timestamptz
  returned_at   DateTime?         @db.Timestamptz
  reason        String?
  maintainer    String?
  notes         String?
  createdAt     DateTime          @default(now()) @map("createdat") @db.Timestamptz
  updatedAt     DateTime          @default(now()) @updatedAt @map("updatedat") @db.Timestamptz
  deletedAt     DateTime?         @map("deletedat") @db.Timestamptz

  instrument Instrument @relation(fields: [instrument_id], references: [id], onDelete: Cascade)

  @@map("maintenance")
}
```

### 2.3 Linking the Host Application's `User` Model

In the host application's existing `User` model, add the RFID reference and the transactions relation:

```prisma
model User {
  // --- Existing Host Fields (e.g., id, email, password, role) ---
  id    String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name  String

  // --- Add These 3 Fields to Bridge the Instrument System ---
  rfid         String?
  rfidRef      Rfid?         @relation(fields: [rfid], references: [id], onDelete: SetNull)
  transactions Transaction[]

  // --- Rest of Existing Host Model ---
}
```

> **Note on User Primary Key Type**:
> If the host `User.id` is `Int` (autoincrement) or `String` (cuid/nanoid) instead of `UUID`, adjust `Transaction.user_id` to match the exact same type:
> ```prisma
> model Transaction {
>   // If Host User.id is Int:
>   user_id  Int
>   // If Host User.id is String:
>   user_id  String
> }
> ```

### 2.4 Run Migration

Execute in the host backend root:

```bash
npx prisma migrate dev --name add_instrument_modules
npx prisma generate
```

---

## 3. Backend Integration (Node.js / Fastify)

### 3.1 Dependencies

Add the required packages to the host `package.json` if they are not already installed:

```bash
npm install mqtt @fastify/multipart @fastify/static zod fastify-type-provider-zod
```

### 3.2 Environment Variables

Append the following configuration variables to the host `backend/.env`:

```env
# MQTT Broker Configuration (Default: Free EMQX public broker or your private broker)
MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
MQTT_CLIENT_ID_PREFIX=instrument_backend_
MQTT_DEFAULT_TIMEOUT_MS=5000

# Optional: Upload directory for instrument photos (defaults to ./uploads)
UPLOAD_DIR=uploads
```

### 3.3 Backend Files to Copy

Copy the files from this repository to the host repository according to this mapping:

#### 1. Schemas (`src/schemas/`)
- `src/schemas/instrument.schema.ts`
- `src/schemas/instrument-group.schema.ts`
- `src/schemas/maintenance.schema.ts`
- `src/schemas/rfid.schema.ts`
- `src/schemas/transaction.schema.ts`
- `src/schemas/mqtt.schema.ts`
- `src/schemas/dashboard.schema.ts` (for borrowing statistics)

#### 2. Services (`src/services/`)
- `src/services/instrument.service.ts`
- `src/services/instrument-group.service.ts`
- `src/services/maintenance.service.ts`
- `src/services/image.service.ts`
- `src/services/mqtt.service.ts`

#### 3. Routes (`src/routes/`)
- `src/routes/instrument.ts`
- `src/routes/instrument-group.ts`
- `src/routes/maintenance.ts`
- `src/routes/rfid.ts`
- `src/routes/transaction.ts`
- `src/routes/mqtt.ts`
- `src/routes/image.ts`
- `src/routes/dashboard.ts` (optional, for `/dashboard/borrowing-stats`)

---

### 3.4 Bridging the Host User Model

The imported instrument subsystem interacts with the host `User` table in only two places:

1. **`src/routes/transaction.ts` (`processTransaction`)**:
   When hardware calls `POST /borrow` or `POST /return` with a staff badge UID (`staffuid`):
   ```typescript
   const user = await prisma.user.findFirst({
     where: { rfid: String(staffuid) },
     select: { id: true }
   });
   ```
   *Ensure the host User table has the `rfid` column indexed for optimal lookup speed.*

2. **`src/routes/rfid.ts` (`handleCheckStaff` & `GET /staff/load`)**:
   Hardware terminals check active badge authorization:
   ```typescript
   const user = await prisma.user.findFirst({
     where: { rfid: String(rfidId), deletedAt: null },
     select: { id: true, name: true, rfid: true }
   });
   ```
   *(If the host project uses an `isActive: boolean` or `status: 'ACTIVE'` column instead of soft delete `deletedAt: null`, adjust this query to match).*

---

### 3.5 Server Registration & Lifecycle Hooks

In the host application's bootstrap file (e.g., `src/app.ts` or `src/server.ts`):

```typescript
import { instrumentRoutes } from './routes/instrument.js';
import { instrumentGroupRoutes } from './routes/instrument-group.js';
import { maintenanceRoutes } from './routes/maintenance.js';
import { rfidRoutes } from './routes/rfid.js';
import { transactionRoutes } from './routes/transaction.js';
import { mqttRoutes } from './routes/mqtt.js';
import { imageRoutes } from './routes/image.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { mqttService } from './services/mqtt.service.js';

export async function registerInstrumentModule(fastifyApp: any, prefix = '') {
  // Register image uploads (multipart) if not already registered
  // await fastifyApp.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  // Register routes (with optional prefix like '/api' or empty '')
  await fastifyApp.register(instrumentRoutes, { prefix });
  await fastifyApp.register(instrumentGroupRoutes, { prefix });
  await fastifyApp.register(maintenanceRoutes, { prefix });
  await fastifyApp.register(rfidRoutes, { prefix });
  await fastifyApp.register(transactionRoutes, { prefix });
  await fastifyApp.register(mqttRoutes, { prefix });
  await fastifyApp.register(imageRoutes, { prefix });
  await fastifyApp.register(dashboardRoutes, { prefix });
}

// Add MQTT disconnection to graceful shutdown:
export async function shutdownInstrumentModule() {
  await mqttService.disconnect();
}
```

In the host's `process.on('SIGINT')` and `process.on('SIGTERM')` handlers, call `await shutdownInstrumentModule()`.

---

## 4. Frontend Integration (Vue 3)

### 4.1 Components to Migrate

Copy the following files into the host frontend (`src/components/` and `src/views/`):

```text
frontend/src/
├── components/
│   ├── common/
│   │   ├── RfidSelect.vue            # Dropdown for unassigned tags + custom input
│   │   ├── ImageUpload.vue           # Photo upload, preview, and download
│   │   ├── ImagePreviewModal.vue     # Fullscreen lightbox viewer
│   │   └── Modal.vue                 # Base modal dialog (if host does not have one)
│   └── instruments/
│       ├── GroupCard.vue             # Accordion card with unit sub-table
│       ├── GroupGridCard.vue         # Grid card with real-time availability bars
│       ├── GroupModal.vue            # Add / edit instrument group modal
│       ├── UnitModal.vue             # Add / edit physical unit with "Scan RFID" button
│       ├── SendMaintenanceModal.vue  # Maintenance dispatch dialog
│       ├── ReturnMaintenanceModal.vue# Maintenance return dialog
│       ├── TransactionsTab.vue       # Borrow/Return history table with filters
│       ├── MaintenanceTab.vue        # Active repairs table with quick return
│       └── RetiredTab.vue            # Decommissioned equipment management
└── views/
    └── InstrumentsView.vue           # Main instruments portal containing all sub-tabs
```

---

### 4.2 Routing Configuration

Add the instrument portal route to the host application's Vue Router (`src/router/index.js` or `src/router/index.ts`):

```javascript
{
  path: '/instruments',
  name: 'Instruments',
  component: () => import('@/views/InstrumentsView.vue'),
  meta: {
    requiresAuth: true,
    title: 'Instruments & Equipment'
  }
}
```

---

### 4.3 Integrating MQTT RFID Scan into Host User Forms

Since the host project already has its own User / Staff management UI, you can embed the **Scan RFID (MQTT)** button into the host's existing User form to allow one-click badge assignment:

```vue
<template>
  <div class="form-group">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <label>Staff Badge RFID</label>
      <button
        type="button"
        class="btn btn-sm"
        :class="{ 'btn-primary': isScanning }"
        :disabled="isScanning"
        @click="scanUserRfid"
      >
        <span>{{ isScanning ? 'Waiting for Badge Tap (15s)...' : 'Scan RFID (MQTT)' }}</span>
      </button>
    </div>

    <!-- Use RfidSelect component or plain input -->
    <RfidSelect ref="rfidSelectRef" v-model="form.rfid" label="" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import RfidSelect from '@/components/common/RfidSelect.vue';

const form = ref({ rfid: '' });
const isScanning = ref(false);
const rfidSelectRef = ref(null);

async function scanUserRfid() {
  if (isScanning.value) return;
  isScanning.value = true;

  try {
    const res = await fetch('/mqtt/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'instrument/device/scanner/command',
        payload: { action: 'SCAN_USER' },
        timeout: 15000
      })
    });

    const result = await res.json();
    if (res.ok && result.success) {
      const scannedUid = result.data?.uid || result.data?.rfid || result.data;
      const cardType = result.data?.cardType === 'HF' ? 'HF' : 'LF';

      if (scannedUid) {
        form.value.rfid = scannedUid;

        // Auto-register unknown badge into the database
        await fetch('/rfids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: scannedUid, type: cardType })
        });
        await rfidSelectRef.value?.fetchTags();
      }
    }
  } catch (err) {
    console.error('MQTT scan failed:', err);
  } finally {
    isScanning.value = false;
  }
}
</script>
```

---

## 5. Hardware Integration & MQTT Setup

### 5.1 MQTT Architecture
- **Broker**: Configured in `.env` via `MQTT_BROKER_URL`. Supports any standard broker (EMQX, HiveMQ, Mosquitto, AWS IoT).
- **Wildcard Response Listening**: The backend subscribes to `instrument/responses/+` at startup. Hardware terminals publish responses directly to `instrument/responses/<requestId>`, avoiding per-request subscribe/unsubscribe roundtrips.

### 5.2 Terminal Commands & Payload Specifications

#### 1. Hardware Scanner Trigger (`POST /mqtt/request`):
- **User Badge Scan**:
  - Published Topic: `instrument/device/scanner/command`
  - Payload: `{ "action": "SCAN_USER", "requestId": "<uuid>", "replyTopic": "instrument/responses/<uuid>" }`
- **Instrument Tag Scan**:
  - Published Topic: `instrument/device/scanner/command`
  - Payload: `{ "action": "SCAN_INSTRUMENT", "requestId": "<uuid>", "replyTopic": "instrument/responses/<uuid>" }`

#### 2. Hardware Reply (ESP32 / Reader Terminal):
The reader terminal publishes to the received `replyTopic`:
```json
{
  "status": "SUCCESS",
  "action": "SCAN_USER",
  "device": "ESP32",
  "cardType": "LF",
  "uid": "EA486100",
  "uidLen": 4
}
```

#### 3. Automated Borrow / Return Endpoints (Direct HTTP):
For standalone hardware check-in/check-out kiosks:
- `POST /borrow`: Body: `{ "lfuid": "...", "hfuid": "...", "unixTime": 1788948000 }`
- `POST /return`: Body: `{ "lfuid": "...", "hfuid": "...", "unixTime": 1788948060 }`
- `GET /time`: Returns current server unix epoch for hardware clock sync.

---

## 6. Step-by-Step Verification Checklist

After completing the merge, run this checklist to ensure all modules function seamlessly:

- [ ] **Prisma Migration**: Run `npx prisma migrate dev` and verify tables (`instrument`, `instrument_group`, `maintenance`, `transaction`, `rfid`) are created in PostgreSQL.
- [ ] **MQTT Connection**: Request `GET /mqtt/status` and verify `{ "connected": true, "status": "connected" }`.
- [ ] **MQTT Request-Reply**: Send `POST /mqtt/request` with a 2-second timeout on a dummy topic to confirm `504 Gateway Timeout` is returned properly without hanging.
- [ ] **Auto-Registration of Unknown RFID**:
  - Add an instrument unit with a brand-new RFID string not present in the DB.
  - Verify the instrument is created and the tag appears in the `Rfid` table with type `HF`.
- [ ] **Instrument Group & Unit UI**:
  - Navigate to `/instruments` in the web interface.
  - Create an Instrument Group, add a physical unit, and verify availability ratio counter (`1 total, 1 available`).
- [ ] **Borrow / Return Flow**:
  - Trigger `POST /borrow` with a registered user badge UID and instrument tag UID.
  - Verify instrument status flips to `borrowed` and a new record appears in `/transactions`.
  - Trigger `POST /return` and verify status restores to `available`.
- [ ] **Maintenance Lifecycle**:
  - Dispatch a unit to maintenance via the UI with technician notes.
  - Verify status flips to `maintenance` and appears in the **Maintenance** tab.
  - Click **Bring Back** and confirm unit returns to `available`.
- [ ] **Image Upload & Cleanup**:
  - Upload a photo for an instrument unit.
  - Delete or replace the photo, and verify the old image file is purged from disk.
