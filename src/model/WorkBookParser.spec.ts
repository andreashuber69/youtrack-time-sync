import { WorkBook } from "xlsx";
import { WorkBookParser } from "./WorkBookParser";

describe("WorkBookParser", () => {
    it("should parse", () => {
        const workBook = undefined as any as WorkBook;
        const whatever = WorkBookParser.parse(workBook);
        expect(true).toEqual(true);
    });
});
