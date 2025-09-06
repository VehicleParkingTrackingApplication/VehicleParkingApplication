import { handleLogin, handleRegister, handleRefresh } from '../services/auth.js';
import User from '../models/User.js';

class authController {
    // POST /api/auth/login
    async login(req, res) {
        const result = await handleLogin(req, res);
        if (result.status === 200) {
            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production',
                secure: true,
                sameSite: 'Strict',
                maxAge: 90 * 24 * 60 * 60 * 1000 // 3 months
            });
            res.json({
                message: 'Login successful',
                accessToken: result.accessToken,
                role: result.role
            });        
        } else {
            return res.status(result.status).json({ message: result.message });
        }
    }

    // POST /api/auth/register
    async register(req, res) {
        try {
            const registrationResult = await handleRegister(req, res);
            // Check if registration was successful by checking if response was already sent
            if (res.headersSent) {
                return; // Registration was successful, response already sent
            }
            
            // After successful registration, log the user in
            const result = await handleLogin(req, res);
            if (result.status === 200) {
                res.json({
                    message: 'Registration and login successful',
                    accessToken: result.accessToken
                });
            } else {
                return res.status(result.status).json({ message: result.message });
            }
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
    
    // POST /api/auth/logout
    async logout(req, res) {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            sameSite: 'Strict'
        });
        
        return res.status(200).json({
            message: 'Logged out successfully'
        });
    }

    // GET /api/auth/me
    async me(req, res) {
        try {
            // req.user is set by the requireAuth middleware
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const user = await User.findById(req.user.id).select('-password -loggedSessions');
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                businessId: user.businessId,
                createAt: user.createAt,
                updateAt: user.updateAt
            });

        } catch (err) {
            return res.status(500).json({
                status: 500,
                message: err.message
            });
        }
    }
}

export default new authController();
