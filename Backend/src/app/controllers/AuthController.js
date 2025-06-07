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
        const result = await handleLogin(req, res);
        if (result.status === 200) {
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 60 * 60 * 1000 // 1 hour
            });
            res.json({
                message: 'Login successful',
                token: result.token
            });
        } else {
            return res.status(result.status).json({ message: result.message });
        }
    }
    async register(req, res) {
        res.render('homepage/register');
    }
    async registerPost(req, res) {
        try {
            await handleNewUser(req, res);
            return res.status(201).json({
                status: 201,
                message: 'Registration successful'
            });
        } catch (err) {
            return res.status(500).json({ 
                status: 500,
                message: err.message 
            });
        }
    }
    logout(req, res) {

        res.clearCookie('token');
        
        req.session.destroy((err) => {
            if (err) 
                return res.redirect('/');
            res.clearCookie('connect.sid');
            res.redirect('/auth/login');
        });
    }
}

export default new authController();
