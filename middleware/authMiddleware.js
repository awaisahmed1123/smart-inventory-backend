const jwt = require('jsonwebtoken');

// Yeh guard check karta hai ke user login hai ya nahi
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secretKey = 'your_super_secret_key_12345';
            const decoded = jwt.verify(token, secretKey);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Naya VVIP Guard: Yeh check karta hai ke user Admin hai ya nahi
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Agar user Admin hai, to aage jane do
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' }); // Forbidden
    }
};

module.exports = { protect, adminOnly }; // Naye guard ko export karen