const db = require('./db');

const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { business_id } = req.user; // Token se business_id nikalen

        if (!business_id) {
            return res.status(403).json({ message: "Access denied." });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Please provide both start and end dates." });
        }

        // Query ko business_id ke hisab se secure karein
        const summaryQuery = `
            SELECT
                COALESCE(COUNT(DISTINCT s.id), 0) AS total_sales,
                COALESCE(SUM(si.quantity_sold * si.price_per_unit), 0) AS total_revenue,
                COALESCE(SUM(si.discount), 0) AS total_discount,
                COALESCE(SUM(si.quantity_sold * COALESCE(si.cost_per_unit, 0)), 0) AS total_cost,
                COALESCE(SUM(si.quantity_sold * si.price_per_unit) - SUM(si.discount) - SUM(si.quantity_sold * COALESCE(si.cost_per_unit, 0)), 0) AS gross_profit
            FROM sales s
            JOIN sale_items si ON s.id = si.sale_id
            WHERE s.sale_date BETWEEN ? AND ? AND s.business_id = ?
        `;

        // Query ko business_id ke hisab se secure karein
        const detailsQuery = `
            SELECT s.id, s.customer_name, s.total_amount, s.sale_date, u.username 
            FROM sales s
            JOIN users u ON s.user_id = u.id
            WHERE s.sale_date BETWEEN ? AND ? AND s.business_id = ?
            ORDER BY s.sale_date DESC
        `;

        const [
            [summaryResult], 
            [detailsResult]
        ] = await Promise.all([
            db.query(summaryQuery, [startDate, `${endDate} 23:59:59`, business_id]),
            db.query(detailsQuery, [startDate, `${endDate} 23:59:59`, business_id])
        ]);

        res.status(200).json({
            summary: summaryResult[0],
            details: detailsResult
        });

    } catch (error) {
        console.error("Error fetching sales report:", error);
        res.status(500).json({ error: "Failed to fetch sales report." });
    }
};

const getSalesOverTime = async (req, res) => {
    try {
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(200).json([]);

        // Query ko business_id ke hisab se secure karein
        const query = `
            SELECT 
                DATE(sale_date) as date, 
                SUM(total_amount) as total 
            FROM sales 
            WHERE sale_date >= CURDATE() - INTERVAL 7 DAY AND business_id = ?
            GROUP BY DATE(sale_date)
            ORDER BY date ASC
        `;
        const [results] = await db.query(query, [business_id]);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching sales over time:", error);
        res.status(500).json({ error: "Failed to fetch sales over time data." });
    }
};

module.exports = {
    getSalesReport,
    getSalesOverTime,
};