const db = require('./db');

// GET ALL SUPPLIERS (Updated for Multi-Tenancy)
const getAllSuppliers = async (req, res) => {
    try {
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(200).json([]);

        // Query ko business_id ke hisab se secure karein
        const query = "SELECT * FROM suppliers WHERE business_id = ? ORDER BY name ASC";
        const [results] = await db.query(query, [business_id]);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).json({ error: "Failed to fetch suppliers." });
    }
};

// ADD NEW SUPPLIER (Updated for Multi-Tenancy)
const addSupplier = async (req, res) => {
    try {
        const { name, contact_person, email, phone, address } = req.body;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "User is not associated with a business." });
        if (!name || !email) return res.status(400).json({ message: "Name and Email are required." });
        
        // Query mein business_id add karein
        const query = "INSERT INTO suppliers (name, contact_person, email, phone, address, business_id) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [name, contact_person, email, phone, address, business_id];
        
        const [result] = await db.query(query, values);
        res.status(201).json({ message: "Supplier added successfully!", insertedId: result.insertId });
    } catch (error) {
        console.error("Error adding supplier:", error);
        res.status(500).json({ error: "Failed to add supplier." });
    }
};

// UPDATE SUPPLIER (Updated for Multi-Tenancy)
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, email, phone, address } = req.body;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "Unauthorized." });
        if (!name || !email) return res.status(400).json({ message: "Name and Email are required." });
        
        // Query ko business_id ke hisab se secure karein
        const query = "UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ? WHERE id = ? AND business_id = ?";
        const values = [name, contact_person, email, phone, address, id, business_id];

        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Supplier not found or you don't have permission.` });
        }

        res.status(200).json({ message: `Supplier ID: ${id} updated successfully!` });
    } catch (error) {
        console.error("Error updating supplier:", error);
        res.status(500).json({ error: "Failed to update supplier." });
    }
};

// DELETE SUPPLIER (Updated for Multi-Tenancy)
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "Unauthorized." });

        // Query ko business_id ke hisab se secure karein
        const query = "DELETE FROM suppliers WHERE id = ? AND business_id = ?";
        
        const [result] = await db.query(query, [id, business_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Supplier not found or you don't have permission.` });
        }
        
        res.status(200).json({ message: `Supplier ID: ${id} deleted successfully!` });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        res.status(500).json({ error: "Failed to delete supplier." });
    }
};

module.exports = {
    getAllSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
};