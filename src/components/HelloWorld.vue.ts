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

@Component
// tslint:disable-next-line:no-default-export
export default class HelloWorld extends Vue {
    public ecosystem = [
        {
            text: "vuetify-loader",
            href: "https://github.com/vuetifyjs/vuetify-loader",
        },
        {
            text: "github",
            href: "https://github.com/vuetifyjs/vuetify",
        },
        {
            text: "awesome-vuetify",
            href: "https://github.com/vuetifyjs/awesome-vuetify",
        },
    ];

    public importantLinks = [
        {
            text: "Documentation",
            href: "https://vuetifyjs.com",
        },
        {
            text: "Chat",
            href: "https://community.vuetifyjs.com",
        },
        {
            text: "Made with Vuetify",
            href: "https://madewithvuetifyjs.com",
        },
        {
            text: "Twitter",
            href: "https://twitter.com/vuetifyjs",
        },
        {
            text: "Articles",
            href: "https://medium.com/vuetify",
        },
    ];

    public whatsNext = [
        {
            text: "Explore components",
            href: "https://vuetifyjs.com/components/api-explorer",
        },
        {
            text: "Select a layout",
            href: "https://vuetifyjs.com/layout/pre-defined",
        },
        {
            text: "Frequently Asked Questions",
            href: "https://vuetifyjs.com/getting-started/frequently-asked-questions",
        },
    ];
}
