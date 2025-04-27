// import User from '../models/User.js';

class AccountController {
    async index(req, res) {
        const user = req.session.checkUsername;
        if (!user) {
            return res.redirect('/account/login');
        }
        return res.render('account', { 
            checkUsername: req.session.checkUsername,
            user
        });
    }
}

export default new AccountController();
