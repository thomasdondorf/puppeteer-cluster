import Display from '../src/Display';

describe('Display', () => {
    let write: any;
    let log: any;
    let output = '';

    function cleanup() {
        process.stdout.write = write;
        console.log = log;
    }

    beforeEach(() => {
        output = '';
        write = process.stdout.write;
        log = console.log;

        (process.stdout.write as any) = (str: string) => {
            output += str;
        };

        console.log = (str: string) => {
            output += `${str}\n`;
        };
    });

    // restore after each test
    afterEach(cleanup);

    it('should keep the first line empty', async () => {
        const display = new Display();
        // first line empty
        display.log('line two');
        display.log('line three');

        const numberOfLines = (output.match(/\n/g) || []).length;
        expect(numberOfLines).toBe(3);
    });

    it('resetCursor moves the cursor to the top', async () => {
        const display = new Display();
        // first line empty
        display.log('line two');
        display.log('line three');

        output = '';
        display.resetCursor();

        expect(output).toBe('\x1B[3A');
    });

    it('close moves the cursor down', async () => {
        const display = new Display();
        // first line empty
        display.log('line two');
        display.log('line three');

        display.resetCursor();
        output = '';
        display.close();

        expect(output).toBe('\x1B[3B');
    });
});
