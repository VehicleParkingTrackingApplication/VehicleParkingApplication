import User from '../models/User.js';
class siteController {

    search(req, res) {
        res.render('homepage/search');
    }
    login(req, res) {
        console.log("CHECK LOGIN")
        res.render('homepage/login');
    }
    register(req, res) {
        // const data = {
        //     username: req.body.username,
        //     password: req.body.password,
        //     confirmedPassword: req.body.confirmedPassword
        // }
        // console.log(req.body);
        res.render('homepage/register');
    }
    show(req, res) {
        res.render('homepage/show');
    }
    async index(req, res) {
        // try {
        //     const userData = await Teacher.find();
        //     console.log(userData);
        //     // res.json(userData);
        //     // return
        // }
        // catch (error) {
        //     console.error(error);
        //     res.status(400).json({error: 'Server Error!!!'});
        // }
        const userData = await User.find();
        // res.json(userData);
        res.render('homepage/home');
    }
}

// module.exports = new NewsController();
export default new siteController();