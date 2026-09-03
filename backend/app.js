require('dotenv').config();

const express = require('express');
const pool = require('./db');
const { handleTransaction, insertRfid, checkRfid, loadRfid } = require('./functions');

const app = express();
const port = Number(process.env.PORT || 3000);

// Middleware สำหรับแปลงข้อมูลที่ส่งมาให้เป็น JSON (เพื่อให้ req.body ใช้งานได้)
app.use(express.json());
// Middleware สำหรับรับข้อมูลจากฟอร์ม (ถ้ามีการส่งแบบ x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------
// POST Endpoints (Log body)
// ---------------------------------------------------------

// POST /borrow
app.post('/borrow', (req, res) => {
    console.log('[POST /borrow] Body received:', req.body);
    handleTransaction(req, res, 'borrow');
});

// POST /return
app.post('/return', (req, res) => {
    console.log('[POST /return] Body received:', req.body);
    handleTransaction(req, res, 'return');
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
    loadRfid(req, res, 'HF');
});

app.get('/LF/load', (req, res) => {
    const unixTime = req.query.timestamp;
    console.log('[GET /LF/load] Loading data after timestamp: ' + unixTime);
    loadRfid(req, res, 'LF');
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
