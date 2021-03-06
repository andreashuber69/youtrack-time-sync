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
  <v-form ref="form" v-model="valid">
    <v-container grid-list-lg>
      <v-layout row wrap>
        <v-flex xs12>
          <v-text-field
            label="YouTrack Base URL" hint="Example: 'https://company.myjetbrains.com"
            v-model="checkedModel.youTrackBaseUrl" required :autofocus="!checkedModel.youTrackBaseUrl" :rules="rules"
            :error-messages="networkError">
          </v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            label="YouTrack Authentication Token" hint="Example: 'perm:QUhV.VGVzdDI=.6fRv9xZztORX9LquKaXJHxf5lsKyoO'"
            v-model="checkedModel.youTrackToken" required
            :autofocus="checkedModel.youTrackBaseUrl && !checkedModel.youTrackToken" :rules="rules"
            :error-messages="networkError"
            :append-icon="showToken ? 'visibility_off' : 'visibility'" :type="showToken ? 'text' : 'password'"
            @click:append="showToken = !showToken">
          </v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            ref="excelFileField" label="Excel File"
            v-model="checkedModel.filename" required readonly
            :disabled="!checkedModel.youTrackBaseUrl || !checkedModel.youTrackToken" :rules="rules"
            :error-messages="fileError" append-icon="open_in_browser" @click:append="$refs.fileInput.click()">
          </v-text-field>
          <input
            ref="fileInput" type="file" :accept="checkedModel.fileExtension"
            style="display:none" @change="onFileInputChanged">
        </v-flex>
        <v-flex xs12>
          <v-card>
            <v-card-title>
              <h3 class="headline">Unreported Spent Time</h3>
            </v-card-title>
            <v-data-table
              :headers="timeHeaders" :loading="isLoading"
              :items="checkedModel.times" :server-items-length="checkedModel.times.length" hide-default-footer>
              <template v-slot:no-data>
                {{ noSpentTimeText }}
              </template>
              <template v-slot:item.date="{ value }">
                {{ value.toLocaleDateString() }}
              </template>
              <template v-slot:item.comments="{ value }">
                <span style="white-space:pre">{{ value.join("\n") }}</span>
              </template>
              <template v-slot:item.durationMinutes="{ value }">
                {{ (value / 60).toFixed(2) + "h" }}
              </template>
            </v-data-table>          
          </v-card>
        </v-flex>
        <v-flex xs12>
          <v-layout justify-center>
            <v-btn color="primary" :disabled="!valid || (checkedModel.times.length === 0)" @click="onReportNowClicked">
              Report Now
            </v-btn>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-container>
    <StatusSnackbar ref="statusSnackbar"></StatusSnackbar>
  </v-form>
</template>

<script src="./Content.vue.ts" lang="ts">
</script>

<style>
</style>
