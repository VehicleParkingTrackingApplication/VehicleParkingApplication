class NewsController {
    index(req, res) {
        res.render('news');
    }
    show(req, res) {
        res.render('news_show');
    }
}

// module.exports = new NewsController();
export default new NewsController;