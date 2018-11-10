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

/** Represents the main model of the application. */
export class Model {
    public get title() {
        return Application.title;
    }

    /** Provides the file extension. */
    public readonly fileExtension = ".xlsm";

    // tslint:disable-next-line:no-null-keyword
    public youTrackBaseUrl: string | null = null;

    // tslint:disable-next-line:no-null-keyword
    public token: string | null = null;

    // tslint:disable-next-line:no-null-keyword
    public filename: string | null = null;
}
