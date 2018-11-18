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
import { read } from "xlsx";
import { Model } from "../model/Model";
import { ISpentTime, SpentTimes } from "../model/SpentTimes";
import { SpentTimeUtility } from "../model/SpentTimeUtility";
import { WorkBookParser } from "../model/WorkBookParser";
import { YouTrack } from "../model/YouTrack";

@Component
// tslint:disable-next-line:no-default-export
export default class Content extends Vue {
    @Prop()
    public model?: Model;
    public valid = false;
    public readonly rules = [ (value: unknown) => Content.requiredRule(value) ];
    // tslint:disable-next-line:no-null-keyword
    public networkError: string | null = null;
    public showToken = false;
    // tslint:disable-next-line:no-null-keyword
    public fileError: string | null = null;

    public timeHeaders = [
        { text: "Date", sortable: false },
        { text: "Title", sortable: false },
        { text: "Summary", sortable: false },
        { text: "Type", sortable: false },
        { text: "Comment", sortable: false },
        { text: "Spent Time (Hours)", align: "right", sortable: false },
    ];

    // tslint:disable-next-line:no-null-keyword
    public times = new Array<ISpentTime>();

    public onOpenClicked(event: MouseEvent) {
        this.fileInput.click();
    }

    public async onFileInputChanged(event: Event) {
        try {
            this.times = await this.onFileInputChangedImpl((event.target as any).files as FileList);
        } finally {
            this.fileInput.value = "";
        }
    }

    // tslint:disable-next-line:prefer-function-over-method
    public onSubmitClicked(event: MouseEvent) {
        // Whatever
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static requiredRule(value: unknown) {
        return !!value || "A value is required.";
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

    private async onFileInputChangedImpl(files: FileList) {
        // tslint:disable-next-line:no-null-keyword
        this.fileError = null;
        this.checkedModel.filename = files[0].name;

        if (files.length !== 1) {
            return [];
        }

        let spentTimes: SpentTimes;

        try {
            // tslint:disable-next-line:no-null-keyword
            this.fileError = null;
            const rawExcelSpentTimes =
                WorkBookParser.parse(read(new Uint8Array(await Content.read(files[0])), { type: "array" }));
            spentTimes = new SpentTimes(rawExcelSpentTimes, 15);
        } catch (e) {
            this.fileError = Content.getErrorMessage(e);

            return [];
        }

        return this.subtractYouTrackSpentTimes(spentTimes);
    }

    private async subtractYouTrackSpentTimes(spentTimes: SpentTimes) {
        // tslint:disable-next-line:no-null-keyword
        this.networkError = null;

        if (!this.checkedModel.youTrackBaseUrl || !this.checkedModel.token) {
            return [];
        }

        try {
            const youTrack = new YouTrack(this.checkedModel.youTrackBaseUrl, this.checkedModel.token);
            const issueIds = spentTimes.uniqueTitles();
            const youTrackWorkItems = await youTrack.getWorkItemsForUser(await youTrack.getCurrentUser(), issueIds);
            spentTimes.subtract(SpentTimeUtility.convert(youTrackWorkItems.values()));

            return spentTimes.entries();
        } catch (e) {
            this.networkError = Content.getErrorMessage(e);

            return [];
        }
    }
}
