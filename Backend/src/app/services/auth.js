import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const handleRegister = async (req, res) => {
    const data = { 
        username: req.body.username, 
        password: req.body.password,
        email: req.body.email,
        businessId: req.body.businessId,
        role: req.body.role || 'user'
    };
    if (!data.username || !data.password || !data.email || !data.businessId) {
        return { status: 400, message: 'Username, email, password, and businessId are required.' };
    }
    // Check whether the username already exists in database
    const existingUserByUsername = await User.findOne({username: data.username});
    if (existingUserByUsername) {
        return { status: 400, message: 'Username already exists. Please choose a different username.' };
    }
    // Check whether the email already exists in database
    const existingUserByEmail = await User.findOne({email: data.email});
    if (existingUserByEmail) {
        return { status: 400, message: 'Email already exists. Please use a different email.' };
    }
    try {
        // Hash the password and save to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword;
        await User.insertMany(data);
        return { status: 201, message: 'User created successfully.' };
    } catch (err) {
        return { status: 500, message: err.message };
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
    const isPasswordCorrect = await bcrypt.compare(
        data.password,
        currentUser.password
    );
    if (!isPasswordCorrect) {
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

    // Generate access token (1 day)
    const accessToken = jwt.sign(
        {
            ...payload,
            type: 'access',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        },
        process.env.ACCESS_TOKEN_SECRET
    );
    
    // Generate refresh token (3 months)
    const refreshToken = jwt.sign(
        {
            ...payload,
            type: 'refresh',
            exp: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
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