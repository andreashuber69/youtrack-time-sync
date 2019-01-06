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
import { BlobUtility } from "./BlobUtility";
import { SpentTimes } from "./SpentTimes";
import { WorkBookParser } from "./WorkBookParser";
import { IIssueWorkItem, IUser, YouTrack } from "./YouTrack";

/**
 * @summary Reconciles spent time recorded in an Excel file with the one kept on a YouTrack server.
 */
export class ExcelYouTrackSpentTimeUtility {
    public static async create(excelFile: File) {
        return new ExcelYouTrackSpentTimeUtility(await BlobUtility.toArrayBuffer(excelFile));
    }

    public async subtractExistingSpentTimes(youTrack: YouTrack, currentUser: IUser) {
        const issueIds = this.spentTimes.uniqueTitles();
        const youTrackWorkItems = await youTrack.getWorkItemsForUser(currentUser, issueIds);
        this.subtractNewSpentTimes(youTrackWorkItems);
        const issues = await youTrack.getIssues(this.spentTimes.uniqueTitles());
        const result = this.spentTimes.entries();

        for (const spentTime of result) {
            const issue = issues.find((i) => i.id === spentTime.title);
            spentTime.summary = issue && issue.summary;
        }

        return result;
    }

    public subtractNewSpentTimes(spentTimes: IIssueWorkItem[]) {
        this.spentTimes.subtract(ExcelYouTrackSpentTimeUtility.convert(spentTimes));

        return this.spentTimes.entries();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static * convert(workItems: IIssueWorkItem[]) {
        for (const workItem of workItems) {
            yield {
                date: new Date(workItem.date),
                title: workItem.issue.id,
                type: workItem.type && workItem.type.name || undefined,
                isPaidAbsence: false,
                comments: workItem.text && workItem.text.split("\n").map((c) => c.trim()) || [],
                durationMinutes: workItem.duration.minutes,
            };
        }
    }

    private readonly spentTimes: SpentTimes;

    private constructor(excelFileContent: ArrayBuffer) {
        this.spentTimes =
            new SpentTimes(WorkBookParser.parse(read(new Uint8Array(excelFileContent), { type: "array" })), 15);
    }
}
