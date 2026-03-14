import type { Cell } from '@/types'
import type { GameState } from '@/game/match'
import { getStone, getOpponentStone, getColorMapping } from '@/game/match'
import { checkWinAt, placeStone, BOARD_SIZE } from '@/game/board'

const CENTER = (BOARD_SIZE - 1) / 2

/** 启发式评分：己方连子、堵对方、略偏中心；对方威胁权重大，便于与玩家抗衡 */
function evaluateBoard(board: Cell[][], myStone: 1 | 2, oppStone: 1 | 2): number {
  let score = 0
  const weight = [0, 1, 10, 100, 1000, 10000]
  const oppWeight = 1.8

  function countLine(r: number, c: number, dr: number, dc: number, stone: 1 | 2): number {
    let n = 0
    let i = r
    let j = c
    while (i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE && board[i][j] === stone) {
      n++
      i += dr
      j += dc
    }
    return n
  }

  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) continue
      for (const [dr, dc] of dirs) {
        const myCount = countLine(r, c, dr, dc, myStone) + countLine(r, c, -dr, -dc, myStone) - 1
        const oppCount = countLine(r, c, dr, dc, oppStone) + countLine(r, c, -dr, -dc, oppStone) - 1
        if (myCount > 0 && myCount < 6) score += weight[myCount]
        if (oppCount > 0 && oppCount < 6) score -= weight[oppCount] * oppWeight
      }
    }
  }
  return score
}

/** 中心偏好：开局或同分时优先占中，便于展开与防守 */
function centerBias(row: number, col: number): number {
  const d = (row - CENTER) ** 2 + (col - CENTER) ** 2
  return 15 - d * 0.15
}

/** 找最佳落子位置；同分时随机选一个，避免每局落子顺序固定 */
function bestMove(game: GameState): { row: number; col: number } | null {
  const mapping = getColorMapping(game)
  const me = game.currentPlayer
  const myStone = getStone(mapping, me)
  const oppStone = getOpponentStone(mapping, me)
  const board = game.board

  let bestScore = -Infinity
  const bestList: { row: number; col: number }[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) continue
      placeStone(board, r, c, myStone)
      if (checkWinAt(board, r, c, myStone)) {
        board[r][c] = 0
        return { row: r, col: c }
      }
      let score = evaluateBoard(board, myStone, oppStone) + centerBias(r, c)
      board[r][c] = 0
      if (score > bestScore) {
        bestScore = score
        bestList.length = 0
        bestList.push({ row: r, col: c })
      } else if (score === bestScore) {
        bestList.push({ row: r, col: c })
      }
    }
  }
  if (bestList.length === 0) return null
  return bestList[Math.floor(Math.random() * bestList.length)]
}

/** AI 决策：落子 或 抽技能。返回 'place' 时需再调用 bestMove 取坐标；'skill' 时由外部抽卡并走技能流程 */
export function aiDecide(game: GameState): 'place' | 'skill' {
  if (game.skillPoints[game.currentPlayer] < 3) return 'place'
  const bm = bestMove(game)
  if (!bm) return 'skill'
  const mapping = getColorMapping(game)
  const myStone = getStone(mapping, game.currentPlayer)
  const oppStone = getOpponentStone(mapping, game.currentPlayer)
  const board = game.board
  placeStone(board, bm.row, bm.col, myStone)
  const scorePlace = evaluateBoard(board, myStone, oppStone)
  board[bm.row][bm.col] = 0
  const scoreSkill = 50 + Math.random() * 30
  return scorePlace >= scoreSkill ? 'place' : 'skill'
}

/** AI 落子坐标 */
export function aiPlace(game: GameState): { row: number; col: number } | null {
  return bestMove(game)
}

/** AI 使用飞沙走石：选对己方威胁最大的一子（简化：选对方最长的连子中的一颗） */
export function aiSelectOpponentStone(
  board: Cell[][],
  oppStone: 1 | 2
): { row: number; col: number } | null {
  let bestScore = 0
  let best: { row: number; col: number } | null = null
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== oppStone) continue
      let score = 0
      const dirs: [number, number][] = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ]
      for (const [dr, dc] of dirs) {
        let n = 1
        let nr = r + dr
        let nc = c + dc
        while (
          nr >= 0 &&
          nr < BOARD_SIZE &&
          nc >= 0 &&
          nc < BOARD_SIZE &&
          board[nr][nc] === oppStone
        ) {
          n++
          nr += dr
          nc += dc
        }
        nr = r - dr
        nc = c - dc
        while (
          nr >= 0 &&
          nr < BOARD_SIZE &&
          nc >= 0 &&
          nc < BOARD_SIZE &&
          board[nr][nc] === oppStone
        ) {
          n++
          nr -= dr
          nc -= dc
        }
        score += n * n
      }
      if (score > bestScore) {
        bestScore = score
        best = { row: r, col: c }
      }
    }
  }
  return best
}

/** AI 使用调你离山：选对方一子，再选一个远离己方威胁的空位 */
export function aiSelectMoveTarget(
  board: Cell[][],
  fromRow: number,
  fromCol: number,
  _myStone: 1 | 2
): { row: number; col: number } | null {
  let best: { row: number; col: number } | null = null
  let bestDist = 0
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) continue
      const dist =
        Math.abs(r - fromRow) + Math.abs(c - fromCol) + Math.random() * 2
      if (dist > bestDist) {
        bestDist = dist
        best = { row: r, col: c }
      }
    }
  }
  return best
}
