<!--
   Copyright (C) 2018-2019 Andreas Huber Dönni

   This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
   License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
   version.

   This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
   warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

   You should have received a copy of the GNU General Public License along with this program. If not, see
   <http://www.gnu.org/licenses/>.
-->

<template>
  <v-app>
    <v-navigation-drawer v-model="isDrawerVisible" app dark temporary>
      <v-list dense nav>
        <v-list-item link @click="onAboutClicked">
          <v-list-item-icon>
            <v-icon>help</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>About</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app dark>
      <v-app-bar-nav-icon title="Open menu" @click.stop="onMenuClicked"></v-app-bar-nav-icon>
      <v-toolbar-title class="hidden-xs-only"><v-icon>sync</v-icon><span class="application-title">&nbsp;&nbsp;{{ model.title }}</span></v-toolbar-title>
      <v-spacer></v-spacer>
    </v-app-bar>
    <v-content>
      <v-container>
        <Content :model="model"/>
        <AboutDialog ref="aboutDialog"/>
      </v-container>
    </v-content>
  </v-app>
</template>

<script src="./App.vue.ts" lang="ts">
</script>

<style scoped>
.application-title {
  vertical-align: middle;
}
</style>