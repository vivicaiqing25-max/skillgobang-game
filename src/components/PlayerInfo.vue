<script setup lang="ts">
defineProps<{
  name: string
  color: 'black' | 'white'
  skillPoints: number
  isActive: boolean
}>()
</script>

<template>
  <div class="player-info" :class="{ active: isActive }">
    <span class="name">{{ name }}</span>
    <span class="color-dot" :class="color"></span>
    <span class="points">技能点: {{ skillPoints }}</span>
  </div>
</template>

<style scoped>
.player-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  transition: background 0.2s;
}
.player-info.active {
  background: rgba(74, 105, 189, 0.25);
  outline: 1px solid rgba(74, 105, 189, 0.5);
}
.name { font-weight: 600; color: #e8e8e8; }
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.color-dot.black { background: #1a1a1a; border: 1px solid #444; }
.color-dot.white { background: #f5f5f5; border: 1px solid #999; }
.points { font-size: 0.9rem; color: #a0a0a0; }
</style>
