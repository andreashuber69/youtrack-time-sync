module.exports = {
    // publicPath needs to be set differently depending on whether we build for actual deployment (e.g. on github gh-pages)
    // or for local production mode testing. The following uses an exported environment variable to do just that.
    // Obviously, this needs to bet set accordingly before building for deployment. 
    publicPath: process.env.WEBPACK_BASE_URL ? process.env.WEBPACK_BASE_URL : "/",
}
