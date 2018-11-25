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
import { Model } from "../model/Model";
import { ISpentTime } from "../model/SpentTimes";
import { SpentTimeUtility } from "../model/SpentTimeUtility";
import { YouTrack } from "../model/YouTrack";

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

    public readonly rules = [ (value: unknown) => Content.requiredRule(value) ];
    // tslint:disable-next-line:no-null-keyword
    public networkError: string | null = null;
    public showToken = false;
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
    public async onSubmitClicked(event: MouseEvent) {
        await Promise.all(this.times.map((spentTime) => this.createWorkItem(spentTime)));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static requiredRule(value: unknown) {
        return !!value || "A value is required.";
    }

    private youTrack: YouTrack | undefined;

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
            return [];
        }

        this.checkedModel.filename = files[0].name;

        if (!this.checkedModel.youTrackBaseUrl || !this.checkedModel.youTrackToken) {
            return [];
        }

        this.youTrack = new YouTrack(this.checkedModel.youTrackBaseUrl, this.checkedModel.youTrackToken);

        return SpentTimeUtility.getUnreportedSpentTime(files[0], this.youTrack, this);
    }

    private createWorkItem(spentTime: ISpentTime) {
        if (!this.youTrack) {
            throw new Error("youTrack is not set.");
        }

        return this.youTrack.createWorkItem(spentTime.title, {
            date: spentTime.date.getTime(),
            duration: {
                minutes: spentTime.durationMinutes,
            },
            text: spentTime.comment || undefined,
            type: spentTime.type && { name: spentTime.type } || undefined,
        });
    }
}
