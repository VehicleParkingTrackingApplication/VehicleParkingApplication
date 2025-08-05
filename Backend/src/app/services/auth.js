import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const handleRegister = async (req, res) => {
    const data = { 
        username: req.body.username, 
        password: req.body.password,
        role: 'admin'
    };
    if (!data.username || !data.password) {
        return res.status(400).json({ 'message': 'Username & password & confirmed password are required.' });
    }
    // Check whether the usernaem already exists in database
    const existingUser = await User.findOne({username: data.username})
    if (existingUser) {
        return res.status(400).json({ 'message': 'User already exists. Please choose a different username.' });
    }
    try {
        // if username is not exist, then hash the password and save to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword;
        await User.insertMany(data);
        return res.status(201).json({ 'message': 'User created successfully.' });
    } catch (err) {
        return res.status(500).json({ 'message': err.message });
    }
}

export const handleLogin = async (req, res) => {
    const data = { 
        username: req.body.username, 
        password: req.body.password
    };
    if (!data.username || !data.password) {
        return { 
            status: 400, 
            message: 'Please enter username and password.' 
        };
    }
    const currentUser = await User.findOne({ username: data.username});
    if (!currentUser) {
        return { 
            status: 400, 
            message: 'Username does not exist. Please register first.' 
        };
    }
    // Check whether the password is correct
    const checkPassword = bcrypt.compare(
        data.password,
        currentUser.password
    );
    if (!checkPassword) {
        return { 
            status: 400, 
            message: 'Password is incorrect. Please try again.' 
        };
    }
    
    const payload = {
        id: currentUser._id.toString(),
        businessId: currentUser.businessId,
        role: currentUser.role
    };

    // Generate access token (15 minutes)
    const accessToken = jwt.sign(
        {
            ...payload,
            type: 'access',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 1 day
            // exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
        },
        process.env.ACCESS_TOKEN_SECRET
    );
    
    // Generate refresh token (3 months)
    const refreshToken = jwt.sign(
        {
            ...payload,
            type: 'refresh',
            exp: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 3 months
        },
        process.env.REFRESH_TOKEN_SECRET
    );

    return { 
        status: 200, 
        message: 'Login successful',
        accessToken,
        refreshToken,
        role: currentUser.role
    };
}

export const handleRefresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        return {
            status: 401,
            message: 'Refresh token not found'
        };
    }
    
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        // Verify it's a refresh token
        if (decoded.type !== 'refresh') {
            return {
                status: 401,
                message: 'Invalid token type'
            };        }
        
        // Generate new access token
        const payload = {
            role: decoded.role,
            id: decoded.id
        };
        
        const newAccessToken = jwt.sign(
            {
                ...payload,
                type: 'access',
                exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
            },
            process.env.ACCESS_TOKEN_SECRET
        );
        
        return {
            status: 200,
            message: 'Token refreshed successfully',
            accessToken: newAccessToken
        };
    } catch (err) {
        return {
            status: 401,
            message: 'Invalid refresh token'
        };
    }
}