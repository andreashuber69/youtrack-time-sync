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

import { read } from "xlsx";
import { ISpentTime, SpentTimes } from "./SpentTimes";
import { WorkBookParser } from "./WorkBookParser";
import { IIssueWorkItem, YouTrack } from "./YouTrack";

interface IErrors {
    fileError: string | null;
    networkError: string | null;
}

export class SpentTimeUtility {
    public static async getUnreportedSpentTime(excelFile: File, youTrack: YouTrack, errors: IErrors) {
        // tslint:disable-next-line:no-null-keyword
        errors.fileError = null;
        let spentTimes: SpentTimes;

        try {
            const rawExcelSpentTimes =
                WorkBookParser.parse(read(new Uint8Array(await this.read(excelFile)), { type: "array" }));
            spentTimes = new SpentTimes(rawExcelSpentTimes, 15);
        } catch (e) {
            errors.fileError = this.getErrorMessage(e);

            return [];
        }

        return this.subtractYouTrackSpentTimes(spentTimes, youTrack, errors);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static async subtractYouTrackSpentTimes(spentTimes: SpentTimes, youTrack: YouTrack, errors: IErrors) {
        // tslint:disable-next-line:no-null-keyword
        errors.networkError = null;

        try {
            const issueIds = spentTimes.uniqueTitles();
            const youTrackWorkItems = await youTrack.getWorkItemsForUser(await youTrack.getCurrentUser(), issueIds);
            spentTimes.subtract(this.convert(youTrackWorkItems.values()));

            return spentTimes.entries();
        } catch (e) {
            errors.networkError = this.getErrorMessage(e);

            return [];
        }
    }

    private static * convert(workItems: IterableIterator<IIssueWorkItem>): IterableIterator<ISpentTime> {
        for (const workItem of workItems) {
            yield {
                date: new Date(workItem.date),
                title: workItem.issue.id,
                type: workItem.type && workItem.type.name || undefined,
                isPaidAbsence: false,
                comment: workItem.text,
                durationMinutes: workItem.duration.minutes,
            };
        }
    }

    private static read(blob: Blob) {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(reader.result as ArrayBuffer);
            reader.onerror = (ev) => reject("Unable to read file.");
            reader.readAsArrayBuffer(blob);
        });
    }

    private static getErrorMessage(e: any) {
        return e instanceof Error && e.toString() || "Unknown Error!";
    }
}
