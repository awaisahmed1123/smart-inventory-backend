const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
const registerUser = async (req, res) => {
    // Yahan se 'role' hata diya hai taake koi bahar se admin na ban sake
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please enter all fields" });
    }

    try {
        const userExistsQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
        const [existingUsers] = await db.query(userExistsQuery, [username, email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "User already exists with this username or email" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Naye user ko hamesha 'user' ka role dein
        const userRole = 'user'; 

        const insertUserQuery = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
        await db.query(insertUserQuery, [username, email, hashedPassword, userRole]);

        res.status(201).json({ message: "User registered successfully!" });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Server error during registration." });
    }
};

// Login User (Updated to include business_id in token)
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Please enter all fields" });
    }
    try {
        // business_id bhi select kar rahe hain
        const findUserQuery = "SELECT id, username, email, password, role, business_id FROM users WHERE email = ?";
        const [users] = await db.query(findUserQuery, [email]);

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        
        // business_id ko token mein add kar rahe hain
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            business_id: user.business_id 
        };

        const secretKey = process.env.JWT_SECRET || 'your_super_secret_key_12345'; 
        const token = jwt.sign(payload, secretKey, { expiresIn: '8h' });

        res.json({
            message: "Logged in successfully!",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                business_id: user.business_id
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error during login." });
    }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
    const { username, email } = req.body;
    const userId = req.user.id;

    if (!username || !email) {
        return res.status(400).json({ message: "Username and Email are required." });
    }

    try {
        const query = "UPDATE users SET username = ?, email = ? WHERE id = ?";
        const [result] = await db.query(query, [username, email, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        
        res.status(200).json({ message: "Profile updated successfully." });

    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ error: "Server error during profile update." });
    }
};

// Change Password
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "All password fields are required." });
    }

    try {
        const findUserQuery = "SELECT password FROM users WHERE id = ?";
        const [users] = await db.query(findUserQuery, [userId]);
        const user = users[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect old password." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updatePasswordQuery = "UPDATE users SET password = ? WHERE id = ?";
        await db.query(updatePasswordQuery, [hashedPassword, userId]);

        res.status(200).json({ message: "Password changed successfully." });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ error: "Server error during password change." });
    }
};

// Get All Users (for Admin)
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, username, email, role FROM users ORDER BY username ASC");
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error fetching users." });
    }
};

// Update User Role (for Admin)
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { id } = req.params;

        if (role !== 'user' && role !== 'admin') {
            return res.status(400).json({ message: "Invalid role specified." });
        }

        const [result] = await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User role updated successfully" });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Server error updating role." });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateUserProfile,
    changePassword,
    getAllUsers,
    updateUserRole,
};