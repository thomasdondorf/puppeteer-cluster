
class Display {

    constructor() {
        this.linesCount = 0;
    }

    async log(str) {
        const strToLog = str.substr(0, 78);
        console.log('\x1B[K' + strToLog);
        this.linesCount++;
    }

    async resetCursor() {
        process.stdout.write(`\x1B[${this.linesCount}A`);
        this.linesCount = 0;
    }

}

module.exports = Display;
