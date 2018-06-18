
export default class Display {

    private lastLinesCount: number = 0;
    private linesCount: number = 0;

    async log(str: string) : Promise<void> {
        const strToLog = str.substr(0, 78);
        console.log('\x1B[K' + strToLog);
        this.linesCount++;
    }

    async resetCursor() : Promise<void> {
        // move cursor up to draw over out output
        process.stdout.write(`\x1B[${this.linesCount}A`);
        this.lastLinesCount = this.linesCount;
        this.linesCount = 0;
    }

    close() : void {
        // move cursor down so that console output stays
        process.stdout.write(`\x1B[${this.lastLinesCount}B`);
    }

}
