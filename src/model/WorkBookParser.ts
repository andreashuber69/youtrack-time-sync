// Copyright (C) 2018-2019 Andreas Huber Dönni
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

import { ISpentTime } from "./ISpentTime";

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
        for (const sheetName of workBook.SheetNames) {
            yield * WorkBookParser.parseSheet({ name: sheetName, workSheet: workBook.Sheets[sheetName] });
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
            return;
        }

        const range = sheet.workSheet["!ref"];

        if (!range) {
            throw new Error(`The sheet ${sheet.name} seems to be empty.`);
        }

        const dividerIndex = range.indexOf(":");
        WorkBookParser.checkRange(dividerIndex < 0, sheet.name, range);
        const leftTop = WorkBookParser.split(range.substring(0, dividerIndex), sheet.name, range);
        const rightBottom = WorkBookParser.split(range.substring(dividerIndex + 1, range.length), sheet.name, range);
        const firstDataRow = 5;
        WorkBookParser.checkRange(WorkBookParser.hasCorrectSize(leftTop, rightBottom, firstDataRow), sheet.name, range);

        yield * WorkBookParser.iterateRows(firstDataRow, rightBottom[1], sheet);
    }

    private static checkRange(fail: boolean, sheetName: string, range: string) {
        if (fail) {
            throw new Error(`The sheet ${sheetName} has an unexpected range: ${range}.`);
        }
    }

    private static split(corner: string, sheetName: string, range: string): [string, number] {
        const rowIndex = corner.search("[0-9]+");
        WorkBookParser.checkRange(rowIndex < 0, sheetName, range);

        return [corner.substring(0, rowIndex), Number.parseInt(corner.substring(rowIndex, corner.length), 10)];
    }

    private static hasCorrectSize(
        [left, top]: [string, number], [right, bottom]: [string, number], firstDataRow: number) {
        return (left !== "A") || (top !== 1) || (right !== "G") || (bottom < firstDataRow);
    }

    private static * iterateRows(firstDataRow: number, bottom: number, sheet: ISheet) {
        for (let currentRow = firstDataRow; currentRow <= bottom; ++currentRow) {
            yield * WorkBookParser.parseRow({
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

    // Breaking this apart is possible but comes with needing to pass many arguments, which in turn would have to be
    // wrapped.
    // codebeat:disable[LOC]
    private static * parseRow(row: IRow) {
        const period = WorkBookParser.getPeriod(row);

        if (!period) {
            return;
        }

        const [start, end] = period;
        const spentTime = WorkBookParser.getSpentTime(row, start, end);
        const [isPaidAbsenceInit, titleInit] = WorkBookParser.getWorkDetail(row, start, end);

        if (start.f !== undefined) {
            return;
        }

        if (!titleInit) {
            throw new Error(`${row.errorPrefix}E${row.row} must not be empty.`);
        }

        if (titleInit.includes("-")) {
            yield {
                date: WorkBookParser.toDate(start.v),
                title: titleInit,
                type: row.type && row.type.v.toString() || undefined,
                comments: WorkBookParser.getComments(row),
                isPaidAbsence: isPaidAbsenceInit,
                durationMinutes: spentTime * 24 * 60,
            };
        }
    }
    // codebeat:enable[LOC]

    private static getPeriod(row: IRow): [ICell<number>, ICell<number>] | undefined {
        if (!row.start !== !row.end) {
            throw new Error(`${row.errorPrefix}C${row.row} and D${row.row} must either be both empty or non-empty.`);
        }

        if (!row.start || !row.end) {
            return undefined;
        }

        if ((typeof row.start.v !== "number") || (typeof row.end.v !== "number")) {
            throw new Error(`${row.errorPrefix}C${row.row} and D${row.row} must both be dates.`);
        }

        return [{ v: row.start.v, f: row.start.f }, { v: row.end.v, f: row.end.f }];
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

    private static getWorkDetail(row: IRow, start: ICell<number>, end: ICell<number>): [boolean, string | undefined] {
        if (row.holidays && row.otherPaidAbsence) {
            throw new Error(`${row.errorPrefix}A${row.row} and B${row.row} cannot both be non-empty.`);
        }

        const isPaidAbsence = !!row.holidays || !!row.otherPaidAbsence;

        return [isPaidAbsence, isPaidAbsence ?
            WorkBookParser.getPaidAbsenceTitle(row, end) : WorkBookParser.getTitle(row, start, end)];
    }

    private static toDate(excelDate: number) {
        // YouTrack work item dates are represented as milliseconds since unix epoch rounded down to midnight UTC.
        return new Date(Math.floor(WorkBookParser.excelEpochStartOffset + excelDate) * 24 * 60 * 60 * 1000);
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
