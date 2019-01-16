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
// tslint:disable-next-line:no-default-import
import AboutDialog from "./components/AboutDialog.vue";
// tslint:disable-next-line:no-default-import
import Content from "./components/Content.vue";
import { Model } from "./model/Model";

@Component({ components: { AboutDialog, Content } })
// tslint:disable-next-line:no-default-export
export default class App extends Vue {
    public isDrawerVisible = false;
    public readonly model = new Model();

    public onMenuClicked(event: MouseEvent) {
        this.isDrawerVisible = !this.isDrawerVisible;
    }

    public onAboutClicked(event: MouseEvent) {
        this.isDrawerVisible = false;
        (this.$refs.aboutDialog as AboutDialog).showDialog();
    }
}
