<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { getColorMapping, getOpponentStone, getStone } from '@/game/match'
import { getWinningLine } from '@/game/board'
import { skillNeedsSelectOpponentStone } from '@/game/skills'
import PlayerInfo from '@/components/PlayerInfo.vue'
import DrawnSkillCard from '@/components/DrawnSkillCard.vue'
import GameBoard from '@/components/GameBoard.vue'
import SkillDeck from '@/components/SkillDeck.vue'
import SkillConfirmBar from '@/components/SkillConfirmBar.vue'
import { aiDecide, aiPlace, aiSelectOpponentStone, aiSelectMoveTarget } from '@/ai'

const router = useRouter()
const store = useGameStore()

onMounted(() => {
  if (!store.match) router.replace('/')
})

const highlightCell = computed(() => {
  const sp = skillPending.value
  if (!sp || sp.selectedRow == null || sp.selectedCol == null) return null
  return { row: sp.selectedRow, col: sp.selectedCol }
})
const highlightTarget = computed(() => {
  const sp = skillPending.value
  if (!sp || sp.targetRow == null || sp.targetCol == null) return null
  return { row: sp.targetRow, col: sp.targetCol }
})

const game = computed(() => store.currentGame)
const score = computed(() => store.score)
const currentPlayer = computed(() => store.currentPlayer)
const canDrawSkill = computed(() => store.canDrawSkill)
const isInSkillFlow = computed(() => store.isInSkillFlow)
const pendingSkill = computed(() => store.pendingSkill)
const skillPending = computed(() => store.skillPending)
const mode = computed(() => store.mode)

const playerNames = computed(() => {
  if (store.mode === 'vs_ai') return ['玩家', 'AI']
  return ['Player 1', 'Player 2']
})

const player0Color = computed(() => {
  const g = game.value
  if (!g) return 'black'
  return g.blackPlayer === 0 ? 'black' : 'white'
})
const player1Color = computed(() => {
  const g = game.value
  if (!g) return 'white'
  return g.blackPlayer === 1 ? 'black' : 'white'
})

const skillPoints = computed(() => game.value?.skillPoints ?? [0, 0])
const board = computed(() => game.value?.board ?? [])

const WIN_LINE_DELAY_MS = 2000
const AI_ACTION_DELAY_MS = 700
const AI_NEXT_TURN_DELAY_MS = 1000

function goToSettleAfterDelay() {
  setTimeout(() => {
    store.goToSettle()
    router.push('/settle')
  }, WIN_LINE_DELAY_MS)
}

function showWinningLineThenContinue() {
  setTimeout(() => {
    const { matchOver } = store.commitGameEnd()
    if (matchOver) {
      store.goToSettle()
      router.push('/settle')
    }
  }, WIN_LINE_DELAY_MS)
}

const winningLine = computed(() => {
  const g = game.value
  if (!g || g.result === 'playing' || g.result === 'draw') return null
  const stone = g.result === 'black_win' ? 1 : 2
  return getWinningLine(g.board, stone)
})

const selectableOpponent = computed(() => {
  const sp = skillPending.value
  if (!sp || !game.value) return false
  const needOpp = skillNeedsSelectOpponentStone(sp.skillId)
  const hasSelected = sp.selectedRow != null && sp.selectedCol != null
  if (sp.skillId === 'move_opponent') {
    return needOpp && (hasSelected ? false : true)
  }
  return needOpp && !hasSelected
})

const selectableEmpty = computed(() => {
  const sp = skillPending.value
  if (!sp || sp.skillId !== 'move_opponent' || !game.value) return false
  const hasStone = sp.selectedRow != null && sp.selectedCol != null
  return hasStone
})

/** 选子阶段只能选对方棋子时，对方棋子的颜色 1 或 2 */
const selectableOpponentStone = computed(() => {
  const g = game.value
  const sp = skillPending.value
  if (!g || !sp || !selectableOpponent.value) return null
  const mapping = getColorMapping(g)
  return getOpponentStone(mapping, g.currentPlayer)
})

const confirmBarVisible = computed(() => {
  const sp = skillPending.value
  if (!sp) return false
  if (sp.skillId === 'fly_sand') {
    return sp.selectedRow != null && sp.selectedCol != null
  }
  if (sp.skillId === 'move_opponent') {
    return (
      sp.selectedRow != null &&
      sp.selectedCol != null &&
      sp.targetRow != null &&
      sp.targetCol != null
    )
  }
  return false
})

const confirmBarMessage = computed(() => {
  const sp = skillPending.value
  if (!sp) return ''
  if (sp.skillId === 'fly_sand') return '确认移除该子？'
  if (sp.skillId === 'move_opponent') return '确认移动到此位置？'
  return ''
})

