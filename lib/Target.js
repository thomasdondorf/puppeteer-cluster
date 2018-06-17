
class Target {

    constructor(url, context = {}) {
        this.url = url;
        this.context = context;
    }

    setError(error) {
        this.error = error;
    }

}

module.exports = Target;
