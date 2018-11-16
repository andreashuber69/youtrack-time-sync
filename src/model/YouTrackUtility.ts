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

import { SpentTimes } from "./SpentTimes";
import { IIssueWorkItem, IUser, YouTrack } from "./YouTrack";

export class YouTrackUtility {
    public static async subtractYouTrackSpentTimes(excelSpentTimes: SpentTimes, youTrack: YouTrack) {
        const user = await youTrack.getCurrentUser();
        const issueIds = new Set(excelSpentTimes.entries().filter((t) => t.title.includes("-")).map((t) => t.title));
        const workItemsArray = await Promise.all([ ...issueIds ].map((issueId) => youTrack.getWorkItems(issueId)));

        for (const workItems of workItemsArray) {
            for (const workItem of workItems) {
                YouTrackUtility.processWorkItem(excelSpentTimes, workItem, user);
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static processWorkItem(excelSpentTimes: SpentTimes, workItem: IIssueWorkItem, user: IUser) {
        if (workItem.creator.id === user.id) {
            const spentTime = {
                date: new Date(workItem.date),
                title: workItem.issue.id,
                durationMinutes: workItem.duration.minutes,
                isPaidAbsence: false,
                type: workItem.type && workItem.type.name || undefined,
                comment: workItem.text,
            };

            if (!excelSpentTimes.subtract(spentTime)) {
                const date = spentTime.date.toLocaleDateString();
                throw new Error(
                    `Spent time entry for issue ${spentTime.title} on ${date} has no counterpart in the Excel sheet.`);
            }
        }
    }
}
