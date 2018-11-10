// tslint:disable:file-name-casing
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

// tslint:disable-next-line:ordered-imports
import Vue from "vue";
// tslint:disable-next-line:match-default-export-name
import App from "./App.vue";
// tslint:disable-next-line:no-import-side-effect
import "./plugins/vuetify";

Vue.config.productionTip = false;

new Vue({
    // tslint:disable-next-line:no-unsafe-any
    render: (h) => h(App),
}).$mount("#app");