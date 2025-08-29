const db = require('./db');

const getDashboardStats = async (req, res) => {
    try {
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) {
            // Agar business_id nahi hai to stats 0 bhej dein
            return res.status(200).json({ totalProducts: 0, totalStock: 0, totalValue: 0 });
        }

        const sqlQuery = `
            SELECT
                COALESCE(COUNT(id), 0) AS totalProducts,
                COALESCE(SUM(quantity), 0) AS totalStock,
                COALESCE(SUM(quantity * price), 0) AS totalValue
            FROM products
            WHERE business_id = ?
        `;

        const [results] = await db.query(sqlQuery, [business_id]);
        res.status(200).json(results[0]);

    } catch (error) {
        console.error("Dashboard stats fetch karte waqt error:", error);
        res.status(500).json({ error: "Database query mein masla hai." });
    }
};

module.exports = {
    getDashboardStats,
};