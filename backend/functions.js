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
             WHERE id = $1 AND type = $2::rfid_type`,
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

module.exports = { saveTransaction, insertRfid, checkRfid };
