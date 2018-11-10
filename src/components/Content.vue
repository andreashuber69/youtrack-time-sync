<!--
   Copyright (C) 2018 Andreas Huber Dönni

   This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
   License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
   version.

   This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
   warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

   You should have received a copy of the GNU General Public License along with this program. If not, see
   <http://www.gnu.org/licenses/>.
-->

<template>
  <v-form ref="form" v-model="valid">
    <v-container grid-list-md>
      <v-layout row wrap>
        <v-flex xs12>
          <v-text-field
            label="YouTrack Base URL" hint="Example: 'https://company.myjetbrains.com/youtrack'"
            v-model="model.youTrackBaseUrl" required :rules="rules">
          </v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            label="YouTrack Authentication Token" hint="Example: 'perm:QUhV.VGVzdDI=.6fRv9xZztORX9LquKaXJHxf5lsKyoO'"
            v-model="model.token" required :rules="rules"
            :append-icon="showToken ? 'visibility_off' : 'visibility'" :type="showToken ? 'text' : 'password'"
            @click:append="showToken = !showToken">
          </v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            label="Excel File"
            v-model="model.filename" required readonly :rules="rules"
            append-icon="open_in_browser" @click:append="onOpenClicked">
          </v-text-field>
          <input
            ref="fileInput" type="file" :accept="model.fileExtension"
            style="display:none" @change="onFileInputChanged">
        </v-flex>
        <v-btn :disabled="!valid" @click="onSubmitClicked">Submit</v-btn>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script src="./Content.vue.ts" lang="ts">
</script>

<style>
</style>
