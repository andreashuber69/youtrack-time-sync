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
            label="YouTrack Base URL" hint="Example: 'https://company.myjetbrains.com"
            v-model="model.youTrackBaseUrl" required :autofocus="focusUrl" :rules="rules"
            :error-messages="networkError">
          </v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            label="YouTrack Authentication Token" hint="Example: 'perm:QUhV.VGVzdDI=.6fRv9xZztORX9LquKaXJHxf5lsKyoO'"
            v-model="model.youTrackToken" required :autofocus="focusToken" :rules="rules" :error-messages="networkError"
            :append-icon="showToken ? 'visibility_off' : 'visibility'" :type="showToken ? 'text' : 'password'"
            @click:append="showToken = !showToken">
          </v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            label="Excel File"
            v-model="model.filename" required readonly :disabled="disableFile" :rules="rules"
            :error-messages="fileError" append-icon="open_in_browser" @click:append="onOpenClicked">
          </v-text-field>
          <input
            ref="fileInput" type="file" :accept="model.fileExtension"
            style="display:none" @change="onFileInputChanged">
        </v-flex>
      </v-layout>
    </v-container>
    <v-container grid-list-md>
      <v-layout justify-center>
        <v-data-table :headers="timeHeaders" :items="times" hide-actions class="elevation-1">
          <template slot="items" slot-scope="props">
            <td>{{ props.item.date.toLocaleDateString() }}</td>
            <td>{{ props.item.title }}</td>
            <td>{{ props.item.summary }}</td>
            <td>{{ props.item.type }}</td>
            <td style="white-space:pre">{{ props.item.comment }}</td>
            <td class="text-xs-right">{{ (props.item.durationMinutes / 60).toFixed(2) + "h" }}</td>
          </template>
        </v-data-table>          
      </v-layout>
    </v-container>
    <v-container grid-list-md>
      <v-layout justify-center>
        <v-btn :disabled="!valid" @click="onSubmitClicked">Submit</v-btn>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script src="./Content.vue.ts" lang="ts">
</script>

<style>
</style>
