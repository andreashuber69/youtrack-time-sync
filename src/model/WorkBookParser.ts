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
import { ISpentTime } from "./SpentTimes";

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

interface ISheet {
    readonly name: string;
    readonly workSheet: WorkSheet;
}

export class WorkBookParser {
    public static * parse(workBook: WorkBook): IterableIterator<ISpentTime> {
        let containsOneOrMoreWeeks = false;

        for (const sheetName of workBook.SheetNames) {
            for (const time of this.parseSheet({ name: sheetName, workSheet: workBook.Sheets[sheetName] })) {
                containsOneOrMoreWeeks = true;
                yield time;
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
    private static readonly excelEpochStartOffset = new Date(1899, 11, 30).getTime() / 1000 / 60 / 60 / 24;

    private static * parseSheet(sheet: ISheet) {
        if (!sheet.name.startsWith("Week")) {
            // False positive, this rule should not apply to generators.
            // tslint:disable-next-line:return-undefined
            return;
        }

        const range = sheet.workSheet["!ref"];

        if (!range) {
            throw new Error(`The sheet ${sheet.name} seems to be empty.`);
        }

        const dividerIndex = range.indexOf(":");
        this.checkRange(dividerIndex < 0, sheet.name, range);
        const [ left, top ] = this.split(range.substring(0, dividerIndex), sheet.name, range);
        const [ right, bottom ] = this.split(range.substring(dividerIndex + 1, range.length), sheet.name, range);
        const firstDataRow = 5;
        this.checkRange(
            (left !== "A") || (right !== "G") || (top !== 1) || (bottom < firstDataRow), sheet.name, range);

        yield * this.iterateRows(firstDataRow, bottom, sheet);
    }

    private static checkRange(fail: boolean, sheetName: string, range: string) {
        if (fail) {
            throw new Error(`The sheet ${sheetName} has an unexpected range: ${range}.`);
        }
    }

    private static * iterateRows(firstDataRow: number, bottom: number, sheet: ISheet) {
        for (let currentRow = firstDataRow; currentRow <= bottom; ++currentRow) {
            yield * this.parseRow({
                errorPrefix: `In sheet ${sheet.name}, `,
                row: currentRow,
                holidays: sheet.workSheet[`A${currentRow}`] as ICell<number | string> | undefined,
                otherPaidAbsence: sheet.workSheet[`B${currentRow}`] as ICell<number | string> | undefined,
                start: sheet.workSheet[`C${currentRow}`] as ICell<number | string> | undefined,
                end: sheet.workSheet[`D${currentRow}`] as ICell<number | string> | undefined,
                title: sheet.workSheet[`E${currentRow}`] as ICell<number | string> | undefined,
                type: sheet.workSheet[`F${currentRow}`] as ICell<number | string> | undefined,
                comment: sheet.workSheet[`G${currentRow}`] as ICell<number | string> | undefined,
            });
        }
    }

    private static * parseRow(row: IRow) {
        const period = this.getPeriod(row);

        if (!period) {
            // False positive, this rule should not apply to generators.
            // tslint:disable-next-line:return-undefined
            return;
        }

        const [ start, end ] = period;
        const spentTime = this.getSpentTime(row, start, end);
        const [ isPaidAbsenceInit, titleInit ] = this.getWorkDetail(row, start, end);

        if (start.f !== undefined) {
            // False positive, this rule should not apply to generators.
            // tslint:disable-next-line:return-undefined
            return;
        }

        if (!titleInit) {
            throw new Error(`${row.errorPrefix}E${row.row} must not be empty.`);
        }

        if (titleInit.includes("-")) {
            yield {
                date: this.toDate(start.v),
                title: titleInit,
                type: row.type && row.type.v.toString() || undefined,
                comments: WorkBookParser.getComments(row),
                isPaidAbsence: isPaidAbsenceInit,
                durationMinutes: spentTime * 24 * 60,
            };
        }
    }

    private static split(corner: string, sheetName: string, range: string): [ string, number ] {
        const rowIndex = corner.search("[0-9]+");
        this.checkRange(rowIndex < 0, sheetName, range);

        return [ corner.substring(0, rowIndex), Number.parseInt(corner.substring(rowIndex, corner.length), 10) ];
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

    private static getSpentTime(row: IRow, start: ICell<number>, end: ICell<number>) {
        let spentTime = end.v - start.v;

        if (Math.abs(spentTime) < 1 / 24 / 60 / 60) {
            spentTime = 0;
        }

        if (spentTime < 0) {
            throw new Error(`${row.errorPrefix}C${row.row} must be smaller than D${row.row}.`);
        }

        if (spentTime >= 1) {
            throw new Error(`${row.errorPrefix}on row ${row.row} the spent time must be smaller than 1 day.`);
        }

        return spentTime;
    }

    private static getWorkDetail(row: IRow, start: ICell<number>, end: ICell<number>): [ boolean, string | undefined ] {
        if (row.holidays && row.otherPaidAbsence) {
            throw new Error(`${row.errorPrefix}A${row.row} and B${row.row} cannot both be non-empty.`);
        }

        const isPaidAbsence = !!row.holidays || !!row.otherPaidAbsence;

        return [ isPaidAbsence, isPaidAbsence ? this.getPaidAbsenceTitle(row, end) : this.getTitle(row, start, end) ];
    }

    private static toDate(excelDate: number) {
        // YouTrack work item dates are represented as milliseconds since unix epoch rounded down to midnight UTC.
        return new Date(Math.floor(this.excelEpochStartOffset + excelDate) * 24 * 60 * 60 * 1000);
    }

    private static getComments(row: IRow) {
        return row.comment && row.comment.v.toString().split("\n").map((c) => c.trim()).filter((c) => !!c) || [];
    }

    private static getPaidAbsenceTitle(row: IRow, end: ICell<number>) {
        if (end.f === undefined) {
            throw new Error(`${row.errorPrefix}D${row.row} must be a formula.`);
        }

        return row.holidays ? "Holiday" : "Other Paid Absence";
    }

    private static getTitle(row: IRow, start: ICell<number>, end: ICell<number>) {
        if ((start.f === undefined) !== (end.f === undefined)) {
            throw new Error(
                `${row.errorPrefix}C${row.row} and D${row.row} must either be both values or both formulas.`);
        }

        return row.title && row.title.v.toString() || undefined;
    }
}
