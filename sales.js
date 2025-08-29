const db = require('./db');

// CREATE SALE (Updated for Multi-Tenancy)
const createSale = async (req, res) => {
    const { customer_name, total_amount, items } = req.body;
    const { id: user_id, business_id } = req.user; // Token se user_id aur business_id nikalen

    if (!business_id) {
        return res.status(403).json({ message: "User is not associated with a business." });
    }
    if (total_amount === undefined || !items || items.length === 0) {
        return res.status(400).json({ message: "Missing required sale data." });
    }

    const connection = await db.getConnection(); 

    try {
        await connection.beginTransaction();

        // 1. Sales table mein business_id ke sath entry karein
        const salesQuery = "INSERT INTO sales (customer_name, total_amount, user_id, business_id) VALUES (?, ?, ?, ?)";
        const [saleResult] = await connection.query(salesQuery, [customer_name, total_amount, user_id, business_id]);
        const saleId = saleResult.insertId;
        
        // 2. Sale items table mein business_id ke sath bulk entry karein
        const saleItemsQuery = "INSERT INTO sale_items (sale_id, product_id, quantity_sold, price_per_unit, discount, cost_per_unit, business_id) VALUES ?";
        const saleItemsValues = items.map(item => [saleId, item.product_id, item.quantity_sold, item.price_per_unit, item.discount || 0, item.cost_per_unit, business_id]);
        await connection.query(saleItemsQuery, [saleItemsValues]);

        // 3. Stock update ki query ko business_id se secure karein
        const updateStockQuery = `
            UPDATE products SET quantity = quantity - CASE id
                ${items.map(() => `WHEN ? THEN ?`).join(' ')}
            END
            WHERE id IN (${items.map(() => `?`).join(',')}) AND business_id = ?
        `;
        const updateValues = [...items.flatMap(item => [item.product_id, item.quantity_sold, item.product_id]), business_id];
        await connection.query(updateStockQuery, updateValues);
        
        await connection.commit();
        res.status(201).json({ message: "Sale recorded successfully!", saleId: saleId });

    } catch (err) {
        await connection.rollback();
        console.error("Sale creation error:", err);
        res.status(500).json({ error: "Failed to record sale." });
    } finally {
        if (connection) connection.release();
    }
};

// GET ALL SALES (Updated for Multi-Tenancy)
const getAllSales = async (req, res) => {
    try {
        const { search } = req.query;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(200).json([]);

        let sqlQuery = `
            SELECT s.id, s.customer_name, s.total_amount, s.sale_date, u.username 
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.business_id = ?
        `;
        const params = [business_id];

        if (search) {
            sqlQuery += ` AND (s.customer_name LIKE ? OR s.id = ?)`;
            params.push(`%${search}%`);
            params.push(search);
        }

        sqlQuery += " ORDER BY s.id DESC";

        const [results] = await db.query(sqlQuery, params);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching all sales:", error);
        res.status(500).json({ error: "Failed to fetch sales." });
    }
};

// GET SALE BY ID (Updated for Multi-Tenancy)
const getSaleById = async (req, res) => {
    try {
        const saleId = req.params.id;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "Access denied." });
        
        const query = `
            SELECT 
                si.quantity_sold, si.price_per_unit, si.discount, si.cost_per_unit, 
                p.name as product_name, p.sku, 
                s.customer_name, s.total_amount, s.sale_date,
                u.username
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE si.sale_id = ? AND s.business_id = ?
        `;
        
        const [results] = await db.query(query, [saleId, business_id]);
        
        if (results.length === 0) {
            return res.status(404).json({ message: "Sale not found or you don't have permission to view it." });
        }
        
        const saleDetails = {
            id: saleId,
            customer_name: results[0].customer_name,
            total_amount: results[0].total_amount,
            sale_date: results[0].sale_date,
            username: results[0].username,
            items: results.map(item => ({
                product_name: item.product_name, sku: item.sku,
                quantity_sold: item.quantity_sold, price_per_unit: item.price_per_unit,
                discount: item.discount, cost_per_unit: item.cost_per_unit
            }))
        };
        res.status(200).json(saleDetails);
    } catch (error) {
        console.error("Error fetching sale by ID:", error);
        res.status(500).json({ error: "Failed to fetch sale details." });
    }
};

module.exports = {
    createSale,
    getAllSales,
    getSaleById,
};