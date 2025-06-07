<<<<<<< HEAD
import User from '../models/userSchema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const handleNewUser = async (req, res) => {
    const data = { 
        username: req.body.username, 
        password: req.body.password,
        confirmedPassword: req.body.confirmedPassword,
        role: 'admin'
    };
    if (!data.username || !data.password || !data.confirmedPassword) {
        return res.status(400).json({ 'message': 'Username & password & confirmed password are required.' });
    }
    // Check whether the usernaem already exists in database
    const existingUser = await User.findOne({username: data.username})
    if (existingUser) {
        return res.status(400).json({ 'message': 'User already exists. Please choose a different username.' });
    } else if (data.password !== data.confirmedPassword) {
        return res.status(400).json({ 'message': 'Password and confirmed password do not match.' });
    }
    try {
        // if username is not exist, then hash the password and save to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword;
        await User.insertMany(data);
    } catch (err) {
        return res.status(500).json({ 'message': err.message });
    }
}

const handleLogin = async (req, res) => {
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
        userId: currentUser._id,
        businessId: currentUser.business_id,
        role: currentUser.role
    };
    const token = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h'}
    );

    return { 
        status: 200, 
        message: 'Login successful',
        token
    };
}
// Session: save in file, redis, memcache (sync disk), database, etc.
// const sessions = {};
class authController {
    login(req, res) {
        res.render('homepage/login');
    }
    async loginPost(req, res) {
=======
import { handleLogin, handleRegister, handleRefresh } from '../services/authService.js';

class AuthController {
    // POST /api/auth/login
    async login(req, res) {
>>>>>>> main
        const result = await handleLogin(req, res);
        if (result.status === 200) {
            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 90 * 24 * 60 * 60 * 1000 // 3 months
            });
            
            res.json({
                message: 'Login successful',
                accessToken: result.accessToken
            });        } else {
            return res.status(result.status).json({ message: result.message });
        }
    }

    // POST /api/auth/register
    async register(req, res) {
        try {
<<<<<<< HEAD
            await handleNewUser(req, res);
            return res.status(201).json({
                status: 201,
                message: 'Registration successful'
            });
=======
            const registrationResult = await handleRegister(req, res);
            // Check if registration was successful by checking if response was already sent
            if (res.headersSent) {
                return; // Registration was successful, response already sent
            }
            
            // After successful registration, log the user in
            const result = await handleLogin(req, res);
            if (result.status === 200) {
                res.cookie('refreshToken', result.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Strict',
                    maxAge: 90 * 24 * 60 * 60 * 1000 // 3 months
                });
                
                res.json({
                    message: 'Registration and login successful',
                    accessToken: result.accessToken
                });
            } else {
                return res.status(result.status).json({ message: result.message });
            }
>>>>>>> main
        } catch (err) {
            return res.status(500).json({ 
                status: 500,
                message: err.message 
            });
        }
    }    
    
    // POST /api/auth/refresh
    async refresh(req, res) {
        const result = await handleRefresh(req, res);
        return res.status(result.status).json({
            message: result.message,
            ...(result.accessToken && { accessToken: result.accessToken })
        });
    }
<<<<<<< HEAD
    logout(req, res) {

        res.clearCookie('token');
=======
    
    // POST /api/auth/logout
    async logout(req, res) {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });
>>>>>>> main
        
        return res.status(200).json({
            message: 'Logged out successfully'
        });
    }
}

export default new authController();
