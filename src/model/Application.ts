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

// tslint:disable-next-line:no-require-imports no-var-requires
const packageJson = require("../../package.json") as { name: string; version: string };

export class Application {
    public static get packageName() {
        return packageJson.name;
    }

    public static get title() {
        return Application.packageName.split("-").map((c) => `${c[0].toUpperCase()}${c.substr(1)}`).join(" ");
    }

    public static get version() {
        return packageJson.version;
    }
}
