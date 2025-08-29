const db = require('./db');

// GET ALL CUSTOMERS (Updated for Multi-Tenancy)
const getAllCustomers = async (req, res) => {
    try {
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(200).json([]);

        // Query ko business_id ke hisab se secure karein
        const query = "SELECT * FROM customers WHERE business_id = ? ORDER BY name ASC";
        const [results] = await db.query(query, [business_id]);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Failed to fetch customers." });
    }
};

// ADD NEW CUSTOMER (Updated for Multi-Tenancy)
const addCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "User is not associated with a business." });
        if (!name) return res.status(400).json({ message: "Name is required." });
        
        // Query mein business_id add karein
        const query = "INSERT INTO customers (name, email, phone, address, business_id) VALUES (?, ?, ?, ?, ?)";
        const values = [name, email, phone, address, business_id];

        const [result] = await db.query(query, values);
        res.status(201).json({ message: "Customer added successfully!", insertedId: result.insertId });
    } catch (error) {
        console.error("Error adding customer:", error);
        res.status(500).json({ error: "Failed to add customer." });
    }
};

// UPDATE CUSTOMER (Updated for Multi-Tenancy)
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "Unauthorized." });
        if (!name) return res.status(400).json({ message: "Name is required." });
        
        // Query ko business_id ke hisab se secure karein
        const query = "UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ? AND business_id = ?";
        const values = [name, email, phone, address, id, business_id];

        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Customer not found or you don't have permission.` });
        }

        res.status(200).json({ message: `Customer ID: ${id} updated successfully!` });
    } catch (error) {
        console.error("Error updating customer:", error);
        res.status(500).json({ error: "Failed to update customer." });
    }
};

// DELETE CUSTOMER (Updated for Multi-Tenancy)
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "Unauthorized." });
        
        // Query ko business_id ke hisab se secure karein
        const query = "DELETE FROM customers WHERE id = ? AND business_id = ?";
        
        const [result] = await db.query(query, [id, business_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Customer not found or you don't have permission.` });
        }
        
        res.status(200).json({ message: `Customer ID: ${id} deleted successfully!` });
    } catch (error) {
        console.error("Error deleting customer:", error);
        res.status(500).json({ error: "Failed to delete customer." });
    }
};

module.exports = {
    getAllCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
};