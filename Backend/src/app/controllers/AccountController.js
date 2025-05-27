import User from '../models/User.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const handleNewUser = async (req, res) => {
    const data = { 
        username: req.body.username, 
        password: req.body.password,
        confirmedPassword: req.body.confirmedPassword,
        role: { 'User': 2001 }
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
        return res.status(201).json({ 'message': 'User created successfully' });
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
        return res.status(400).json({ message: 'Please enter username and password.' });
    }

    // Check whether the usernaem already exists in database
    const existingUser = await User.findOne({username: data.username})
    if (!existingUser) {
        return res.send('User does not exist. Please register first.');
    }

    // Check whether the password is correct
    const checkUsername = await User.findOne({ username: data.username});
    console.log('checkUsername', checkUsername);
    if (!checkUsername) {
        res.send('Username does not exist. Please register first.');
    } else {
        const checkPassword = bcrypt.compare(
            data.password,
            checkUsername.password
        );
        if (!checkPassword) {
            return res.send('Password is incorrect. Please try again.');
        }

        // Generate JWTs
        // const accessToken = jwt.sign(
        //     { user: checkUsername.userName},
        //     process.env.ACCESS_TOKEN_SECRET, 
        //     { expiresIn: '5m' }
        // );
        // const refreshToken = jwt.sign(
        //     { user: checkUsername.userName},
        //     process.env.REFRESH_TOKEN_SECRET, 
        //     { expiresIn: '1d' }
        // );
        const token = jwt.sign(
            { id: checkUsername.id, role: checkUsername.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h'}
        );

        return res.status(200).json({ token });
        // return res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        // return res.redirect('/account');
        // req.session.checkUsername = checkUsername;
    }
}

class AccountController {
    async index(req, res) {
        res.json({message: "Hello account"});
        const user = req.session.checkUsername;
        if (!user) {
            return res.redirect('/account/login');
        }
        return res.render('account', { 
            checkUsername: req.session.checkUsername,
            user: user
        });
    }
    login(req, res) {
        res.render('homepage/login');
    }
    async loginPost(req, res) {
        const result = await handleLogin(req, res);
        if (result && result.status === 200) {
            // req.session.checkUsername = checkUsername;
            res.redirect('/');
        } else {
            res.send('Incorrect password. Please try again.');
        }
    }
    async register(req, res) {
        res.render('homepage/register');
    }
    async registerPost(req, res) {
        try {
            const result = await handleNewUser(req, res);
            if (result && result.status === 201) {
                res.redirect('/account/login', result);
            }
            res.redirect('/account/register');
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
    logout(req, res) {
        req.session.destroy((err) => {
            if (err) 
                return res.redirect('/');
            res.clearCookie('connect.sid');
            res.redirect('/account/login');
        });
    }
}

export default new AccountController();
