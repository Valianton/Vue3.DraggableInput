<script setup lang="ts">
  import ControlDraggableInput from './components/ControlDraggableInput.vue';
  import { ref } from 'vue';

  const modelMinMax = ref(33);
  const modelInfinity = ref(0);
  const modelFormatParse = ref(100);

  function formatTime(time: number): string {
    const date = new Date(time * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const milliseconds = (time % 1).toFixed(1).substring(2);
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  function convertDateToInteger(dateString: string): number {
    const [hours, minutes, secondsWithMilliseconds] = dateString.split(':').map(Number);
    const [seconds, milliseconds] = String(Number(secondsWithMilliseconds)).split('.').map(Number);

    const totalMilliseconds = ((hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000) + milliseconds);
    return totalMilliseconds;
  }

  function parseTime(time: string) {
    debugger;
    return convertDateToInteger(time);
  }

  function onInput(value: any) {
    // console.log(value);
  }
</script>

<template>
  <div class="d-page-content">
    <h1 class="d-header d-h1">Control Draggable Input</h1>
    <h4 class="d-header">Simple infinity Draggable input</h4>
    <div class="sample-wrapper">
      <ControlDraggableInput
          bg-color="#f0f0f0"
          v-model:model-value="modelInfinity"
          @input="onInput"
      />
    </div>
    <h4 class="d-header">Format/parse example</h4>
    <div class="sample-wrapper">
      <ControlDraggableInput
          v-model:model-value="modelFormatParse"
          bg-color="#f0f0f0"
          :min="0"
          :format="formatTime"
          :parse="parseTime"
      />
    </div>
    <h4 class="d-header">Min/max example</h4>
    <div class="sample-wrapper">
      <ControlDraggableInput
          bg-color="#f0f0f0"
          v-model:model-value="modelMinMax"
          :min="33"
          :max="333"
      />
    </div>
  </div>
</template>