const boardDisabled = computed(() => {
  if (store.isGameOver) return true
  if (store.mode === 'vs_ai' && currentPlayer.value === 1) return true
  if (isInSkillFlow.value) {
    return !selectableOpponent.value && !selectableEmpty.value
  }
  return false
})

function handleCellClick(row: number, col: number) {
  if (store.isGameOver) return
  if (isInSkillFlow.value) {
    const sp = skillPending.value
    if (!sp) return
    if (sp.skillId === 'fly_sand') {
      const g = game.value
      if (!g) return
      const opp = (1 - g.currentPlayer) as 0 | 1
      const oppStone = g.blackPlayer === opp ? 1 : 2
      if (board.value[row][col] !== oppStone) return
      store.setSkillSelection(row, col)
      return
    }
    if (sp.skillId === 'move_opponent') {
      if (sp.selectedRow == null) {
        const g = game.value
        if (!g) return
        const opp = (1 - g.currentPlayer) as 0 | 1
        const oppStone = g.blackPlayer === opp ? 1 : 2
        if (board.value[row][col] !== oppStone) return
        store.setSkillSelection(row, col)
      } else {
        if (board.value[row][col] !== 0) return
        store.setSkillTarget(row, col)
      }
      return
    }
    return
  }
  const ret = store.placeStone(row, col)
  if (ret.ok && ret.needReplay) {
    store.resetForReplay()
  }
  if (ret.ok && ret.gameEnded) showWinningLineThenContinue()
}

function handleConfirm() {
  const sp = skillPending.value
  if (!sp) return
  if (sp.skillId === 'fly_sand' && sp.selectedRow != null && sp.selectedCol != null) {
    const ret = store.confirmSkillSelection(sp.selectedRow, sp.selectedCol)
    if (ret.ok && ret.matchOver) goToSettleAfterDelay()
    return
  }
  if (
    sp.skillId === 'move_opponent' &&
    sp.selectedRow != null &&
    sp.selectedCol != null &&
    sp.targetRow != null &&
    sp.targetCol != null
  ) {
    const ret = store.confirmSkillSelection(
      sp.selectedRow,
      sp.selectedCol,
      sp.targetRow,
      sp.targetCol
    )
    if (ret.ok && ret.matchOver) goToSettleAfterDelay()
  }
}

function handleCancel() {
  store.clearSkillSelection()
}

function handleDrawSkill() {
  const skillId = store.drawSkill()
  if (!skillId) return
  const g = game.value
  if (!g) return
  const instantWin = skillId === 'instant_win'
  const instantLose = skillId === 'instant_lose'
  const noSelection = !skillNeedsSelectOpponentStone(skillId)
  if (noSelection) {
    setTimeout(() => {
      const ret = store.confirmSkillSelection(0, 0)
      if (ret.ok && ret.matchOver) goToSettleAfterDelay()
    }, instantWin || instantLose ? 1500 : 1200)
  }
}

watch(
  () => [currentPlayer.value, store.match?.currentGame?.result],
  () => {
    if (store.mode !== 'vs_ai' || !game.value) return
    if (store.isGameOver) return
    if (currentPlayer.value !== 1) return
    const g = game.value
    if (g.result !== 'playing') return
    if (isInSkillFlow.value) return
    const timer = setTimeout(() => runAiTurn(), 900)
    return () => clearTimeout(timer)
  }
)

