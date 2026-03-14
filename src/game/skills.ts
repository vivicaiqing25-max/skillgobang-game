import type { SkillId } from '@/types'
import {
  clearBoard,
  removeStone,
  removeAllStones,
  moveStone,
  BOARD_SIZE,
} from './board'
import type { Cell } from '@/types'

/** 9 张技能卡等概率 */
const SKILL_IDS: SkillId[] = [
  'fly_sand',
  'still_water',
  'clear_board',
  'move_opponent',
  'reverse_color',
  'see_you_again',
  'instant_win',
  'double_stone',
  'instant_lose',
]

export function drawSkill(): SkillId {
  return SKILL_IDS[Math.floor(Math.random() * SKILL_IDS.length)]
}

export const SKILL_NAMES: Record<SkillId, string> = {
  fly_sand: '飞沙走石',
  still_water: '静如止水',
  clear_board: '力拔山兮',
  move_opponent: '调你离山',
  reverse_color: '两极反转',
  see_you_again: 'See You Again',
  instant_win: '大获全胜',
  double_stone: '滴水穿石',
  instant_lose: '满盘皆输',
}

/** 需要选对方一子的技能 */
export function skillNeedsSelectOpponentStone(skillId: SkillId): boolean {
  return skillId === 'fly_sand' || skillId === 'move_opponent'
}

/** 调你离山：选子之后还要选空位 */
export function skillNeedsSelectEmptyCell(skillId: SkillId): boolean {
  return skillId === 'move_opponent'
}

/** 执行后是否直接结束本局（胜/负） */
export function skillEndsGame(skillId: SkillId): 'win' | 'lose' | null {
  if (skillId === 'instant_win') return 'win'
  if (skillId === 'instant_lose') return 'lose'
  return null
}

/** 执行后是否清盘并由对方先手（力拔山兮） */
export function skillClearsBoardAndOpponentNext(skillId: SkillId): boolean {
  return skillId === 'clear_board'
}

/** 执行后是否跳过对方下一回合（静如止水） */
export function skillSkipsOpponentNext(skillId: SkillId): boolean {
  return skillId === 'still_water'
}

/** 执行后是否换色且当前玩家继续（两极反转） */
export function skillReversesColor(skillId: SkillId): boolean {
  return skillId === 'reverse_color'
}

/** 是否本回合可再下两子（滴水穿石） */
export function skillGrantsDoubleStone(skillId: SkillId): boolean {
  return skillId === 'double_stone'
}

/** 应用「飞沙走石」：移除对方一子 */
export function applyFlySand(
  board: Cell[][],
  row: number,
  col: number,
  opponentStone: 1 | 2
): void {
  if (board[row]?.[col] === opponentStone) {
    removeStone(board, row, col)
  }
}

/** 应用「调你离山」：移动对方一子 */
export function applyMoveOpponent(
  board: Cell[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  return moveStone(board, fromRow, fromCol, toRow, toCol)
}

/** 应用「力拔山兮」：清空棋盘 */
export function applyClearBoard(board: Cell[][]): void {
  clearBoard(board)
}

/** 应用「See You Again」：移除对方全部子 */
export function applySeeYouAgain(board: Cell[][], opponentStone: 1 | 2): void {
  removeAllStones(board, opponentStone)
}

export { SKILL_IDS, BOARD_SIZE }
