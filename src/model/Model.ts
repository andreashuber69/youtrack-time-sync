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

import { Application } from "./Application";
import { ISpentTime } from "./SpentTimes";

/** Represents the main model of the application. */
export class Model {
    public get title() {
        return Application.title;
    }

    public readonly fileExtension = ".xlsm";

    public get youTrackBaseUrl() {
        return this.youTrackBaseUrlImpl;
    }

    public set youTrackBaseUrl(value: string | null) {
        this.youTrackBaseUrlImpl = value;
        Model.setLocalStorage(Model.youTrackBaseUrlKey, value);
    }

    public get youTrackToken() {
        return this.youTrackTokenImpl;
    }

    public set youTrackToken(value: string | null) {
        this.youTrackTokenImpl = value;
        Model.setLocalStorage(Model.youTrackTokenKey, value);
    }

    // tslint:disable-next-line:no-null-keyword
    public filename: string | null = null;

    // tslint:disable-next-line:no-null-keyword
    public times = new Array<ISpentTime>();

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static readonly youTrackBaseUrlKey = "youTrackBaseUrl";
    private static readonly youTrackTokenKey = "youTrackToken";

    private static getLocalStorage(key: string) {
        return window.localStorage.getItem(key);
    }

    private static setLocalStorage(key: string, value: string | null) {
        if (!value) {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, value);
        }
    }

    private youTrackBaseUrlImpl = Model.getLocalStorage(Model.youTrackBaseUrlKey);
    private youTrackTokenImpl = Model.getLocalStorage(Model.youTrackTokenKey);
}
