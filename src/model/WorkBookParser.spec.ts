import { read } from "xlsx";
import { WorkBookParser } from "./WorkBookParser";

const readBlob = (blob: Blob) =>
    new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(reader.result as ArrayBuffer);
        reader.onerror = (ev) => reject("Unable to read file.");
        reader.readAsArrayBuffer(blob);
    });

const loadTestSheet = async (name: string) => {
    const url = `https://raw.githubusercontent.com/andreashuber69/youtrack-time-sync/master/src/model/test/${name}`;
    let response: Response;

    try {
        response = await window.fetch(url);
    } catch (e) {
        throw new Error(`Network Error: ${e}`);
    }

    if (!response.ok) {
        throw new Error(`Response Status: ${response.status} ${response.statusText}`);
    }

    return read(new Uint8Array(await readBlob(await response.blob())), { type: "array" });
};

describe("WorkBookParser.parse", () => {
    it("should parse work book without week sheets", async () => {
        const workBook = await loadTestSheet("NoWeekSheets.xlsm");
        const times = [ ...WorkBookParser.parse(workBook) ];
        expect(times).toEqual([]);
    });
});
