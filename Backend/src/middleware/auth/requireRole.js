const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('User role:', req.user.role);
        console.log('Allowed roles:', allowedRoles);
        
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "No role information found" });
        }

        if (!allowedRoles.includes(req.user.role.toLowerCase())) {
            return res.status(403).json({ message: "Access denied. You are not authorized to access this resource." });
        }
        next();
    };
};

export default requireRole;