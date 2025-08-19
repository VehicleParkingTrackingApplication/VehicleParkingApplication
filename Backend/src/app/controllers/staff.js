import User from '../models/User.js';
import bcrypt from 'bcryptjs';

class staffController {

// POST /api/staff/create-staff
async create(req, res) {
    try {
        const data = {
            username: req.body.username,
            password: req.body.password,
            role: req.body.role || 'staff',
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            businessId: req.body.businessId
        };

        // validate input
        if (!data.username || !data.password || !data.firstName || !data.lastName || !data.email) {
            return res.status(400).json({ 'message': 'Username, password, firstName, lastName, and email are required.' });
        }

        // Validate role
        if (data.role && !['admin', 'staff'].includes(data.role)) {
            return res.status(400).json({ 'message': 'Role must be either "admin" or "staff".' });
        }

        // Check if username taken
        const existingUser = await User.findOne({username: data.username})
        if (existingUser) {
            return res.status(400).json({
                'message': 'Username taken, please choose a different one.'
            });
        }

        // Check if email taken
        const existingEmail = await User.findOne({email: data.email})
        if (existingEmail) {
            return res.status(400).json({
                'message': 'Email already registered, please use a different one.'
            });
        }

        // Add new account to database
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
            data.password = hashedPassword;
            await User.insertMany(data);
            return res.status(201).json({ 'message': 'Staff user created successfully.' });
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

// PUT /api/staff/update-staff
async update(req, res) {
    try {
        const { userId, username, firstName, lastName, email, businessId } = req.body;

        // validate input
        if (!userId) {
            return res.status(400).json({ 'message': 'User ID is required.' });
        }

        // Check if user exists and is a staff member
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ 'message': 'User not found.' });
        }

        if (existingUser.role !== 'staff') {
            return res.status(403).json({ 'message': 'Can only update staff users.' });
        }

        // Business-level permission check (optional - if you want to restrict admins to their own business)
        // if (req.user.businessId && existingUser.businessId.toString() !== req.user.businessId.toString()) {
        //     return res.status(403).json({ 'message': 'You can only update staff in your own business.' });
        // }

        // Prepare update data
        const updateData = {};
        if (username) updateData.username = username;
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (businessId) updateData.businessId = businessId;
        updateData.updateAt = new Date();

        // Check if new username is taken (if provided)
        if (username && username !== existingUser.username) {
            const usernameTaken = await User.findOne({ username: username });
            if (usernameTaken) {
                return res.status(400).json({ 'message': 'Username taken, please choose a different one.' });
            }
        }

        // Check if new email is taken (if provided)
        if (email && email !== existingUser.email) {
            const emailTaken = await User.findOne({ email: email });
            if (emailTaken) {
                return res.status(400).json({ 'message': 'Email already registered, please use a different one.' });
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({ 
            'message': 'Staff user updated successfully.',
            'user': {
                id: updatedUser._id,
                username: updatedUser.username,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                role: updatedUser.role,
                businessId: updatedUser.businessId
            }
        });

    } catch(err) {
        return res.status(500).json({
            status: 500,
            message: err.message
        });
    }
}

// DELETE /api/staff/delete-staff
async remove(req, res) {
    try {
        const { userId } = req.body;

        // validate input
        if (!userId) {
            return res.status(400).json({ 'message': 'User ID is required.' });
        }

        // Check if user exists and is a staff member
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ 'message': 'User not found.' });
        }

        if (existingUser.role !== 'staff') {
            return res.status(403).json({ 'message': 'Can only delete staff users.' });
        }

        // Prevent self-deletion
        if (userId === req.user._id.toString()) {
            return res.status(403).json({ 'message': 'You cannot delete your own account.' });
        }

        // Business-level permission check (optional - if you want to restrict admins to their own business)
        // if (req.user.businessId && existingUser.businessId.toString() !== req.user.businessId.toString()) {
        //     return res.status(403).json({ 'message': 'You can only delete staff in your own business.' });
        // }

        // Delete user
        await User.findByIdAndDelete(userId);

        return res.status(200).json({ 'message': 'Staff user deleted successfully.' });

    } catch(err) {
        return res.status(500).json({
            status: 500,
            message: err.message
        });
    }
}

// GET /api/staff/list-staff
async list(req, res) {
    try {
        const { businessId, page = 1, limit = 10 } = req.query;
        
        // Build query filter
        const filter = { role: 'staff' };
        
        // Add business filter if provided
        if (businessId) {
            filter.businessId = businessId;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get staff members with pagination
        const staffMembers = await User.find(filter)
            .select('-password -loggedSessions') // Exclude sensitive fields
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalStaff = await User.countDocuments(filter);

        return res.status(200).json({
            'message': 'Staff members retrieved successfully.',
            'staff': staffMembers,
            'pagination': {
                'currentPage': parseInt(page),
                'totalPages': Math.ceil(totalStaff / limit),
                'totalStaff': totalStaff,
                'limit': parseInt(limit)
            }
        });

    } catch(err) {
        return res.status(500).json({
            status: 500,
            message: err.message
        });
    }
}

}

export default new staffController();