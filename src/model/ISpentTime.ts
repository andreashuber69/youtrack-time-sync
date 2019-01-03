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

/** Represents working time spent on a particular issue. */
export interface ISpentTime {
    /** The date of the day the work was done. */
    readonly date: Date;
    /** The title of the work, usually the issue id assigned by a issue tracking server. */
    readonly title: string;
    /** The type of the work. */
    readonly type?: string;
    /** Whether or not this is a paid absence. */
    readonly isPaidAbsence: boolean;
    /** The summary of the issue the time was spent on, usually retrieved from the issue tracking server. */
    summary?: string;
    /** A comment further describing the work done. */
    comments: string[];
    /** The number of minutes spent. */
    durationMinutes: number;
}
