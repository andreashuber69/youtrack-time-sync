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

import { Component, Prop, Vue } from "vue-property-decorator";
import { ExcelYouTrackSpentTimeUtility } from "../model/ExcelYouTrackSpentTimeUtility";
import { Model } from "../model/Model";
import { ISpentTime } from "../model/SpentTimes";
import { IIssueWorkItem, IUser, YouTrack } from "../model/YouTrack";
import StatusSnackbar from "./StatusSnackbar.vue";

@Component({ components: { StatusSnackbar } })
// tslint:disable-next-line:no-default-export
export default class Content extends Vue {
    @Prop()
    public model?: Model;
    public valid = false;
    public showToken = false;

    public readonly rules = [ (value: unknown) => !!value || "A value is required." ];
    // tslint:disable-next-line:no-null-keyword
    public networkError: string | null = null;
    // tslint:disable-next-line:no-null-keyword
    public fileError: string | null = null;

    public timeHeaders = [
        { text: "Date", sortable: false },
        { text: "ID", sortable: false },
        { text: "Summary", sortable: false },
        { text: "Type", sortable: false },
        { text: "Comment", sortable: false },
        { text: "Spent Time", align: "right", sortable: false },
    ];

    public noSpentTimeText = Content.defaultNoSpentTimeText;
    public isLoading = false;

    public async onFileInputChanged(event: Event) {
        try {
            this.isLoading = true;
            const files = event.target && ((event.target as any).files as FileList) || undefined;
            this.checkedModel.times = await this.onFileInputChangedImpl(files);
        } finally {
            (this.$refs.fileInput as HTMLInputElement).value = "";
            this.isLoading = false;
        }
    }

    public async onReportNowClicked(event: MouseEvent) {
        const youTrack = this.createYouTrack();
        const newSpentTimes = new Array<IIssueWorkItem>();

        try {
            this.isLoading = true;
            const workItemTypes = new Map<string, string>(
                (await youTrack.getWorkItemTypes()).map((t) => [ t.name, t.id ] as [ string, string ]));

            for (const time of this.checkedModel.times) {
                newSpentTimes.push(await Content.createWorkItem(youTrack, workItemTypes, time));
            }
        } catch (e) {
            this.statusSnackbar.showError(Content.getErrorMessage(e));

            return;
        } finally {
            this.isLoading = false;
        }

        this.checkedModel.times = this.spentTimeUtility.subtractNewSpentTimes(newSpentTimes);
        this.statusSnackbar.showInfo("Spent time reported successfully.");
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static readonly defaultNoSpentTimeText = "Upload your Excel file to see the unreported spent time.";

    private static getErrorMessage(e: any) {
        return e instanceof Error && e.toString() || "Unknown Error!";
    }

    private static createWorkItem(youTrack: YouTrack, workItemTypes: Map<string, string>, spentTime: ISpentTime) {
        const workItemId = spentTime.type && workItemTypes.get(spentTime.type);

        if (spentTime.type && !workItemId) {
            throw new Error(
                `The type ${spentTime.type} is not available. Please select a different type in the Excel file.`);
        }

        return youTrack.createWorkItem(spentTime.title, {
            date: spentTime.date.getTime(),
            duration: {
                minutes: spentTime.durationMinutes,
            },
            text: spentTime.comments.join("\n") || undefined,
            type: workItemId && { id: workItemId } || undefined,
        });
    }

    private spentTimeUtilityImpl: ExcelYouTrackSpentTimeUtility | undefined;

    private get spentTimeUtility() {
        if (!this.spentTimeUtilityImpl) {
            throw new Error("spentTimeUtility is not set!");
        }

        return this.spentTimeUtilityImpl;
    }

    private get checkedModel() {
        if (!this.model) {
            throw new Error("No model set!");
        }

        return this.model;
    }

    private get statusSnackbar() {
        return this.$refs.statusSnackbar as StatusSnackbar;
    }

    private createYouTrack() {
        if (!this.checkedModel.youTrackBaseUrl || !this.checkedModel.youTrackToken) {
            throw new Error("YouTrack coordinates missing!");
        }

        return new YouTrack(this.checkedModel.youTrackBaseUrl, this.checkedModel.youTrackToken);
    }

    private async onFileInputChangedImpl(files: FileList | undefined) {
        // tslint:disable-next-line:no-null-keyword
        this.fileError = null;
        // tslint:disable-next-line:no-null-keyword
        this.networkError = null;
        // tslint:disable-next-line:no-unsafe-any
        (this.$refs.excelFileField as HTMLInputElement).focus();

        if (!files || (files.length !== 1)) {
            throw new Error("Single file expected.");
        }

        this.checkedModel.filename = files[0].name;

        try {
            return await this.process(files[0]);
        } catch (e) {
            this.noSpentTimeText = Content.defaultNoSpentTimeText;

            return [];
        }
    }

    private async process(excelFile: File) {
        try {
            this.spentTimeUtilityImpl = await ExcelYouTrackSpentTimeUtility.create(excelFile);
        } catch (e) {
            this.fileError = Content.getErrorMessage(e);
            throw e;
        }

        const youTrack = this.createYouTrack();
        let currentUser: IUser;

        try {
            currentUser = await youTrack.getCurrentUser();
        } catch (e) {
            this.networkError = Content.getErrorMessage(e);
            throw e;
        }

        return this.subtractExisting(youTrack, currentUser);
    }

    private async subtractExisting(youTrack: YouTrack, currentUser: IUser) {
        let result: ISpentTime[];

        try {
            result = await this.spentTimeUtility.subtractExistingSpentTimes(youTrack, currentUser);
        } catch (e) {
            this.statusSnackbar.showError(Content.getErrorMessage(e));
            throw e;
        }

        this.noSpentTimeText = "The Excel file does not contain any unreported spent time.";

        return result;
    }
}
