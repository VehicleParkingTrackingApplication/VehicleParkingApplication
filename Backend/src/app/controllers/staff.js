import User from '../models/User.js';
import bcrypt from 'bcryptjs';

class staffController {

// POST /api/staff/create
async create(req, res) {
    try {
        const data = {
            username: req.body.username,
            password: req.body.password,
            role: 'staff'
        };

        // validate input
        if (!data.username || !data.password) {
            return res.staus(400).json({ 'message': 'Username & password & confirmed password are required.' });
        }

        // Check if username taken
        const existingUser = await User.findOne({username: data.username})
        if (existingUser) {
            return res.status(400).json({
                'message': 'Username taken, please choose a different one.'
            });
        }

        // Add new account to database
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
            data.password = hashedPassword;
            await User.insertMany(data);
            return res.status(201).json({ 'message': 'User created successfully.' });
        } catch(err) {
            return res.status(500).json({ 'message': err.message });
        }

    } catch(err) {
        return res.status(500).json({
            status: 500,
            message: err.message
        });
    }
}

}

export default new staffController();