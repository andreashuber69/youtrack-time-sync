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
  <v-dialog v-model="isOpen" width="960px">
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>
      <v-card-text>
        <v-container grid-list-md>
          <v-layout row wrap>
            <v-flex xs12>
              <v-card flat>
                <v-card-text class="text-center px-0">
                  Copyright &copy; 2018-{{ new Date(Date.now()).getUTCFullYear() }} Andreas Huber Dönni
                </v-card-text>
              </v-card>
            </v-flex>
            <v-flex xs12 sm4>
              <v-btn
                :href="`https://github.com/andreashuber69/${packageName}/blob/master/README.md#--`" target="_blank"
                color="primary" block text class="ma-0">
                Documentation
              </v-btn>
            </v-flex>
            <v-flex xs12 sm4>
              <v-btn
                :href="`https://github.com/andreashuber69/${packageName}/issues`" target="_blank"
                color="primary" block text class="ma-0">
                Issues
              </v-btn>
            </v-flex>
            <v-flex xs12 sm4>
              <v-btn
                :href="`https://raw.githubusercontent.com/andreashuber69/${packageName}/master/LICENSE`" target="_blank"
                color="primary" block text class="ma-0">
                License
              </v-btn>
            </v-flex>
            <v-flex xs12>
              <v-card flat>
                <v-card-text class="caption text-center px-0">{{ userAgent }}</v-card-text>
              </v-card>
            </v-flex>
          </v-layout>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="isOpen = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./AboutDialog.vue.ts" lang="ts">
</script>

<style scoped>
</style>
