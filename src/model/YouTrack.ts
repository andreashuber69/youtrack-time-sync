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

export interface IUser {
    readonly id: string;
}

export interface IIssue {
    id: string;
    readonly summary: string;
}

export interface IIssueWorkItem {
    readonly creator: {
        readonly id: string;
    };

    readonly date: number;

    readonly duration: {
        readonly minutes: number;
    };

    readonly issue: {
        id: string;
    };

    readonly text: string | null;

    readonly type: {
        readonly name: string;
    };
}

export interface IWorkItemType {
    readonly id: string;
    readonly name: string;
}

export interface ICreateIssueWorkItem {
    readonly date: number;

    readonly duration: {
        readonly minutes: number;
    };

    readonly text?: string;

    readonly type?: {
        readonly id: string;
    };
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

export class YouTrack {
    public constructor(private readonly baseUrl: string, authenticationToken: string) {
        this.headersInit = new Headers([
            ["Accept", "application/json"],
            ["Authorization", `Bearer ${authenticationToken}`],
            ["Cache-Control", "no-cache"],
            ["Content-Type", "application/json"],
        ]);
    }

    public getCurrentUser() {
        return this.get<IUser>("youtrack/api/admin/users/me");
    }

    public async getIssue(issueId: string) {
        try {
            const issue = await this.get<IIssue>(`youtrack/api/issues/${issueId}`, [["fields", "id,summary"]]);

            // The YouTrack REST interface always returns issue IDs in the <number>-<number> format, but allows queries
            // in the <string>-<number> and the <number>-<number> format. The following makes sure that the returned
            // data will always refer to the issueId passed to this method.
            issue.id = issueId;

            return issue;
        } catch (e) {
            throw new Error(`Failed to get issue id "${issueId}": ${e instanceof Error && e.message || e}`);
        }
    }

    public getIssues(issueIds: string[]) {
        return Promise.all([...issueIds].map((issueId) => this.getIssue(issueId)));
    }

    public async getWorkItems(issueId: string) {
        let result: IIssueWorkItem[];

        try {
            result = await this.batchedGet<IIssueWorkItem[], IIssueWorkItem>(
                YouTrack.getWorkItemsPath(issueId), YouTrack.workItemsParams);
        } catch (e) {
            throw new Error(
                `Failed to get work items for issue id "${issueId}": ${e instanceof Error && e.message || e}`);
        }

        for (const workItem of result) {
            workItem.issue.id = issueId;
        }

        return result;
    }

    public async getWorkItemsForUser(user: IUser, issueIds: string[]) {
        const workItemsArray = await Promise.all([...issueIds].map((issueId) => this.getWorkItems(issueId)));

        return new Array<IIssueWorkItem>().concat(...workItemsArray).filter(
            (workItem) => workItem.creator.id === user.id);
    }

    public getWorkItemTypes() {
        return this.get<IWorkItemType[]>(
            "youtrack/api/admin/timeTrackingSettings/workItemTypes", [["fields", "id,name"]]);
    }

    public async createWorkItem(issueId: string, workItem: ICreateIssueWorkItem) {
        const result =
            await this.post<IIssueWorkItem>(YouTrack.getWorkItemsPath(issueId), YouTrack.workItemsParams, workItem);

        result.issue.id = issueId;

        return result;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static readonly workItemsParams: [[string, string]] =
        [["fields", "creator(id),date,duration(minutes),issue(id),text,type(name)"]];

    private static getWorkItemsPath(issueId: string) {
        return `youtrack/api/issues/${issueId}/timeTracking/workItems`;
    }

    private static parse<T>(responseText: string) {
        let result: T | null;

        try {
            result = JSON.parse(responseText) as T | null;
        } catch (e) {
            throw new Error(`Parse Failure: ${e}`);
        }

        if (result === null) {
            throw new Error("Unexpected null response.");
        }

        return result;
    }

    private readonly headersInit: Headers;

    private get<T>(path: string, params?: Array<[string, string]>) {
        return this.fetch<T>(path, this.getInit("GET"), params);
    }

    private async batchedGet<T extends U[], U>(path: string, params?: Array<[string, string]>) {
        const result = new Array<U>();
        let skip = 0;

        // tslint:disable-next-line: no-empty
        while (skip = await this.appendBatch<T, U>(result, path, skip, params)) {
        }

        return result;
    }

    private async appendBatch<T extends U[], U>(
        result: U[], path: string, skip: number, params?: Array<[string, string]>) {
        const top = 30;
        const batchParams = [...(params || [])];
        batchParams.push(["$skip", skip.toString()], ["$top", top.toString()]);
        result.push(...await this.get<T>(path, batchParams));

        return (result.length === skip + top) ? result.length : 0;
    }

    private post<T>(path: string, params?: Array<[string, string]>, body?: unknown) {
        return this.fetch<T>(path, this.getInit("POST", body), params);
    }

    private getInit(methodInit: Method, body?: unknown): RequestInit {
        return {
            method: methodInit,
            headers: this.headersInit,
            body: JSON.stringify(body),
            mode: "cors",
        };
    }

    private async fetch<T>(path: string, requestInit: RequestInit, params?: Array<[string, string]>) {
        let response: Response;
        const url = new URL(path, this.baseUrl);

        if (params) {
            for (const param of params) {
                url.searchParams.append(param[0], param[1]);
            }
        }

        try {
            response = await window.fetch(url.href, requestInit);
        } catch (e) {
            throw new Error(`Network Error: ${e}`);
        }

        if (!response.ok) {
            throw new Error(`Response Status: ${response.status} ${response.statusText}`);
        }

        return YouTrack.parse<T>(await response.text());
    }
}
