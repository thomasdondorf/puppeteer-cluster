
const CLEAR_LINE = '\x1B[K';

export default class Display {

    private lastLinesCount: number = 0;
    private linesCount: number = 0;

    public async log(str: string) : Promise<void> {
        // We create an empty line at the start so that any console.log calls
        // from within the script are above our output.
        if (this.linesCount === 0) {
            console.log(CLEAR_LINE); // erases the current line
            this.linesCount += 1;
        }

        // Strip lines that are too long
        const strToLog = str.substr(0, 78);
        console.log(`${CLEAR_LINE}${strToLog}`);
        this.linesCount += 1;
    }

    public async resetCursor() : Promise<void> {
        // move cursor up to draw over out output
        process.stdout.write(`\x1B[${this.linesCount}A`);
        this.lastLinesCount = this.linesCount;
        this.linesCount = 0;
    }

    public close() : void {
        // move cursor down so that console output stays
        process.stdout.write(`\x1B[${this.lastLinesCount}B`);
    }

}
