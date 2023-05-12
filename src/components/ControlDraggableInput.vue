<script lang="ts" setup>
  import { computed, nextTick, ref, watch, WatchStopHandle } from 'vue';
  import { listenDom } from '../utils/event';
  import { exitPointerLock } from '../utils/pointer-lock';

  interface ControlDraggableProps {
    modelValue: number;
    multiple?: boolean | undefined;
    format?: (value: number) => string | number;
    parse?: (value: string) => number;
    max?: number | undefined;
    min?: number | undefined;
    bgColor?: string;
    color?: string;
  }

  interface ControlDraggableEmits {
    (e: 'focus'): void;

    (e: 'blur'): void;

    (e: 'input', value: number): void;

    (e: 'change', value: number): void;

    (e: 'drag-input', value: number): void;

    (e: 'drag-start', value: number): void;

    (e: 'drag'): void;

    (e: 'drag-end'): void;
  }

  const props = withDefaults(defineProps<ControlDraggableProps>(), {
    format: (value: number) => value.toString(),
    parse: (value: string) => +value,
    bgColor: 'grey',
    max: Infinity,
    min: -Infinity,
  });
  const emit = defineEmits<ControlDraggableEmits>();

  const refElement = ref<HTMLElement | null>(null);
  const refInput = ref<HTMLInputElement | null>(null);
  const dragStartValue = ref(0);
  const startX = ref(0);
  const currentX = ref(0);
  const step = ref(1);
  const boost = ref(1);
  const instanceValue = ref(props.modelValue);
  const hasInput = ref(false);
  const shouldValue = ref<string | number>(0);

  const formattedValue = computed(() => props.format ? props.format(instanceValue.value) : instanceValue.value);
  const bgColorStyle = computed(() => `background-color: ${props.bgColor}`);
  const colorStyle = computed(() => `color: ${props.color}`);

  const listeners: any[] = [];
  const dragLimit = 300;

  let dragging = false;
  let currentDirection = 0;
  let stopWatchHasInput: WatchStopHandle;

  function destroyListeners() {
    listeners.forEach(off => off());
  }

  function destroyMouseLockData() {
    exitPointerLock();
    destroyListeners();
  }

  function mouseLockChange(event: any) {
    if ((event.type === 'pointerlockchange' && !document.pointerLockElement) || (event.type === 'mozpointerlockchange')) {
      destroyMouseLockData();
    }
  }

  function getStepBoostedValue(value: number) {
    const delta = Math.abs(value);
    if (delta < 25) {
      return value * step.value;
    } else if (delta < 50) {
      return value * (step.value * boost.value);
    } else if (delta < 100) {
      return value * (step.value * Math.pow(boost.value, 2));
    }

    return value * (step.value * Math.pow(boost.value, 4));
  }

  function setValue(value: number) {
    instanceValue.value = value;
    emit('input', value);
  }

  function watcherHasInput(value: boolean) {
    if (value) {
      nextTick(() => {
        if (refInput.value) {
          refInput.value.focus();
        }
      });
      stopWatchHasInput();
    }
  }

  function blurInput() {
    hasInput.value = false;
    refInput.value?.blur();
    emit('blur');
  }

  function onBlur(event: any) {
    blurInput();
  }

  function onFocus(event: any) {
    emit('focus');
  }

  function onDragStart(event: MouseEvent) {
    const { buttons, x } = event;

    event.stopPropagation();
    event.preventDefault();
    window.activeElement?.blur();

    if (buttons === 2) {
      return;
    }

    startX.value = x;
    currentX.value = x;

    dragStartValue.value = props.multiple ? 0 : isNaN(instanceValue.value) ? props.min ?? 0 : instanceValue.value;
    listeners.push(listenDom(document, 'mousemove', onDrag));

  }

  function onDrag(event: MouseEvent) {
    const { movementX } = event;
    // @see https://bugs.chromium.org/p/chromium/issues/detail?id=934658#c2
    if (Math.abs(movementX) >= dragLimit) {
      return;
    }

    if (!dragging) {
      emit('drag-start', dragStartValue.value);
      refElement.value?.requestPointerLock();

      listeners.push(listenDom(document, 'mouseup', onDragEnd));
      listeners.push(listenDom(document, 'pointerlockchange', mouseLockChange));
      listeners.push(listenDom(document, 'mozpointerlockchange', mouseLockChange));

      return (dragging = true);
    }

    const newCurrentX = currentX.value + getStepBoostedValue(movementX);
    const direction = movementX >= 0 ? 1 : -1;
    const delta = currentX.value - startX.value;
    const value = Math.min(Math.max(dragStartValue.value + delta, props.min ?? -Infinity), props.max ?? Infinity);

    if (currentDirection !== direction) {
      startX.value = currentX.value;
      currentDirection = direction;
      dragStartValue.value = value;
      return;
    }

    currentX.value = newCurrentX;
    currentDirection = direction;

    setValue(value);
    emit('drag-input', value);
    emit('drag');
  }

  function onDragEnd() {
    destroyMouseLockData();
    if (dragging) {
      dragging = false;
      emit('drag-end');
    }
  }

  function onClick() {
    stopWatchHasInput = watch(hasInput, watcherHasInput, { immediate: true });
    shouldValue.value = formattedValue.value;
    hasInput.value = true;
  }

  let beforeValue: number;

  function onInput(event: any) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    // if (beforeValue == undefined) {
    //   beforeValue = instanceValue.value;
    // }


    if (hasInput.value) {
      shouldValue.value = value;
    }

    let result = props.parse ? props.parse(value) : +value;

    if (Number.isNaN(result)) {
      result = 0;
    }

    if (props.min != undefined) {
      result = Math.max(result, props.min);
    }
    if (props.max != undefined) {
      result = Math.min(result, props.max);
    }


    setValue(result);
    emit('input', result);
    setTimeout(() => {
      emit('change', result);
    }, 300);
  }

  function onKeydownInput(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        blurInput();
        break;
      case 'Escape':
        instanceValue.value = dragStartValue.value;
        blurInput();
        break;
    }
  }

  watch(hasInput, (value) => {
    if (!value) return;
    refInput.value?.focus();
    refInput.value?.select();
  });
