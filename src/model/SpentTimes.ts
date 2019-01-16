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

import { ISpentTime } from "./ISpentTime";

/**
 * @summary Implements a container that can be used to establish the difference between the spent times kept locally and
 * those already reported to a server.
 */
export class SpentTimes {
    /** Initializes the container with the locally kept time. */
    public constructor(
        localTimes: IterableIterator<ISpentTime>, private readonly roundingMinutes: 1 | 5 | 10 | 15 | 30) {
        for (const time of localTimes) {
            this.earliestLocalDate = Math.min(this.earliestLocalDate, time.date.getTime());
            this.addSingle(time);
        }

        for (const time of this.map.values()) {
            this.roundDuration(time);
        }
    }

    /** Gets the unique titles of all spent times. */
    public uniqueTitles() {
        return [ ...new Set([ ...this.map.values() ].map((time) => time.title)) ];
    }

    /** Subtracts the spent time already on the server. */
    public subtract(serverTimes: IterableIterator<ISpentTime>) {
        for (const serverTime of serverTimes) {
            if (serverTime.date.getTime() >= this.earliestLocalDate) {
                this.subtractSingle(serverTime);
            }
        }
    }

    /** Gets the remaining spent time entries. */
    public entries() {
        const result = [ ...this.map.values() ];
        result.sort((left, right) => SpentTimes.compare(left, right));

        return result;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static compare(left: ISpentTime, right: ISpentTime) {
        return (left.date.getTime() - right.date.getTime()) || left.title.localeCompare(right.title) ||
            (left.type || "").localeCompare(right.type || "") || 0;
    }

    private static add(existingComments: string[], newComment: string) {
        if (!existingComments.includes(newComment)) {
            existingComments.push(newComment);
        }

        return existingComments;
    }

    private readonly map = new Map<string, ISpentTime>();
    private readonly earliestLocalDate = Number.MAX_SAFE_INTEGER;

    private addSingle(time: ISpentTime) {
        const [ key, existingTime ] = this.findExisting(time);

        if (existingTime) {
            existingTime.durationMinutes += time.durationMinutes;
            time.comments.reduce((p, c) => SpentTimes.add(p, c), existingTime.comments);
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
                `Spent time entries for issue ${time.title} on ${date} cannot be matched to the Excel file.`);
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
