require('dotenv').config();

const express = require('express');
const pool = require('./db');
const { saveTransaction, insertRfid, checkRfid } = require('./functions');

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
app.post('/borrow', async (req, res) => {
    console.log('[POST /borrow] Body received:', req.body);
    const { lfuid, hfuid, unixTime } = req.body;

    if (!lfuid || !hfuid) {
        return res.status(400).json({
            message: 'LFUID and HFUID are required',
            data: req.body
        });
    }

    try {
        const userResult = await pool.query(
            'SELECT id FROM "users" WHERE rfid = $1',
            [String(lfuid)]
        );
        if (userResult.rows.length === 0) {
            console.log(`[POST /borrow] User RFID not found: ${lfuid}`);
            return res.status(404).json({ message: 'User RFID not found', data: req.body });
        }

        const instrumentResult = await pool.query(
            'SELECT id FROM instrument WHERE rfid = $1',
            [String(hfuid)]
        );
        if (instrumentResult.rows.length === 0) {
            console.log(`[POST /borrow] Instrument RFID not found: ${hfuid}`);
            return res.status(404).json({ message: 'Instrument RFID not found', data: req.body });
        }

        const transaction = await saveTransaction(userResult.rows[0].id, instrumentResult.rows[0].id, 'borrow', unixTime);
        console.log('[POST /borrow] Transaction recorded:', transaction);
        return res.status(200).json({ message: 'Borrow POST success', data: transaction });
    } catch (error) {
        console.error('[POST /borrow] Error processing request:', error.message);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// POST /return
app.post('/return', async (req, res) => {
    console.log('[POST /return] Body received:', req.body);
    const { lfuid, hfuid, unixTime } = req.body;

    if (!lfuid || !hfuid) {
        return res.status(400).json({
            message: 'LFUID and HFUID are required',
            data: req.body
        });
    }

    try {
        const userResult = await pool.query(
            'SELECT id FROM "users" WHERE rfid = $1',
            [String(lfuid)]
        );
        if (userResult.rows.length === 0) {
            console.log(`[POST /return] User RFID not found: ${lfuid}`);
            return res.status(404).json({ message: 'User RFID not found', data: req.body });
        }

        const instrumentResult = await pool.query(
            'SELECT id FROM instrument WHERE rfid = $1',
            [String(hfuid)]
        );
        if (instrumentResult.rows.length === 0) {
            console.log(`[POST /return] Instrument RFID not found: ${hfuid}`);
            return res.status(404).json({ message: 'Instrument RFID not found', data: req.body });
        }

        const transaction = await saveTransaction(userResult.rows[0].id, instrumentResult.rows[0].id, 'return', unixTime);
        console.log('[POST /return] Transaction recorded:', transaction);
        return res.status(200).json({ message: 'Return POST success', data: transaction });
    } catch (error) {
        console.error('[POST /return] Error processing request:', error.message);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

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