</script>

<template>
  <div
      ref="refElement"
      class="relative-position control-draggable-input"
      :style="[bgColorStyle, colorStyle]"
  >
    <input
        ref="refInput"
        type="text"
        class="control-draggable-input__input"
        :class="[!hasInput && 'invisible']"
        :value="formattedValue"
        @blur="onBlur"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeydownInput"
    />
    <div
        class="control-draggable__slider"
        :class="[
            hasInput && 'invisible',
            hasInput && 'no-pointer-events',
        ]"
    >
      <div
          class="fit"
          tabindex="0"
          @mousedown.stop.prevent="onDragStart"
          @mouseup="onDragEnd"
          @click="onClick"
      >
        {{ formattedValue }}
      </div>
    </div>
  </div>
</template>

<style scoped>
  .control-draggable-input {
    border-radius: 3px;
    display: flex;
    justify-content: center;
    font-size: 1em;
    line-height: 22px;
    letter-spacing: .00937em;
    cursor: e-resize;
    padding: 6px 0;
    background: rgba(255, 255, 255, .07);
  }

  .control-draggable-input:before {
    transition: opacity .36s cubic-bezier(.4, 0, .2, 1), background .36s cubic-bezier(.4, 0, .2, 1);
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }

  .control-draggable-input:hover:before {
    background: rgba(255, 255, 255, .07);
  }

  .control-draggable-input__input {
    font-weight: 400;
    line-height: inherit;
    letter-spacing: .00937em;
    text-decoration: inherit;
    text-transform: inherit;
    border: none;
    border-radius: 0;
    background: none;
    color: #000000de;
    outline: 0;
    padding: 0;
  }

  .control-draggable__slider {
    font-size: inherit;
    user-select: none;
  }

  .control-draggable-input__input,
  .control-draggable__slider {
    text-align: center;
    width: 100%;
  }

  .relative-position {
    position: relative;
  }

  input {
    text-align: center;
    font-size: inherit;
  }

  .absolute-full {
    position: absolute;
    inset: 0;
  }

  .fit {
    width: 100%;
    height: 100%;
  }

  .invisible {
    display: none;
  }
</style>