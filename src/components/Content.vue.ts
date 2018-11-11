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
import { read, WorkBook } from "xlsx";
import { Model } from "../model/Model";

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

        try {
            this.checkedModel.filename = files[0].name;
            this.parse(read(new Uint8Array(await Content.read(files[0])), { type: "array" }));
            // tslint:disable-next-line:no-null-keyword
            this.error = null;
        } catch (e) {
            this.error = e instanceof Error ? e.toString() : "Unknown Error!";
        }
    }

    // tslint:disable-next-line:prefer-function-over-method
    private parse(workBook: WorkBook) {
        let containsOneOrMoreWeeks = false;

        for (const sheetName of workBook.SheetNames) {
            if (sheetName.startsWith("Week")) {
                containsOneOrMoreWeeks = true;
                const sheet = workBook.Sheets[sheetName];

                if ((sheet["!ref"] as string).indexOf(":G") < 0) {
                    throw new Error(`The sheet ${sheetName} has fewer columns than expected (7).`);
                }
            }
        }

        if (!containsOneOrMoreWeeks) {
            throw new Error("The selected workbook does not contain any Week sheet.");
        }
    }
}
