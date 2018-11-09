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

import { Component, Vue } from "vue-property-decorator";
import { Application } from "../model/Application";

// tslint:disable-next-line:no-unsafe-any
@Component
/** Implements the About dialog. */
// tslint:disable-next-line:no-default-export no-unsafe-any
export default class AboutDialog extends Vue {
    /** Provides a value indicating whether the dialog is currently open. */
    public isOpen = false;

    public get title() {
        return `${Application.title} v${Application.version}`;
    }

    public get packageName() {
        return Application.packageName;
    }

    public get userAgent() {
        return window.navigator.userAgent;
    }

    public showDialog() {
        this.isOpen = true;
    }
}
