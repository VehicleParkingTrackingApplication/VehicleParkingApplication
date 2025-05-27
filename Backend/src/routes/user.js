import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import roleAuthorization from '../middleware/roleAuthorization.js';

const router = express.Router();

// Only admin can access this router
router.get('/admin', verifyJWT, roleAuthorization('admin'), (req, res) => {
    res.json({ message: 'Admin page' });
});

// Both admin and manager can access this router
router.get('/manager', verifyJWT, roleAuthorization('manager'), (req, res) => {
    res.send({ message: 'Manager page' });
});

// ALl can access this router
router.get('/user', verifyJWT, roleAuthorization('user'), (req, res) => {
    res.send({ message: 'User page' });
});

export default router;