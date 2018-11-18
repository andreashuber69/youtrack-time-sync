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
import { WorkBookParser } from "../model/WorkBookParser";
import { YouTrack } from "../model/YouTrack";
import { YouTrackUtility } from "../model/YouTrackUtility";

@Component
// tslint:disable-next-line:no-default-export
export default class Content extends Vue {
    @Prop()
    public model?: Model;
    public showToken = false;
    public readonly rules = [ (value: unknown) => Content.requiredRule(value) ];
    public valid = false;
    // tslint:disable-next-line:no-null-keyword
    public error: string | null = null;

    public timeHeaders = [
        { text: "Date", align: "left", sortable: false },
        { text: "Title", align: "left", sortable: false },
        { text: "Type", align: "left", sortable: false },
        { text: "Comment", align: "left", sortable: false },
        { text: "Spent Time (Minutes)", align: "right", sortable: false },
    ];

    // tslint:disable-next-line:no-null-keyword
    public times = new Array<ISpentTime>();

    public onOpenClicked(event: MouseEvent) {
        this.fileInput.click();
    }

    public async onFileInputChanged(event: Event) {
        try {
            await this.onFileInputChangedImpl((event.target as any).files as FileList);
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
        if (files.length !== 1) {
            return;
        }

        let spentTimes: SpentTimes;

        try {
            this.checkedModel.filename = files[0].name;
            // tslint:disable-next-line:no-null-keyword
            this.error = null;
            const rawExcelSpentTimes =
                WorkBookParser.parse(read(new Uint8Array(await Content.read(files[0])), { type: "array" }));
            spentTimes = new SpentTimes(rawExcelSpentTimes, 15);
        } catch (e) {
            this.error = e instanceof Error && e.toString() || "Unknown Error!";
            this.times.splice(0);

            return;
        }

        await this.subtractYouTrackSpentTimes(spentTimes);
        this.times = spentTimes.entries();
    }

    private async subtractYouTrackSpentTimes(spentTimes: SpentTimes) {
        if (this.checkedModel.youTrackBaseUrl && this.checkedModel.token) {
            const youTrack = new YouTrack(this.checkedModel.youTrackBaseUrl, this.checkedModel.token);
            const issueIds = spentTimes.uniqueTitles().filter((title) => title.includes("-"));
            const youTrackWorkItems = await youTrack.getWorkItemsForUser(await youTrack.getCurrentUser(), issueIds);
            spentTimes.subtract(YouTrackUtility.convert(youTrackWorkItems.values()));
        }
    }
}
