import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No authorization header.' });
    }

    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            message: 'Access token required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Verify it's an access token
        if (decoded.type !== 'access') {
            return res.status(401).json({ 
                message: 'Invalid token type' 
            });
        }

        // Add user info to request object
        // TODO: Reimplement on all controller, user is now an object. use user.id, user.role
        req.user = {
            id: decoded.id,
            businessId: decoded.businessId,
            role: decoded.role
        };


        next();
    } catch (err) {
        return res.status(401).json({ 
            message: 'Invalid or expired token' 
        });
    }
};

export default requireAuth;