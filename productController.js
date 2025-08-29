const db = require('./db');

// Har function mein business_id ka istemal hoga
const getAllProducts = async (req, res) => {
    try {
        const { sku } = req.query;
        const { business_id } = req.user; // Token se business_id nikalen

        // VVIP Safety Check: Agar token mein business_id nahi hai, to khali array bhejein
        if (!business_id) {
            return res.status(200).json([]);
        }

        let sqlQuery = "SELECT * FROM products WHERE business_id = ?";
        const params = [business_id];
        
        if (sku) {
            sqlQuery += " AND sku = ?";
            params.push(sku);
        }
        
        sqlQuery += " ORDER BY id DESC";
        
        const [results] = await db.query(sqlQuery, params);
        res.status(200).json(results);
    } catch (error) { res.status(500).json({ error: "Failed to fetch products." }); }
};

const getLowStockProducts = async (req, res) => {
    try {
        const { business_id } = req.user;
        if (!business_id) return res.status(200).json([]);

        const query = "SELECT id, name, quantity FROM products WHERE business_id = ? AND quantity <= 10 ORDER BY quantity ASC";
        const [results] = await db.query(query, [business_id]);
        res.status(200).json(results);
    } catch (error) { res.status(500).json({ error: "Failed to fetch low stock products." }); }
};

const addProduct = async (req, res) => {
    try {
        const { name, sku, description, quantity, price, cost_price } = req.body;
        const { business_id } = req.user;
        if (!business_id) return res.status(403).json({ error: "Unauthorized: No business associated with user." });
        if (!name || !sku || !price) return res.status(400).json({ error: "Name, SKU, and Price are required." });
        
        const sqlQuery = "INSERT INTO products (name, sku, description, quantity, price, cost_price, business_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [name, sku, description, quantity, price, cost_price, business_id];
        
        const [result] = await db.query(sqlQuery, values);
        res.status(201).json({ message: "Product added successfully!", insertedId: result.insertId });
    } catch (error) { res.status(500).json({ error: "Failed to add product." }); }
};

const bulkAddProducts = async (req, res) => {
    try {
        const products = req.body;
        const { business_id } = req.user;
        if (!business_id) return res.status(403).json({ error: "Unauthorized: No business associated with user." });
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Products data is required in an array format." });
        }
        
        const sqlQuery = "INSERT INTO products (name, sku, description, quantity, price, cost_price, business_id) VALUES ?";
        const values = products.map(p => [ p.name, p.sku, p.description || '', p.quantity || 0, p.price || 0, p.cost_price || 0, business_id ]);
        
        const [result] = await db.query(sqlQuery, [values]);
        res.status(201).json({ message: `${result.affectedRows} products imported successfully!` });
    } catch (error) { res.status(500).json({ error: "Failed to import products." }); }
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, sku, description, quantity, price, cost_price } = req.body;
        const { business_id } = req.user;
        if (!business_id) return res.status(403).json({ error: "Unauthorized." });
        if (!name || !sku || !price) return res.status(400).json({ error: "Name, SKU, and Price are required." });

        const sqlQuery = "UPDATE products SET name = ?, sku = ?, description = ?, quantity = ?, price = ?, cost_price = ? WHERE id = ? AND business_id = ?";
        const values = [name, sku, description, quantity, price, cost_price, productId, business_id];
        
        const [result] = await db.query(sqlQuery, values);
        if (result.affectedRows === 0) return res.status(404).json({ message: `Product not found or you don't have permission.` });
        
        res.status(200).json({ message: `Product ID: ${productId} updated successfully!` });
    } catch (error) { res.status(500).json({ error: "Failed to update product." }); }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { business_id } = req.user;
        if (!business_id) return res.status(403).json({ error: "Unauthorized." });
        
        const sqlQuery = "DELETE FROM products WHERE id = ? AND business_id = ?";
        
        const [result] = await db.query(sqlQuery, [productId, business_id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: `Product not found or you don't have permission.` });

        res.status(200).json({ message: `Product ID: ${productId} deleted successfully!` });
    } catch (error) { res.status(500).json({ error: "Failed to delete product." }); }
};

module.exports = {
    getAllProducts,
    getLowStockProducts,
    addProduct,
    bulkAddProducts,
    updateProduct,
    deleteProduct,
};