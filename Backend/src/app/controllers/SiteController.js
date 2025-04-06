class siteController {
    index(req, res) {
        res.render('homepage/home');
    }
    search(req, res) {
        res.render('homepage/search');
    }
    login(req, res) {
        res.render('homepage/login');
    }
    login(req, res) {
        res.render('homepage/login');
    }
    show(req, res) {
        res.render('homepage/show');
    }
}

// module.exports = new NewsController();
export default new siteController();