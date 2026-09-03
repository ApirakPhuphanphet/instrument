const pool = require('./db');

async function saveTransaction(userid, instrumentId, type, unixTimestamp = null) {
    const result = await pool.query(
        `INSERT INTO "transaction" (user_id, instrument_id, type, timestamp)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [String(userid), String(instrumentId), type, unixTimestamp ? new Date(unixTimestamp * 1000) : null]
    );

    return result.rows[0];
}

async function handleTransaction(req, res, type) {
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
            console.log(`[POST /${type}] User RFID not found: ${lfuid}`);
            return res.status(404).json({ message: 'User RFID not found', data: req.body });
        }

        const instrumentResult = await pool.query(
            'SELECT id FROM instrument WHERE rfid = $1',
            [String(hfuid)]
        );
        if (instrumentResult.rows.length === 0) {
            console.log(`[POST /${type}] Instrument RFID not found: ${hfuid}`);
            return res.status(404).json({ message: 'Instrument RFID not found', data: req.body });
        }

        const transaction = await saveTransaction(
            userResult.rows[0].id,
            instrumentResult.rows[0].id,
            type,
            unixTime
        );
        console.log(`[POST /${type}] Transaction recorded:`, transaction);
        return res.status(200).json({
            message: `${type.charAt(0).toUpperCase()}${type.slice(1)} POST success`,
            data: transaction
        });
    } catch (error) {
        console.error(`[POST /${type}] Error processing request:`, error.message);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

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
             ON CONFLICT (id) DO UPDATE SET
                 type = EXCLUDED.type,
                 updatedat = NOW()
             RETURNING *`,
            [String(rfidId), type.toUpperCase()]
        );

        console.log(`[POST /${type.toUpperCase()}] RFID saved:`, result.rows[0]);
        return res.status(200).json({
            message: `${type.toUpperCase()} RFID saved successfully`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error(`[POST /${type.toUpperCase()}] Error saving RFID:`, error.message);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

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
             WHERE id = $1
               AND type = $2::rfid_type
               AND (
                   EXISTS (SELECT 1 FROM "users" WHERE "users".rfid = rfid.id)
                   OR EXISTS (SELECT 1 FROM instrument WHERE instrument.rfid = rfid.id)
               )
               AND deletedat IS NULL`,
            [String(rfidId), type.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: `${type.toUpperCase()} RFID not found`,
                checked_rfid: null
            });
        }

        return res.status(200).json({
            message: `${type.toUpperCase()} RFID found`,
            checked_rfid: result.rows[0].id,
            type: result.rows[0].type
        });
    } catch (error) {
        console.error(`[POST /${type.toUpperCase()}/check] Error checking RFID:`, error.message);
        return res.status(500).json({ message: 'Internal server error', checked_rfid: null });
    }
}

async function loadRfid(req, res, type) {
    const timestamp = Number(req.query.timestamp || 0);

    if (!Number.isFinite(timestamp)) {
        return res.status(400).json({
            message: 'timestamp must be a valid Unix timestamp',
            data: []
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, type, updatedat AS "updatedAt"
             FROM rfid
             WHERE type = $1::rfid_type
               AND updatedat > TO_TIMESTAMP($2)
               AND (
                   EXISTS (SELECT 1 FROM "users" WHERE "users".rfid = rfid.id)
                   OR EXISTS (SELECT 1 FROM instrument WHERE instrument.rfid = rfid.id)
               )
               AND deletedat IS NULL
             ORDER BY updatedat ASC`,
            [type.toUpperCase(), timestamp]
        );

        return res.status(200).json({
            ids: result.rows.map((rfid) => rfid.id),
            data: result.rows
        });
    } catch (error) {
        console.error(`[GET /${type.toUpperCase()}/load] Error loading RFID:`, error.message);
        return res.status(500).json({ message: 'Internal server error', data: [] });
    }
}

async function loadDeletedRfid(req, res, type) {
    const timestamp = Number(req.query.timestamp || 0);

    if (!Number.isFinite(timestamp)) {
        return res.status(400).json({
            message: 'timestamp must be a valid Unix timestamp',
            data: []
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, type, deletedat AS "deletedAt"
             FROM rfid
             WHERE type = $1::rfid_type
               AND deletedat IS NOT NULL
               AND deletedat > TO_TIMESTAMP($2)
             ORDER BY deletedat ASC`,
            [type.toUpperCase(), timestamp]
        );

        console.log(`[GET /${type.toUpperCase()}/load-deleted] Loaded deleted RFID records:`, result.rows);
        return res.status(200).json({
            ids: result.rows.map((rfid) => rfid.id),
            data: result.rows
        });
    } catch (error) {
        console.error(`[GET /${type.toUpperCase()}/load-deleted] Error loading deleted RFID:`, error.message);
        return res.status(500).json({ message: 'Internal server error', data: [] });
    }
}

module.exports = {
    saveTransaction,
    handleTransaction,
    insertRfid,
    checkRfid,
    loadRfid,
    loadDeletedRfid
};
