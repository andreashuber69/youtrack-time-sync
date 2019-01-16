// Copyright (C) 2018-2019 Andreas Huber Dönni
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

@Component
// tslint:disable-next-line:no-default-export
export default class StatusSnackbar extends Vue {
    // tslint:disable-next-line:no-null-keyword
    public color: string | null = null;
    // tslint:disable-next-line:no-null-keyword
    public message: string | null = null;
    public isVisible = false;
    // tslint:disable-next-line:no-null-keyword
    public timeout: number | null = null;

    public showInfo(message: string) {
        this.show("success", message);
    }

    public showError(message: string) {
        this.show("error", message, 0);
    }

    private show(color: "success" | "error", message: string, timeout = 6000) {
        this.color = color;
        this.message = message;
        this.isVisible = true;
        this.timeout = timeout;
    }
}
