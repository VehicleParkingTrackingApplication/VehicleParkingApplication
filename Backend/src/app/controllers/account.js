// import User from '../models/User.js';


class account {
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

    // async getCurrentUser(req, res) {
    //     try {
    //         const user = await User.findById(req.user.id).select('-password');
    //         if (!user) {
    //             return res.status(404).json({ message: 'User not found' });
    //         }
    //         res.json({ user });
    //     } catch (error) {
    //         res.status(500).json({ message: 'Error fetching user data' });
    //     }
    // }
}

export default new account();
