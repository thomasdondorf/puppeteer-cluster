"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const CLEAR_LINE = '\x1B[K';
class Display {
    constructor() {
        this.lastLinesCount = 0;
        this.linesCount = 0;
    }
    log(str) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    resetCursor() {
        return __awaiter(this, void 0, void 0, function* () {
            // move cursor up to draw over out output
            process.stdout.write(`\x1B[${this.linesCount}A`);
            this.lastLinesCount = this.linesCount;
            this.linesCount = 0;
        });
    }
    close() {
        // move cursor down so that console output stays
        process.stdout.write(`\x1B[${this.lastLinesCount}B`);
    }
}
exports.default = Display;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzcGxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9EaXNwbGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQ0EsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDO0FBRTVCLE1BQXFCLE9BQU87SUFBNUI7UUFFWSxtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUMzQixlQUFVLEdBQVcsQ0FBQyxDQUFDO0lBNEJuQyxDQUFDO0lBMUJnQixHQUFHLENBQUMsR0FBVzs7WUFDeEIscUVBQXFFO1lBQ3JFLCtDQUErQztZQUMvQyxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssQ0FBQyxFQUFFO2dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO2dCQUNuRCxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQzthQUN4QjtZQUVELGdDQUFnQztZQUNoQyxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxHQUFHLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUM7UUFDekIsQ0FBQztLQUFBO0lBRVksV0FBVzs7WUFDcEIseUNBQXlDO1lBQ3pDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7S0FBQTtJQUVNLEtBQUs7UUFDUixnREFBZ0Q7UUFDaEQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztJQUN6RCxDQUFDO0NBRUo7QUEvQkQsMEJBK0JDIn0=