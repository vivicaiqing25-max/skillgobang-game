import type { Cell, Stone, Point } from '@/types'

const SIZE = 15

/** 创建空棋盘 15x15 */
export function createBoard(): Cell[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as Cell[])
}

/** 深拷贝棋盘 */
export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => [...row])
}

/** 在 (row,col) 落子，成功返回 true */
export function placeStone(
  board: Cell[][],
  row: number,
  col: number,
  stone: Stone
): boolean {
  if (row < 0 || row >= SIZE || col < 0 || col >= SIZE || board[row][col] !== 0) {
    return false
  }
  board[row][col] = stone
  return true
}

/** 移除 (row,col) 的棋子 */
export function removeStone(board: Cell[][], row: number, col: number): void {
  if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
    board[row][col] = 0
  }
}

/** 移动棋子：从 (r1,c1) 移到 (r2,c2)，要求目标为空 */
export function moveStone(
  board: Cell[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  if (r1 < 0 || r1 >= SIZE || c1 < 0 || c1 >= SIZE) return false
  if (r2 < 0 || r2 >= SIZE || c2 < 0 || c2 >= SIZE) return false
  const stone = board[r1][c1]
  if (stone === 0 || board[r2][c2] !== 0) return false
  board[r1][c1] = 0
  board[r2][c2] = stone
  return true
}

/** 统计某颜色棋子数量 */
export function countStones(board: Cell[][], stone: Stone): number {
  let n = 0
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === stone) n++
    }
  }
  return n
}

/** 清空棋盘 */
export function clearBoard(board: Cell[][]): void {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      board[r][c] = 0
    }
  }
}

/** 移除棋盘上所有指定颜色的子 */
export function removeAllStones(board: Cell[][], stone: Stone): void {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === stone) board[r][c] = 0
    }
  }
}

/** 检查是否五子连珠：从 (row,col) 出发检查 stone 是否形成五连 */
export function checkWinAt(
  board: Cell[][],
  row: number,
  col: number,
  stone: Stone
): boolean {
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]
  for (const [dr, dc] of dirs) {
    let count = 1
    let r = row + dr
    let c = col + dc
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === stone) {
      count++
      r += dr
      c += dc
    }
    r = row - dr
    c = col - dc
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === stone) {
      count++
      r -= dr
      c -= dc
    }
    if (count >= 5) return true
  }
  return false
}

/** 检查整盘是否有某颜色获胜 */
export function checkWinner(board: Cell[][], stone: Stone): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === stone && checkWinAt(board, r, c, stone)) return true
    }
  }
  return false
}

/** 返回形成五连的 5 个格子坐标，用于画红线；若无则返回 null */
export function getWinningLine(
  board: Cell[][],
  stone: Stone
): Point[] | null {
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== stone) continue
      for (const [dr, dc] of dirs) {
        let count = 1
        const points: Point[] = [{ row: r, col: c }]
        let nr = r + dr
        let nc = c + dc
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === stone) {
          count++
          points.push({ row: nr, col: nc })
          nr += dr
          nc += dc
        }
        nr = r - dr
        nc = c - dc
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === stone) {
          count++
          points.unshift({ row: nr, col: nc })
          nr -= dr
          nc -= dc
        }
        if (count >= 5) {
          return points.slice(0, 5)
        }
      }
    }
  }
  return null
}

/** 棋盘是否已满 */
export function isBoardFull(board: Cell[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return false
    }
  }
  return true
}

export { SIZE as BOARD_SIZE }
