<template>
  <div id="app">
    <div id="view"></div>
    <div>
      <button @click="renderTwoBars">两根柱子</button>
      <button @click="renderThreeBars">三根柱子</button>
      <button @click="renderFourBars">四根柱子</button>
    </div>
  </div>
</template>

<script>
import { createVegaSankeyChart } from '../../';
import {sourceDataV2,sourceDataV3,sourceDataV4} from "./data";

export default {
  name: "App",
  data() {
    return {
      view: null,
    };
  },
  methods: {
    resize() {
      this.view.resize();
    },
    renderTwoBars(){
      this.view = createVegaSankeyChart(sourceDataV2, {
        renderOption: {
          barWidth: 30,
          labelLimitSize: 10,
          showBarBorder: true,
          nonRoutineGroup: {
            groupId: 'G0',
            groupColor: '#f0f8ff4a',
            lineColor: '#00000000'
          }
        },
        vegaViewOpts: {
          resize: "fit",
          renderer: "canvas", // renderer (canvas or svg)
          container: "#view", // parent DOM container
          hover: true, // enable hover processing
        }
      });
      this.view.height(600);
      this.view.width(700);
      this.view.runAsync();
    },
    renderThreeBars(){
      this.view = createVegaSankeyChart(sourceDataV3, {
        renderOption: {
          barWidth: 30,
          labelLimitSize: 10,
          showBarBorder: true,
          labelReplacement: {
            groupId: {
              G0: '未参考'
            }
          },
          nonRoutineGroup: {
            groupId: 'G0',
            groupColor: '#f0f8ff00',
            // groupColor: '#f0f8ff4a',
            // lineColor: '#00000000'
          }
        },
        vegaViewOpts: {
          resize: "fit",
          renderer: "canvas", // renderer (canvas or svg)
          container: "#view", // parent DOM container
          hover: true, // enable hover processing
        }
      });
      this.view.height(600);
      this.view.width(700);
      this.view.runAsync();
    },
    renderFourBars(){
      this.view = createVegaSankeyChart(sourceDataV4, {
        renderOption: {
          barWidth: 30,
          labelLimitSize: 10,
          showBarBorder: true,
          nonRoutineGroup: {
            groupId: 'G0',
            groupColor: '#f0f8ff4a',
            lineColor: '#00000000'
          }
        },
        vegaViewOpts: {
          resize: "fit",
          renderer: "canvas", // renderer (canvas or svg)
          container: "#view", // parent DOM container
          hover: true, // enable hover processing
        }
      });
      this.view.height(600);
      this.view.width(700);
      this.view.runAsync();
    }
  },
  mounted() {
    this.renderThreeBars();
  },
};
</script>

<style>
#app {
  height: 1000px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#vis {
  height: 500px;
}
</style>
