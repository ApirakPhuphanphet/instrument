require('dotenv').config();

const express = require('express');
const pool = require('./db');

const app = express();
const port = Number(process.env.PORT || 3000);

// Middleware สำหรับแปลงข้อมูลที่ส่งมาให้เป็น JSON (เพื่อให้ req.body ใช้งานได้)
app.use(express.json());
// Middleware สำหรับรับข้อมูลจากฟอร์ม (ถ้ามีการส่งแบบ x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------
// POST Endpoints (Log body)
// ---------------------------------------------------------

// POST /
app.post('/', (req, res) => {
    console.log('[POST /] Body received:', req.body);
    res.status(200).json({ message: "Root POST success", data: req.body });
});

// POST /borrow
app.post('/borrow', (req, res) => {
    console.log('[POST /borrow] Body received:', req.body);
    const { userRfid, instrumentRfid, unixTime } = req.body;
    // check if userRfid and instrumentRfid exist in the database
    pool.query('SELECT * FROM "user" WHERE rfid = $1', [userRfid])
        .then(userResult => {
            if (userResult.rows.length === 0) {
                console.log(`[POST /borrow] User RFID not found: ${userRfid}`);
                return res.status(404).json({ message: "User RFID not found", data: req.body });
            }
            return pool.query('SELECT * FROM instrument WHERE rfid = $1', [instrumentRfid]);
        })
        .then(instrumentResult => {
            if (instrumentResult.rows.length === 0) {
                console.log(`[POST /borrow] Instrument RFID not found: ${instrumentRfid}`);
                return res.status(404).json({ message: "Instrument RFID not found", data: req.body });
            }
            // If both exist, insert into transaction table
            return pool.query(
                'INSERT INTO "transaction" (userRfid, instrumentRfid) VALUES ($1, $2) RETURNING *',
                [userRfid, instrumentRfid]
            );
        })
        .then(transactionResult => {
            console.log('[POST /borrow] Transaction recorded:', transactionResult.rows[0]);
            res.status(200).json({ message: "Borrow POST success", data: transactionResult.rows[0] });
        })
        .catch(error => {
            console.error('[POST /borrow] Error processing request:', error.message);
            res.status(500).json({ message: "Internal server error", error: error.message });
        });
});

// POST /return
app.post('/return', (req, res) => {
    console.log('[POST /return] Body received:', req.body);
    res.status(200).json({ message: "Return POST success", data: req.body });
});

/**
 * Insert an RFID into the table created by migrate.js.
 * Existing IDs are updated so repeated scans do not fail on the primary key.
 */
async function insertRfid(req, res, type) {
    const rfidId = req.body[type.toUpperCase()] || req.body[type] || req.body.rfid;

    if (!rfidId) {
        return res.status(400).json({
            message: `Missing ${type.toUpperCase()} RFID`,
            data: req.body
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO rfid (id, type)
             VALUES ($1, $2::rfid_type)
             ON CONFLICT (id) DO UPDATE SET type = EXCLUDED.type
             RETURNING *`,
            [String(rfidId), type]
        );

        console.log(`[POST /${type.toUpperCase()}] RFID saved:`, result.rows[0]);
        return res.status(200).json({
            message: `${type.toUpperCase()} RFID saved successfully`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error(`[POST /${type.toUpperCase()}] Error saving RFID:`, error.message);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

/**
 * Check whether an RFID exists with the expected LF / HF type.
 */
async function checkRfid(req, res, type) {
    const rfidId = req.body[type.toUpperCase()] || req.body[type] || req.body.rfid;

    if (!rfidId) {
        return res.status(400).json({
            message: `Missing ${type.toUpperCase()} RFID`,
            checked_rfid: null
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, type
             FROM rfid
             WHERE id = $1 AND type = $2::rfid_type`,
            [String(rfidId), type]
        );

        if (result.rows.length === 0) {
            console.log(`[POST /${type.toUpperCase()}/check] RFID not found: ${rfidId}`);
            return res.status(404).json({
                message: `${type.toUpperCase()} RFID not found`,
                checked_rfid: null
            });
        }

        console.log(`[POST /${type.toUpperCase()}/check] RFID found: ${rfidId}`);
        return res.status(200).json({
            message: `${type.toUpperCase()} RFID found`,
            checked_rfid: result.rows[0].id,
            type: result.rows[0].type
        });
    } catch (error) {
        console.error(`[POST /${type.toUpperCase()}/check] Error checking RFID:`, error.message);
        return res.status(500).json({
            message: 'Internal server error',
            checked_rfid: null
        });
    }
}
// POST /LF
app.post('/LF', (req, res) => {
    console.log('[POST /LF] Body received:', req.body);
    insertRfid(req, res, 'LF');
});

// POST /HF
app.post('/HF', (req, res) => {
    console.log('[POST /HF] Body received:', req.body);
    insertRfid(req, res, 'HF');
});

app.post('/HF/check', (req, res) => {
    console.log('[POST /HF/check] Body received:', req.body);
    checkRfid(req, res, 'HF');
});

app.post('/LF/check', (req, res) => {
    console.log('[POST /LF/check] Body received:', req.body);
    checkRfid(req, res, 'LF');
});

// ---------------------------------------------------------
// GET Endpoints
// ---------------------------------------------------------


app.get('/health', (req, res) => {
    pool.query('SELECT 1')
        .then(() => res.status(200).json({ message: 'Server and database are healthy' }))
        .catch((error) => {
            console.error('[GET /health] Database check failed:', error.message);
            res.status(503).json({ message: 'Database unavailable' });
        });
})

app.get('/time', (req, res) => {
    const currentTime = new Date();
    console.log('[GET/time] Current server time: ' + currentTime);
    const now = new Date();
    // convert time to unix timestamp
    const unixTimestamp = Math.floor(now.getTime() / 1000);
    console.log('[GET/time] Current server time (Unix Timestamp): ' + unixTimestamp);
    res.status(200).send(`${unixTimestamp}`);
})

app.get('/HF/load', (req, res) => {
    const unixTime = req.query.timestamp;
    console.log('[GET /HF/load] Loading data after timestamp: ' + unixTime);
    // Add your data loading logic here
    res.status(200).json({ ids: [] });
});

app.get('/LF/load', (req, res) => {
    const unixTime = req.query.timestamp;
    console.log('[GET /LF/load] Loading data after timestamp: ' + unixTime);
    // Add your data loading logic here
    res.status(200).json({ ids: [] });

});

app.get('/HF/load-deleted', (req, res) => {
    const unixTime = req.query.timestamp;
    console.log('[GET /HF/load-deleted] Loading data after timestamp: ' + unixTime);
    // Add your data loading logic here
    res.status(200).json({ ids: ['1122', '3344', '5566'] });
});

app.get('/LF/load-deleted', (req, res) => {
    const unixTime = req.query.timestamp;
    console.log('[GET /LF/load-deleted] Loading data after timestamp: ' + unixTime);
    // Add your data loading logic here
    res.status(200).json({ ids: ['1234', '5678', '9101'] });
});

// ---------------------------------------------------------
// Start Server
// ---------------------------------------------------------
app.listen(port, async () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL');
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        console.error('Set DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD in backend/.env');
    }
    console.log('Waiting for requests...');
});

process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
});
