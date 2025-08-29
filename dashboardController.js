const db = require('./db');

const getDashboardData = async (req, res) => {
    try {
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "User is not associated with a business." });

        // Step 1: Tamam queries ko business_id ke hisab se update karein
        const statsQuery = "SELECT COUNT(id) AS totalProducts, SUM(quantity) AS totalStock, SUM(quantity * price) AS totalValue FROM products WHERE business_id = ?";
        
        const topProductsQuery = `
            SELECT p.name, SUM(si.quantity_sold) as total_sold
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE p.business_id = ?
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 5
        `;
        
        const recentSalesQuery = `
            SELECT s.id, s.customer_name, s.total_amount, s.sale_date, u.username 
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.business_id = ?
            ORDER BY s.id DESC 
            LIMIT 5
        `;

        // Step 2: Promise.all mein har query ke sath business_id pass karein
        const [
            [statsResults],
            [topProductsResults],
            [recentSalesResults]
        ] = await Promise.all([
            db.query(statsQuery, [business_id]),
            db.query(topProductsQuery, [business_id]),
            db.query(recentSalesQuery, [business_id])
        ]);

        // Step 3: Natijay (results) ko ek object mein arrange karein
        const responseData = {
            stats: statsResults[0],
            topProducts: topProductsResults,
            recentSales: recentSalesResults,
        };
        
        res.status(200).json(responseData);

    } catch (error) {
        console.error("Dashboard data fetch karte waqt error:", error);
        res.status(500).json({ error: "Server error while fetching dashboard data." });
    }
};

module.exports = { getDashboardData };