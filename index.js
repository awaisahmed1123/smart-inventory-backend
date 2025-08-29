const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Yeh line zaroori hai .env file ko parhne ke liye

// Controllers se tamam functions ko import karein
const { 
    registerUser, loginUser, updateUserProfile, 
    changePassword, getAllUsers, updateUserRole 
} = require('./auth');
const { createSale, getAllSales, getSaleById } = require('./sales');
const { getSalesReport, getSalesOverTime } = require('./reports');
const { getAllSuppliers, addSupplier, updateSupplier, deleteSupplier } = require('./suppliers');
const { getAllCustomers, addCustomer, updateCustomer, deleteCustomer } = require('./customers');
const { getBusinessSettings, updateBusinessSettings, factoryReset } = require('./settingsController');
const { 
    getAllProducts, getLowStockProducts, addProduct, 
    bulkAddProducts, updateProduct, deleteProduct 
} = require('./productController');
const { getDashboardData } = require('./dashboardController');

// Middleware
const { protect, adminOnly } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// =======================================================
//                  API ROUTES
// =======================================================

// --- Public Routes ---
app.get('/', (req, res) => res.json({ message: "Smart Inventory Backend is running!" }));
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

// --- User & Settings Routes ---
app.put('/api/users/profile', protect, updateUserProfile);
app.put('/api/users/change-password', protect, changePassword);
app.get('/api/settings/business', protect, getBusinessSettings);
app.put('/api/settings/business', protect, adminOnly, updateBusinessSettings);
app.post('/api/settings/factory-reset', protect, adminOnly, factoryReset);

// --- User Management Routes (for Admin) ---
app.get('/api/users', protect, adminOnly, getAllUsers);
app.put('/api/users/:id/role', protect, adminOnly, updateUserRole);

// --- Dashboard Route ---
app.get('/api/dashboard', protect, getDashboardData);

// --- Sales & Reports Routes ---
app.post('/api/sales', protect, createSale);
app.get('/api/sales', protect, getAllSales);
app.get('/api/sales/:id', protect, getSaleById);
app.get('/api/reports/sales', protect, getSalesReport);
app.get('/api/reports/sales-over-time', protect, getSalesOverTime);

// --- Product Routes ---
app.get('/api/products', protect, getAllProducts);
app.get('/api/products/low-stock', protect, getLowStockProducts);
app.post('/api/products', protect, adminOnly, addProduct);
app.post('/api/products/bulk', protect, adminOnly, bulkAddProducts);
app.put('/api/products/:id', protect, adminOnly, updateProduct);
app.delete('/api/products/:id', protect, adminOnly, deleteProduct);

// --- Customer Routes ---
app.get('/api/customers', protect, getAllCustomers);
app.post('/api/customers', protect, adminOnly, addCustomer);
app.put('/api/customers/:id', protect, adminOnly, updateCustomer);
app.delete('/api/customers/:id', protect, adminOnly, deleteCustomer);

// --- Supplier Routes ---
app.get('/api/suppliers', protect, adminOnly, getAllSuppliers);
app.post('/api/suppliers', protect, adminOnly, addSupplier);
app.put('/api/suppliers/:id', protect, adminOnly, updateSupplier);
app.delete('/api/suppliers/:id', protect, adminOnly, deleteSupplier);


app.listen(PORT, () => {
    console.log(`Server port ${PORT} par shuru ho gaya hai...`);
});