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

export interface ISpentTime {
    readonly date: Date;
    readonly title: string;
    readonly type?: string;
    readonly isPaidAbsence: boolean;
    summary?: string;
    comment?: string;
    durationMinutes: number;
}

export class SpentTimes {
    public constructor(
        excelTimes: IterableIterator<ISpentTime>, private readonly roundingMinutes: 1 | 5 | 10 | 15 | 30) {
        for (const time of excelTimes) {
            this.addSingle(time);
        }

        for (const time of this.map.values()) {
            this.roundDuration(time);
        }
    }

    public uniqueTitles() {
        return [ ...new Set([ ...this.map.values() ].map((time) => time.title)) ];
    }

    public subtract(youTrackTimes: IterableIterator<ISpentTime>) {
        for (const youTrackTime of youTrackTimes) {
            this.subtractSingle(youTrackTime);
        }
    }

    public entries() {
        const result = new Array<ISpentTime>();

        for (const spentTime of this.map.values()) {
            result.push(spentTime);
        }

        result.sort((left, right) => SpentTimes.compare(left, right));

        return result;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static compare(left: ISpentTime, right: ISpentTime) {
        return (left.date.getTime() - right.date.getTime()) || left.title.localeCompare(right.title) ||
            (left.type || "").localeCompare(right.type || "") || 0;
    }

    private readonly map = new Map<string, ISpentTime>();

    private addSingle(time: ISpentTime) {
        const [ key, existingTime ] = this.findExisting(time);

        if (existingTime) {
            existingTime.durationMinutes += time.durationMinutes;

            if (time.comment) {
                existingTime.comment =
                    existingTime.comment ? `${existingTime.comment}\n${time.comment}` : time.comment;
            }
        } else {
            this.map.set(key, time);
        }
    }

    private subtractSingle(time: ISpentTime) {
        const [ key, existingTime ] = this.findExisting(time);
        this.roundDuration(time);

        if (!existingTime || (existingTime.durationMinutes < time.durationMinutes)) {
            const date = time.date.toLocaleDateString();
            throw new Error(
                `Spent time entries for issue ${time.title} on ${date} cannot be matched to the Excel sheet.`);
        }

        existingTime.durationMinutes -= time.durationMinutes;

        if (existingTime.durationMinutes === 0) {
            this.map.delete(key);
        }
    }

    private findExisting(time: ISpentTime): [ string, ISpentTime | undefined ] {
        const key = `${time.date.getTime()}|${time.title}|${time.type}`;

        return [ key, this.map.get(key) ];
    }

    private roundDuration(time: ISpentTime) {
        time.durationMinutes = Math.round(time.durationMinutes / this.roundingMinutes) * this.roundingMinutes;
    }
}
