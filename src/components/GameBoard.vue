<script setup lang="ts">
import type { Cell } from '@/types'
import type { Point } from '@/types'

const CELL_SIZE = 28
const BOARD_PAD = 8

const props = defineProps<{
  board: Cell[][]
  highlightCell: { row: number; col: number } | null
  highlightTarget?: { row: number; col: number } | null
  selectableOpponent: boolean
  selectableOpponentStone?: number | null
  selectableEmpty: boolean
  disabled: boolean
  /** 五连成珠的 5 个点，用于画红线 */
  winningLine?: Point[] | null
}>()

const emit = defineEmits<{
  cellClick: [row: number, col: number]
}>()

function onClick(row: number, col: number) {
  if (props.disabled) return
  emit('cellClick', row, col)
}

function isHighlight(r: number, c: number) {
  const h = props.highlightCell
  const t = props.highlightTarget
  return (h && h.row === r && h.col === c) || (t && t.row === r && t.col === c)
}

function winningLineStyle(): { left: string; top: string; width: string; transform: string } | null {
  const line = props.winningLine
  if (!line || line.length < 2) return null
  const first = line[0]
  const last = line[line.length - 1]
  const x1 = BOARD_PAD + first.col * CELL_SIZE + CELL_SIZE / 2
  const y1 = BOARD_PAD + first.row * CELL_SIZE + CELL_SIZE / 2
  const x2 = BOARD_PAD + last.col * CELL_SIZE + CELL_SIZE / 2
  const y2 = BOARD_PAD + last.row * CELL_SIZE + CELL_SIZE / 2
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const angle = Math.atan2(y2 - y1, x2 - x1)
  return {
    left: `${x1}px`,
    top: `${y1}px`,
    width: `${len}px`,
    transform: `rotate(${angle}rad)`,
  }
}
</script>

<template>
  <div class="board-wrap">
    <div class="board" :class="{ disabled }">
      <div
        v-for="(row, r) in board"
        :key="r"
        class="row"
      >
        <div
          v-for="(cell, c) in row"
          :key="c"
          class="cell"
          :class="{
            black: cell === 1,
            white: cell === 2,
            highlight: isHighlight(r, c),
            selectable: (selectableOpponent && selectableOpponentStone != null && cell === selectableOpponentStone) || (selectableEmpty && cell === 0),
          }"
          @click="onClick(r, c)"
        >
          <span v-if="cell === 1" class="stone black"></span>
          <span v-else-if="cell === 2" class="stone white"></span>
        </div>
      </div>
      <div
        v-if="winningLineStyle()"
        class="win-line"
        :style="winningLineStyle()!"
      />
    </div>
  </div>
</template>

<style scoped>
.board-wrap {
  display: flex;
  justify-content: center;
  padding: 1rem;
}
.board {
  display: inline-flex;
  flex-direction: column;
  background: #c4a35a;
  padding: 8px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 2px #8b6914;
  position: relative;
}
.win-line {
  position: absolute;
  height: 4px;
  background: #c0392b;
  border-radius: 2px;
  transform-origin: 0 50%;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 4px rgba(192, 57, 43, 0.8);
}
.board.disabled {
  pointer-events: none;
  opacity: 0.85;
}
.row {
  display: flex;
}
.cell {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  border-radius: 2px;
}
.cell::before {
  content: '';
  position: absolute;
  inset: 50%;
  width: 5px;
  height: 5px;
  background: #4a3728;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.2);
}
.cell.selectable:hover {
  background: rgba(255, 200, 100, 0.4);
}
.cell.highlight {
  outline: 2px solid #c0392b;
  outline-offset: -2px;
  z-index: 1;
}
.stone {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  z-index: 2;
}
.stone.black {
  background: radial-gradient(circle at 30% 30%, #444, #1a1a1a);
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.stone.white {
  background: radial-gradient(circle at 30% 30%, #fff, #e0e0e0);
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
</style>
