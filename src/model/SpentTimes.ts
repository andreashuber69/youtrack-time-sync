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
    comment?: string;
    durationMinutes: number;
}

export class SpentTimes {
    public constructor(private readonly roundingMinutes: 1 | 5 | 10 | 15 | 30) {
    }

    public add(entry: ISpentTime) {
        const [ key, existingEntry ] = this.findExisting(entry);

        if (existingEntry) {
            existingEntry.durationMinutes += entry.durationMinutes;
            existingEntry.comment =
                existingEntry.comment ? `${existingEntry.comment}\n${entry.comment}` : entry.comment;
        } else {
            this.map.set(key, entry);
        }
    }

    public subtract(entry: ISpentTime) {
        const [ key, existingEntry ] = this.findExisting(entry);

        if (!existingEntry) {
            return false;
        }

        this.roundDuration(existingEntry);
        this.roundDuration(entry);

        if (existingEntry.durationMinutes < entry.durationMinutes) {
            return false;
        }

        existingEntry.durationMinutes -= entry.durationMinutes;

        if (existingEntry.durationMinutes === 0) {
            this.map.delete(key);
        }

        return true;
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

    private findExisting(entry: ISpentTime): [ string, ISpentTime | undefined ] {
        const key = `${entry.date.getTime()}|${entry.title}|${entry.type}`;

        return [ key, this.map.get(key) ];
    }

    private roundDuration(entry: ISpentTime) {
        entry.durationMinutes = Math.round(entry.durationMinutes / this.roundingMinutes) * this.roundingMinutes;
    }
}
