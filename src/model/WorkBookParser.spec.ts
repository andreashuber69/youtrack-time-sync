import { read } from "xlsx";
import { ISpentTime } from "./ISpentTime";
import { WorkBookParser } from "./WorkBookParser";

const readBlob = (blob: Blob) =>
    new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(reader.result as ArrayBuffer);
        reader.onerror = (ev) => reject("Unable to read file.");
        reader.readAsArrayBuffer(blob);
    });

const loadTestSheet = async (name: string) => {
    const root = "https://raw.githubusercontent.com/andreashuber69/youtrack-time-sync/master";
    const url = `${root}/src/model/WorkBookParser.spec/${name}`;
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

const expectResult = (expectation: string, workBookName: string, expected: ISpentTime[]) => {
    it(expectation, async () => {
        const workBook = await loadTestSheet(workBookName);
        expect([ ...WorkBookParser.parse(workBook) ]).toEqual(expected);
    });
};

const expectError = (expectation: string, workBookName: string, message: string) => {
    it(expectation, async () => {
        const workBook = await loadTestSheet(workBookName);
        expect(() => [ ...WorkBookParser.parse(workBook) ]).toThrowError(message);
    });
};

describe("WorkBookParser.parse", () => {
    expectResult("should parse work book without week sheets", "NoWeekSheets.xlsm", []);

    expectError("should fail to parse an empty sheet", "Empty.xlsm", "The sheet Week01 seems to be empty.");

    expectError(
        "should fail to parse a sheet with columns shortfall",
        "NotEnoughColumns.xlsm", "The sheet Week01 has an unexpected range: A1:F5.");

    expectError(
        "should fail to parse a sheet with rows shortfall",
        "NotEnoughRows.xlsm", "The sheet Week01 has an unexpected range: A1:G4.");

    const expectedTimes = [
        {
            date: new Date(Date.UTC(2019, 0, 2)),
            title: "FB-42",
            type: undefined,
            comments: [ "Work without a type" ],
            isPaidAbsence: false,
            durationMinutes: 360,
        },
        {
            date: new Date(Date.UTC(2019, 0, 3)),
            title: "FB-43",
            type: "No Comment",
            comments: [],
            isPaidAbsence: false,
            durationMinutes: 360,
        },
        {
            date: new Date(Date.UTC(2019, 0, 4)),
            title: "FB-44",
            type: undefined,
            comments: [],
            isPaidAbsence: false,
            durationMinutes: 360,
        },
        {
            date: new Date(Date.UTC(2019, 0, 5)),
            title: "FB-45",
            type: "Other Type",
            comments: [ "Work tied to an issue" ],
            isPaidAbsence: false,
            durationMinutes: 360,
        },
    ];

    expectResult("should parse a sheet with correct rows", "CorrectRows.xlsm", expectedTimes);

    const emptyMessage = "In sheet Week01, C5 and D5 must either be both empty or non-empty.";
    expectError("should fail to parse a sheet with a row with an empty start", "EmptyStart.xlsm", emptyMessage);
    expectError("should fail to parse a sheet with a row with an empty end", "EmptyEnd.xlsm", emptyMessage);

    const wrongTypeMessage = "In sheet Week01, C5 and D5 must both be dates.";
    expectError(
        "should fail to parse a sheet with a row with a wrongly typed start", "WrongTypeStart.xlsm", wrongTypeMessage);
    expectError(
        "should fail to parse a sheet with a row with a wrongly typed end", "WrongTypeEnd.xlsm", wrongTypeMessage);

    expectError(
        "should fail to parse a sheet with a row with a missing title", "MissingTitle.xlsm",
        "In sheet Week01, E5 must not be empty.");
    expectError(
        "should fail to parse a sheet with a row with a negative spent time", "NegativeSpentTime.xlsm",
        "In sheet Week01, C5 must be smaller than D5.");
    expectError(
        "should fail to parse a sheet with a row with a spent time too large", "SpentTimeTooLarge.xlsm",
        "In sheet Week01, on row 5 the spent time must be smaller than 1 day.");
    expectError(
        "should fail to parse a sheet with a row with holidays and OPA", "HolidaysAndOpa.xlsm",
        "In sheet Week01, A5 and B5 cannot both be non-empty.");
    expectError(
        "should fail to parse a sheet with a row with holidays without end formula", "HolidaysWithoutEndFormula.xlsm",
        "In sheet Week01, D5 must be a formula.");
    expectError(
        "should fail to parse a sheet with a row with spent time and formula", "SpentTimeWithFormula.xlsm",
        "In sheet Week01, C5 and D5 must either be both values or both formulas.");

    expectResult("should parse empty template", "2019.xlsm", []);
});
