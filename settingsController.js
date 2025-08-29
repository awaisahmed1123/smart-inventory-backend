const db = require('./db');
const bcrypt = require('bcryptjs');

// GET BUSINESS SETTINGS (Updated for Multi-Tenancy)
const getBusinessSettings = async (req, res) => {
    try {
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "User is not associated with a business." });

        // Query ko business_id ke hisab se secure karein
        const query = "SELECT * FROM business_settings WHERE id = ?";
        const [results] = await db.query(query, [business_id]);

        if (results.length === 0) {
            // Agar settings nahi hain, to khali object bhej dein taake frontend par error na aaye
            return res.status(200).json({ business_name: '', address: '', phone: '' });
        }
        res.status(200).json(results[0]);
    } catch (error) {
        console.error("Error fetching business settings:", error);
        res.status(500).json({ error: "Failed to fetch settings." });
    }
};

// UPDATE BUSINESS SETTINGS (Updated for Multi-Tenancy)
const updateBusinessSettings = async (req, res) => {
    try {
        const { business_name, address, phone } = req.body;
        const { business_id } = req.user; // Token se business_id nikalen
        if (!business_id) return res.status(403).json({ message: "User is not associated with a business." });

        // Query ko business_id ke hisab se secure karein
        const query = "UPDATE business_settings SET business_name = ?, address = ?, phone = ? WHERE id = ?";
        const [result] = await db.query(query, [business_name, address, phone, business_id]);

        if (result.affectedRows === 0) {
            // Agar settings pehle se mojood na hon to unhein create kar dein
            const createQuery = "INSERT INTO business_settings (id, business_name, address, phone) VALUES (?, ?, ?, ?)";
            await db.query(createQuery, [business_id, business_name, address, phone]);
        }

        res.status(200).json({ message: "Business settings updated successfully!" });
    } catch (error) {
        console.error("Error updating business settings:", error);
        res.status(500).json({ error: "Failed to update settings." });
    }
};

// FACTORY RESET (Updated for Multi-Tenancy)
const factoryReset = async (req, res) => {
    try {
        const { password } = req.body;
        const { id: userId, business_id } = req.user; // Token se user_id aur business_id nikalen
        
        if (!business_id) return res.status(403).json({ message: "User is not associated with a business." });
        if (!password) return res.status(400).json({ message: "Password is required for confirmation." });

        // Step 1: User ka password verify karein
        const [users] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
        if (users.length === 0) return res.status(404).json({ message: "User not found." });
        
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Incorrect password. Action denied." });

        // VVIP SECURITY FIX: TRUNCATE ki jagah DELETE istemal kiya hai taake sirf ek business ka data delete ho
        const tablesToDeleteFrom = ['sale_items', 'sales', 'products', 'suppliers', 'customers'];
        
        // Promise.all se tamam tables se is business ka data delete karein
        const deletePromises = tablesToDeleteFrom.map(table => {
            console.log(`Resetting data for business ${business_id} from table: ${table}`);
            return db.query(`DELETE FROM ${table} WHERE business_id = ?`, [business_id]);
        });

        await Promise.all(deletePromises);

        res.status(200).json({ message: "Factory reset successful. All transactional data for your business has been cleared." });

    } catch (error) {
        console.error("Error during factory reset:", error);
        res.status(500).json({ message: "Error during reset", error: error.message });
    }
};

module.exports = {
    getBusinessSettings,
    updateBusinessSettings,
    factoryReset,
};