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

import { Component, Prop, Vue } from "vue-property-decorator";
import { Model } from "../model/Model";

@Component
// tslint:disable-next-line:no-default-export
export default class Content extends Vue {
    @Prop()
    public model?: Model;

    public onSubmitClicked(event: MouseEvent) {
        if (this.isValid()) {
            // Whatever
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private isValid() {
        // tslint:disable-next-line:no-unsafe-any
        return (this.$refs.form as any).validate();
    }
}
