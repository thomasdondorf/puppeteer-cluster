
class Display {

    constructor() {
        this.lastLinesCount = 0;
        this.linesCount = 0;
    }

    async log(str) {
        const strToLog = str.substr(0, 78);
        console.log('\x1B[K' + strToLog);
        this.linesCount++;
    }

    async resetCursor() {
        // move cursor up to draw over out output
        process.stdout.write(`\x1B[${this.linesCount}A`);
        this.lastLinesCount = this.linesCount;
        this.linesCount = 0;
    }

    close() {
        // move cursor down so that console output stays
        process.stdout.write(`\x1B[${this.lastLinesCount}B`);
    }

}

module.exports = Display;
