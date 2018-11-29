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

@Component
// tslint:disable-next-line:no-default-export
export default class Content extends Vue {
    @Prop()
    public model?: Model;
    public valid = false;

    public get focusUrl() {
        return !this.checkedModel.youTrackBaseUrl;
    }

    public get focusToken() {
        return !this.focusUrl && !this.checkedModel.youTrackToken;
    }

    public showToken = false;

    public get disableFile() {
        return !this.checkedModel.youTrackBaseUrl || !this.checkedModel.youTrackToken;
    }

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

    public noSpentTimeText = "Upload your Excel file to see the unreported spent time.";
    public isLoading = false;
    public showSuccess = false;

    public onOpenClicked(event: MouseEvent) {
        this.fileInput.click();
    }

    public async onFileInputChanged(event: Event) {
        try {
            this.isLoading = true;
            const files = event.target && ((event.target as any).files as FileList) || undefined;
            this.checkedModel.times = await this.onFileInputChangedImpl(files);
        } finally {
            this.fileInput.value = "";
            this.isLoading = false;
        }
    }

    public async onReportNowClicked(event: MouseEvent) {
        const youTrack = this.createYouTrack();
        let newSpentTimes: IIssueWorkItem[];

        try {
            this.isLoading = true;
            // TODO: Report errors
            newSpentTimes = await Promise.all(
                this.checkedModel.times.map((spentTime) => Content.createWorkItem(youTrack, spentTime)));
        } finally {
            this.isLoading = false;
        }

        if (!this.spentTimeUtility) {
            throw new Error("spentTimeUtility is not set!");
        }

        this.checkedModel.times = this.spentTimeUtility.subtractNewSpentTimes(newSpentTimes);
        this.showSuccess = true;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static getErrorMessage(e: any) {
        return e instanceof Error && e.toString() || "Unknown Error!";
    }

    private static createWorkItem(youTrack: YouTrack, spentTime: ISpentTime) {
        return youTrack.createWorkItem(spentTime.title, {
            date: spentTime.date.getTime(),
            duration: {
                minutes: spentTime.durationMinutes,
            },
            text: spentTime.comment || undefined,
            type: spentTime.type && { name: spentTime.type } || undefined,
        });
    }

    private spentTimeUtility: ExcelYouTrackSpentTimeUtility | undefined;

    private get checkedModel() {
        if (!this.model) {
            throw new Error("No model set!");
        }

        return this.model;
    }

    private get fileInput() {
        // tslint:disable-next-line:no-unsafe-any
        return this.$refs.fileInput as HTMLInputElement;
    }

    private createYouTrack() {
        if (!this.checkedModel.youTrackBaseUrl || !this.checkedModel.youTrackToken) {
            throw new Error("YouTrack coordinates missing!");
        }

        return new YouTrack(this.checkedModel.youTrackBaseUrl, this.checkedModel.youTrackToken);
    }

    private onFileInputChangedImpl(files: FileList | undefined) {
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

        return this.process(files[0]);
    }

    private async process(excelFile: File) {
        try {
            this.spentTimeUtility = await ExcelYouTrackSpentTimeUtility.create(excelFile);
        } catch (e) {
            this.fileError = Content.getErrorMessage(e);

            return [];
        }

        const youTrack = this.createYouTrack();
        let currentUser: IUser;

        try {
            currentUser = await youTrack.getCurrentUser();
        } catch (e) {
            this.networkError = Content.getErrorMessage(e);

            return [];
        }

        let result: ISpentTime[];

        try {
            result = await this.spentTimeUtility.subtractExistingSpentTimes(youTrack, currentUser);
        } catch (e) {
            this.networkError = Content.getErrorMessage(e);

            return [];
        }

        this.noSpentTimeText = "The Excel file does not contain any unreported spent time.";

        return result;
    }
}