async function runAiTurn() {
  const g = game.value
  if (!g || g.result !== 'playing' || g.currentPlayer !== 1) return
  const hasExtraStones = g.extraStonesLeft > 0
  const decision = hasExtraStones ? 'place' : aiDecide(g)
  if (decision === 'place') {
    const pos = aiPlace(g)
    if (pos) {
      setTimeout(() => {
        const ret = store.placeStone(pos.row, pos.col)
        if (ret.ok && ret.gameEnded) showWinningLineThenContinue()
        if (ret.ok && ret.needReplay) store.resetForReplay()
        if (ret.ok && !ret.gameEnded && !ret.matchOver && store.mode === 'vs_ai' && store.currentPlayer === 1) setTimeout(() => runAiTurn(), AI_NEXT_TURN_DELAY_MS)
      }, AI_ACTION_DELAY_MS)
    }
    return
  }
  const skillId = store.drawSkill()
  if (!skillId) return
  if (skillNeedsSelectOpponentStone(skillId)) {
    const mapping = getColorMapping(g)
    const oppStone = getOpponentStone(mapping, g.currentPlayer)
    const pos = aiSelectOpponentStone(g.board, oppStone)
    if (skillId === 'fly_sand' && pos) {
      store.setSkillSelection(pos.row, pos.col)
      setTimeout(() => {
        const ret = store.confirmSkillSelection(pos.row, pos.col)
        if (ret.ok && ret.matchOver) goToSettleAfterDelay()
        else if (store.mode === 'vs_ai' && store.currentPlayer === 1) setTimeout(() => runAiTurn(), AI_NEXT_TURN_DELAY_MS)
      }, 1400)
      return
    }
    if (skillId === 'move_opponent') {
      if (!pos) {
        store.cancelSkill()
        setTimeout(() => runAiTurn(), AI_NEXT_TURN_DELAY_MS)
        return
      }
      store.setSkillSelection(pos.row, pos.col)
      const myStone = getStone(mapping, g.currentPlayer)
      const to = aiSelectMoveTarget(g.board, pos.row, pos.col, myStone)
      if (!to) {
        store.cancelSkill()
        setTimeout(() => runAiTurn(), AI_NEXT_TURN_DELAY_MS)
        return
      }
      setTimeout(() => {
        store.setSkillTarget(to.row, to.col)
        setTimeout(() => {
          const ret = store.confirmSkillSelection(pos.row, pos.col, to.row, to.col)
          if (ret.ok && ret.matchOver) goToSettleAfterDelay()
          else if (store.mode === 'vs_ai' && store.currentPlayer === 1) setTimeout(() => runAiTurn(), AI_NEXT_TURN_DELAY_MS)
        }, 1000)
      }, 1400)
    }
    return
  }
  const instantWin = skillId === 'instant_win'
  const instantLose = skillId === 'instant_lose'
  setTimeout(() => {
    const ret = store.confirmSkillSelection(0, 0)
    if (ret.ok && ret.matchOver) goToSettleAfterDelay()
    else if (store.mode === 'vs_ai' && store.currentPlayer === 1) setTimeout(() => runAiTurn(), AI_NEXT_TURN_DELAY_MS)
  }, instantWin || instantLose ? 1500 : 1200)
}

</script>

<template>
  <div class="game-view">
    <header class="game-header">
      <div class="players">
        <div class="player-column">
          <PlayerInfo
            :name="playerNames[0]"
            :color="player0Color"
            :skill-points="skillPoints[0]"
            :is-active="currentPlayer === 0"
          />
          <DrawnSkillCard
            v-if="pendingSkill && currentPlayer === 0"
            :skill-id="pendingSkill"
          />
        </div>
        <span class="score">{{ score[0] }} : {{ score[1] }}</span>
        <div class="player-column">
          <PlayerInfo
            :name="playerNames[1]"
            :color="player1Color"
            :skill-points="skillPoints[1]"
            :is-active="currentPlayer === 1"
          />
          <DrawnSkillCard
            v-if="pendingSkill && currentPlayer === 1"
            :skill-id="pendingSkill"
          />
        </div>
      </div>
    </header>
    <main class="game-main">
      <GameBoard
        :board="board"
        :highlight-cell="highlightCell"
        :highlight-target="highlightTarget"
        :selectable-opponent="selectableOpponent"
        :selectable-opponent-stone="selectableOpponentStone"
        :selectable-empty="selectableEmpty"
        :disabled="boardDisabled"
        :winning-line="winningLine"
        @cell-click="handleCellClick"
      />
      <SkillConfirmBar
        :visible="confirmBarVisible"
        :message="confirmBarMessage"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
      <SkillDeck
        :can-draw="canDrawSkill"
        :disabled="boardDisabled"
        @draw="handleDrawSkill"
      />
    </main>
    <div v-if="pendingSkill && (selectableOpponent || selectableEmpty || (mode === 'vs_ai' && currentPlayer === 1 && skillPending?.selectedRow != null))" class="pending-skill">
      <template v-if="mode === 'vs_ai' && currentPlayer === 1 && skillPending?.selectedRow != null">
        {{ skillPending?.targetRow != null ? 'AI 将把你的棋子移至此位置（红框）' : 'AI 已选中你的棋子（红框），即将执行技能' }}
      </template>
      <template v-else>
        {{ selectableOpponent ? '请选择对方的一颗棋子（仅限对方颜色）；点击取消可重新选择' : '请选择落子位置；点击取消可重新选择棋子' }}
      </template>
    </div>
  </div>
</template>

<style scoped>
.game-view {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
.game-header {
  margin-bottom: 1rem;
}
.players {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.player-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e8e8e8;
  min-width: 4rem;
  text-align: center;
}
.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pending-skill {
  margin-top: 0.5rem;
  color: #f1c40f;
  font-size: 0.9rem;
}
</style>
