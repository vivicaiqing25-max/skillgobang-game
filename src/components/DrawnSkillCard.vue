<script setup lang="ts">
import type { SkillId } from '@/types'
import { SKILL_NAMES } from '@/game/skills'

defineProps<{
  skillId: SkillId
}>()
</script>

<template>
  <div class="drawn-card">
    <span class="label">抽中的技能</span>
    <span class="skill-name">{{ SKILL_NAMES[skillId] }}</span>
  </div>
</template>

<style scoped>
.drawn-card {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(145deg, #3d5a80 0%, #293241 100%);
  border: 2px solid #4a69bd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 100px;
}
.label {
  font-size: 0.7rem;
  color: #bdc3c7;
}
.skill-name {
  font-size: 1rem;
  font-weight: 600;
  color: #e8e8e8;
}
</style>
