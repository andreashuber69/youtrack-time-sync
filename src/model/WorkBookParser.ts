// Copyright (C) 2018 Andreas Huber Dönni
//
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
// License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
// version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
// warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with this program. If not, see
// <http://www.gnu.org/licenses/>.

import { WorkBook, WorkSheet } from "xlsx";

export interface ISpentTime {
    readonly title: string;
    readonly date: Date;
    readonly durationDays: number;
    readonly paidAbsence: boolean;
    readonly type?: string;
    readonly comment?: string;
}

interface ICell<T> {
    readonly v: T;
    readonly f?: string;
}

interface IRow {
    readonly errorPrefix: string;
    readonly row: number;
    readonly holidays?: ICell<number | string>;
    readonly otherPaidAbsence?: ICell<number | string>;
    readonly start?: ICell<number | string>;
    readonly end?: ICell<number | string>;
    readonly title?: ICell<number | string>;
    readonly type?: ICell<number | string>;
    readonly comment?: ICell<number | string>;
}

interface IPeriod {
    readonly start: ICell<number>;
    readonly end: ICell<number>;
}

export class WorkBookParser {
    public static parse(workBook: WorkBook) {
        const spentTimes = new Array<ISpentTime>();

        let containsOneOrMoreWeeks = false;

        for (const sheetName of workBook.SheetNames) {
            if (sheetName.startsWith("Week")) {
                containsOneOrMoreWeeks = true;
                this.parseSheet(spentTimes, workBook.Sheets[sheetName], sheetName);
            }
        }

        if (!containsOneOrMoreWeeks) {
            throw new Error("The selected workbook does not seem to contain any Week sheets.");
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // In Excel 1900/01/01 00:00 is represented as the number 1.0
    // (https://gist.github.com/christopherscott/2782634#gistcomment-1274743). Moreover, Excel incorrectly assumes that
    // 1900 was a leap year
    // (https://support.microsoft.com/en-us/help/214326/excel-incorrectly-assumes-that-the-year-1900-is-a-leap-year).
    // The 0-based epoch therefore starts at 1899/12/30. Finally, the months in js are 0-based...
    private static readonly excelEpochStart = new Date(1899, 11, 30);

    private static parseSheet(spentTimes: ISpentTime[], sheet: WorkSheet, sheetName: string) {
        const range = sheet["!ref"];

        if (!range) {
            throw new Error(`The sheet ${sheetName} seems to be empty.`);
        }

        const dividerIndex = range.indexOf(":");
        this.checkRange(dividerIndex < 0, sheetName, range);
        const [ left, top ] = this.split(range.substring(0, dividerIndex), sheetName, range);
        const [ right, bottom ] = this.split(range.substring(dividerIndex + 1, range.length), sheetName, range);
        const firstDataRow = 5;
        this.checkRange((left !== "A") || (right !== "G") || (top !== 1) || (bottom < firstDataRow), sheetName, range);

        for (let row = firstDataRow; row <= bottom; ++row) {
            WorkBookParser.parseRow(spentTimes, {
                errorPrefix: `In sheet ${sheetName}, `,
                // tslint:disable-next-line:object-literal-key-quotes
                "row": row, // TODO
                holidays: sheet[`A${row}`] as ICell<number | string> | undefined,
                otherPaidAbsence: sheet[`B${row}`] as ICell<number | string> | undefined,
                start: sheet[`C${row}`] as ICell<number | string> | undefined,
                end: sheet[`D${row}`] as ICell<number | string> | undefined,
                title: sheet[`E${row}`] as ICell<number | string> | undefined,
                type: sheet[`F${row}`] as ICell<number | string> | undefined,
                comment: sheet[`G${row}`] as ICell<number | string> | undefined,
            });
        }
    }

    private static parseRow(spentTimes: ISpentTime[], row: IRow) {
        const period = this.getPeriod(row);

        if (!period) {
            return;
        }

        const [ start, end ] = period;
        const spentTime = end.v - start.v;

        if (spentTime < 0) {
            throw new Error(`${row.errorPrefix}C${row.row} must be smaller than D${row.row}.`);
        }

        if (spentTime >= 1) {
            throw new Error(`${row.errorPrefix}on row ${row.row} the spent time must be smaller than 1 day.`);
        }

        const [ isPaidAbsence, title ] = WorkBookParser.getWorkDetail(row, start, end);

        if (start.f === undefined) {
            if (!title) {
                throw new Error(`${row.errorPrefix}E${row.row} must not be empty.`);
            }

            spentTimes.push({
                // tslint:disable-next-line:object-literal-key-quotes
                "title": title,
                date: this.toDate(start.v),
                durationDays: spentTime,
                paidAbsence: isPaidAbsence,
                type: row.type ? row.type.v.toString() : undefined,
                comment: row.comment ? row.comment.v.toString() : undefined,
            });
        }
    }

    private static getPeriod(row: IRow): [ ICell<number>, ICell<number> ] | undefined {
        if (!row.start !== !row.end) {
            throw new Error(`${row.errorPrefix}C${row.row} and D${row.row} must either be both empty or non-empty.`);
        }

        if (!row.start || !row.end) {
            return undefined;
        }

        if ((typeof row.start.v !== "number") || (typeof row.end.v !== "number")) {
            throw new Error(`${row.errorPrefix}C${row.row} and D${row.row} must both be dates.`);
        }

        return [ { v: row.start.v, f: row.start.f }, { v: row.end.v, f: row.end.f } ];
    }

    private static getWorkDetail(row: IRow, start: ICell<number>, end: ICell<number>): [ boolean, string | undefined ] {
        if (row.holidays && row.otherPaidAbsence) {
            throw new Error(`${row.errorPrefix}A${row.row} and B${row.row} cannot both be non-empty.`);
        }

        const isPaidAbsence = !!row.holidays || !!row.otherPaidAbsence;

        if (isPaidAbsence) {
            if ((start.f !== undefined) || (end.f === undefined)) {
                throw new Error(`${row.errorPrefix}C${row.row} must be fixed and D${row.row} must be floating.`);
            }

            return [ isPaidAbsence, row.holidays ? "Holiday" : "Other Paid Absence" ];
        } else {
            if ((start.f === undefined) !== (end.f === undefined)) {
                throw new Error(
                    `${row.errorPrefix}C${row.row} and D${row.row} must either be both values or both formulas.`);
            }

            return [ isPaidAbsence, row.title && row.title.v && row.title.v.toString() || undefined ];
        }
    }

    private static checkRange(fail: boolean, sheetName: string, range: string) {
        if (fail) {
            throw new Error(`The sheet ${sheetName} has an unexpected range: ${range}.`);
        }
    }

    private static split(corner: string, sheetName: string, range: string): [ string, number ] {
        const rowIndex = corner.search("[0-9]+");
        this.checkRange(rowIndex < 0, sheetName, range);

        return [ corner.substring(0, rowIndex), Number.parseInt(corner.substring(rowIndex, corner.length), 10) ];
    }

    private static toDate(excelDate: number) {
        return new Date(this.excelEpochStart.valueOf() + Math.floor(excelDate) * 24 * 60 * 60 * 1000);
    }
}
