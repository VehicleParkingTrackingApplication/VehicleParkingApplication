import User from '../models/User.js';
import Camera_Data from '../models/CameraData.js';
import bcrypt from 'bcrypt';
import importCSVData from '../../utils/dataImport.js';

class siteController {
    async index(req, res, next) {
        // const userData = await User.find();
        // res.json(userData);
        res.render('homepage/home');
        // User.find({})
        //     .then(userData => res.render('homepage/home'))
        //     .catch(next);
    }

    // search(req, res) {
    //     res.render('homepage/search');
    // }
    login(req, res) {
        res.render('homepage/login');
    }
    async loginPost(req, res) {
        const data = {
            username: req.body.username,
            password: req.body.password
        }
        // Check whether the username and password are correct
        const checkUsername = await User.findOne({ userName: data.username});
        if (!checkUsername) {
            res.send("Username does not exist. Please register first.");
        } else {
            const checkPassword = bcrypt.compare(data.password, checkUsername.password);
            if (checkPassword) {
                req.session.user = checkUsername;
                res.redirect('/');
            } else {
                res.send("Incorrect password. Please try again.");
            }
        }
    }
    register(req, res) {
        res.render('homepage/register');
    }
    async registerPost(req, res) {
        const data = {
            userName: req.body.username,
            password: req.body.password
        }
        // Check whether the usernaem already exists in database
        const existingUser = await User.findOne({ userName: data.userName });
        if (existingUser) {
            res.send("User already exists. Please choose a different username.");
        } else {
            // if username is not exist, then hash the password and save to the database
            const saltRounds = 10;
            const hashedPassword  = await bcrypt.hash(data.password, saltRounds);
            data.password = hashedPassword;

        }
        const userData = await User.insertMany(data)
        res.redirect('/login');
    }
    async importData(req, res) {
        try {
            const filename = req.query.file || '2025-04-02.csv';
            const results = await importCSVData(filename);
            console.log(results);
            const cameraDataImport = await Camera_Data.insertMany(results);

            // res.json({ success: true, count: results.length });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
        // const cameraData = await Camera_Data.find();
        // res.json(cameraData);
        res.render('homepage/register')
    }
    show(req, res) {
        res.render('homepage/show');
    }

}

// module.exports = new NewsController();
export default new siteController();