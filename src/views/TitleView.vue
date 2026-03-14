<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import type { GameMode } from '@/types'

const router = useRouter()
const gameStore = useGameStore()

function start(mode: GameMode) {
  if (mode === 'online') return
  gameStore.setMode(mode)
  gameStore.startMatch()
  router.push('/game')
}

function showComingSoon() {
  alert('双人在线联机敬请期待！')
}
</script>

<template>
  <div class="title-view">
    <h1 class="game-title">技能五子棋</h1>
    <p class="subtitle">选择游戏模式</p>
    <div class="mode-buttons">
      <button class="mode-btn primary" @click="start('two_player')">
        双人单机
      </button>
      <button class="mode-btn primary" @click="start('vs_ai')">
        单人 vs AI
      </button>
      <button class="mode-btn disabled" @click="showComingSoon">
        双人在线联机（敬请期待）
      </button>
    </div>
  </div>
</template>

<style scoped>
.title-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.game-title {
  font-size: 2.5rem;
  color: #e8e8e8;
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
}
.subtitle {
  color: #a0a0a0;
  margin-bottom: 3rem;
}
.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 280px;
}
.mode-btn {
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: none;
  font-size: 1.1rem;
  transition: transform 0.15s, box-shadow 0.15s;
}
.mode-btn.primary {
  background: linear-gradient(135deg, #4a69bd 0%, #3d5a9a 100%);
  color: #fff;
}
.mode-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 105, 189, 0.4);
}
.mode-btn.disabled {
  background: #2a2a3e;
  color: #666;
  cursor: not-allowed;
}
</style>
