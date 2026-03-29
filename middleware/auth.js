// ===================================
// Authentication Middleware
// ===================================

const jwt = require('jsonwebtoken');

/**
 * Verify JWT Token
 */
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            error: 'Kein Token bereitgestellt'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Ungültiges oder abgelaufenes Token'
        });
    }
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Zugriff verweigert. Admin-Rechte erforderlich.'
        });
    }
    next();
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token invalid but continue anyway
        }
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    optionalAuth
};
