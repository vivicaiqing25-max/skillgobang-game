<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const store = useGameStore()

onMounted(() => {
  if (!store.match || store.settleWinner === null) router.replace('/')
})

const score = computed(() => store.score)
const winner = computed(() => store.settleWinner)
const settleToast = computed(() => store.settleToast)
const mode = computed(() => store.mode)

const winnerName = computed(() => {
  if (winner.value === null) return ''
  if (mode.value === 'vs_ai') return winner.value === 0 ? '玩家' : 'AI'
  return winner.value === 0 ? 'Player 1' : 'Player 2'
})

const loserName = computed(() => {
  if (winner.value === null) return ''
  if (mode.value === 'vs_ai') return winner.value === 0 ? 'AI' : '玩家'
  return winner.value === 0 ? 'Player 2' : 'Player 1'
})

function exitGame() {
  router.push('/')
}

function playAgain() {
  store.startMatch()
  router.push('/game')
}
</script>

<template>
  <div class="settle-view">
    <div v-if="settleToast" class="toast">{{ settleToast }}</div>
    <h2 class="score-title">最终比分</h2>
    <p class="final-score">{{ score[0] }} : {{ score[1] }}</p>
    <div class="result-area">
      <div class="winner-block">
        <span class="winner-name">{{ winnerName }}</span>
        <span class="winner-label">获胜</span>
      </div>
      <div class="loser-block">
        <span class="loser-name">{{ loserName }}</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn exit" @click="exitGame">退出游戏</button>
      <button class="btn again" @click="playAgain">再来一局</button>
    </div>
  </div>
</template>

<style scoped>
.settle-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.toast {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(241, 196, 15, 0.9);
  color: #1a1a2e;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
}
.score-title {
  color: #a0a0a0;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.final-score {
  font-size: 2.5rem;
  font-weight: 700;
  color: #e8e8e8;
  margin-bottom: 2rem;
}
.result-area {
  position: relative;
  margin-bottom: 3rem;
}
.winner-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.winner-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #e8e8e8;
}
.winner-label {
  font-size: 0.9rem;
  color: #27ae60;
}
.loser-block {
  position: absolute;
  right: -2rem;
  bottom: -0.5rem;
  transform: scale(0.7);
  opacity: 0.7;
}
.loser-name {
  font-size: 1rem;
  color: #666;
  filter: grayscale(0.8);
}
.actions {
  display: flex;
  gap: 1rem;
}
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.15s;
}
.btn:hover {
  transform: translateY(-2px);
}
.btn.exit {
  background: #4a4a5a;
  color: #e8e8e8;
}
.btn.again {
  background: linear-gradient(135deg, #4a69bd 0%, #3d5a9a 100%);
  color: #fff;
}
</style>
