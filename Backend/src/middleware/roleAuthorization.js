const roleAutorization = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role))
            return res.status(403).json({ message: "Access denied. You are not authorized to access this resource." });
        next();
    };
};
export default roleAutorization;