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

export interface IUser {
    id: string;
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

export class YouTrack {
    public constructor(private readonly baseUrl: string, private readonly authenticationToken: string) {
        this.headersInit = new Headers([
            [ "Accept", "text/plain" ],
            [ "Authorization", `Bearer ${this.authenticationToken}` ],
            [ "Cache-Control", "no-cache" ],
            [ "Content-Type", "text/plain" ],
        ]);
    }

    public getCurrentUser() {
        return this.get("api/admin/users/me");
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private readonly headersInit: Headers;

    private get(path: string) {
        return this.fetch<IUser>(path, "GET");
    }

    private async fetch<T>(path: string, method: Method, body?: unknown) {
        let responseText: string;

        try {
            responseText = await (await window.fetch(
                new URL(path, this.baseUrl).href, this.getInit(method, body))).text();
        } catch (e) {
            throw new Error(`Network Error: ${e}`);
        }

        try {
            const result = JSON.parse(responseText) as T | null;

            if (result === null) {
                throw new Error("Unexpected null response.");
            }

            return result;
        } catch (e) {
            throw new Error(`Invalid JSON: ${e}`);
        }
    }

    private getInit(methodInit: Method, body?: unknown): RequestInit {
        return {
            method: methodInit,
            headers: this.headersInit,
            body: JSON.stringify(body),
            mode: "cors",
        };
    }
}
