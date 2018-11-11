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
    readonly date: Date;
    readonly title: string;
    readonly type: string;
    readonly comment: string;
}

interface ICell {
    readonly v: number | string;
    readonly f?: string;
}

export class WorkBookParser {
    public static parse(workBook: WorkBook) {
        let containsOneOrMoreWeeks = false;

        for (const sheetName of workBook.SheetNames) {
            if (sheetName.startsWith("Week")) {
                containsOneOrMoreWeeks = true;
                this.parseSheet(workBook.Sheets[sheetName], sheetName);
            }
        }

        if (!containsOneOrMoreWeeks) {
            throw new Error("The selected workbook does not seem to contain any Week sheet.");
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // tslint:disable-next-line:prefer-function-over-method
    private static parseSheet(sheet: WorkSheet, sheetName: string) {
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
            WorkBookParser.parseRow(sheet, row, sheetName);
        }
    }

    private static parseRow(sheet: WorkSheet, row: number, sheetName: string) {
        const holidays = sheet[`A${row}`] as ICell | undefined;
        const otherPaidAbsences = sheet[`B${row}`] as ICell | undefined;
        const start = sheet[`C${row}`] as ICell | undefined;
        const end = sheet[`D${row}`] as ICell | undefined;
        const title = sheet[`E${row}`] as ICell | undefined;
        const type = sheet[`F${row}`] as ICell | undefined;
        const comment = sheet[`G${row}`] as ICell | undefined;

        if (holidays || otherPaidAbsences) {
            if (!start || !end || (start.f !== undefined) || (end.f === undefined)) {
                throw new Error(`In sheet ${sheetName}, C${row} must be fixed and D${row} must be floating.`);
            }
        } else if (start && end) {
            if ((start.f === undefined) !== (end.f === undefined)) {
                throw new Error(
                    `In sheet ${sheetName}, C${row} and D${row} must either be both fixed or both floating.`);
            }

            if ((typeof start.v !== "number") || (typeof end.v !== "number")) {
                throw new Error(`In sheet ${sheetName}, C${row} and D${row} must both be dates.`);
            }

            if (start.f === undefined) {
                const time = end.v - start.v;

                if (time < 0) {
                    throw new Error(`In sheet ${sheetName}, C${row} must be smaller than D${row}.`);
                }

                if (time >= 1) {
                    throw new Error(`In sheet ${sheetName}, on row ${row} the spent time must be smaller than 1 day.`);
                }

                if (!title || !title.v) {
                    throw new Error(`In sheet ${sheetName}, E${row} must not be empty.`);
                }

            }
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
}
