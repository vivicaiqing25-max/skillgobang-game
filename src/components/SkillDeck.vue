<script setup lang="ts">
defineProps<{
  canDraw: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  draw: []
}>()
</script>

<template>
  <div class="skill-deck-wrap">
    <button
      class="skill-deck"
      :class="{ canDraw, disabled }"
      :disabled="disabled || !canDraw"
      @click="emit('draw')"
    >
      <span class="label">技能卡</span>
      <span v-if="canDraw" class="hint">消耗 3 点抽取</span>
    </button>
  </div>
</template>

<style scoped>
.skill-deck-wrap {
  padding: 1rem;
  display: flex;
  justify-content: center;
}
.skill-deck {
  width: 100px;
  height: 140px;
  background: linear-gradient(145deg, #2c3e50 0%, #1a252f 100%);
  border: 2px solid #34495e;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #bdc3c7;
  font-size: 1rem;
  transition: transform 0.15s, box-shadow 0.15s;
}
.skill-deck.canDraw:not(.disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.3);
}
.skill-deck:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.hint {
  font-size: 0.7rem;
  color: #7f8c8d;
}
</style>
