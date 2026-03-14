import type { PlayerIndex, GameResult, Stone, SkillId, Cell } from '@/types'
import {
  createBoard,
  placeStone,
  checkWinner,
  isBoardFull,
  BOARD_SIZE,
} from './board'
import {
  drawSkill,
  skillEndsGame,
  applyFlySand,
  applyMoveOpponent,
  applyClearBoard,
  applySeeYouAgain,
} from './skills'

/** 谁执黑谁执白：blackPlayer 0 或 1 表示玩家索引，1 表示黑，2 表示白 */
export interface ColorMapping {
  blackPlayer: PlayerIndex
  whitePlayer: PlayerIndex
}

/** 单小局状态 */
export interface GameState {
  board: Cell[][]
  currentPlayer: PlayerIndex
  skillPoints: [number, number]
  result: GameResult
  /** 对方下一回合是否被跳过（静如止水） */
  skipNextTurn: boolean
  /** 当前回合是否可再下两子（滴水穿石） */
  extraStonesLeft: number
  /** 当前谁执黑（玩家索引） */
  blackPlayer: PlayerIndex
  whitePlayer: PlayerIndex
}

/** 大对局状态：三局两胜 */
export interface MatchState {
  score: [number, number]
  currentGame: GameState
  /** 本局是否因和棋重开（加赛） */
  isReplay: boolean
  /** 上一小局胜者（用于下一小局先手） */
  lastGameWinner: PlayerIndex | null
}

/** 技能执行中的临时状态（选子/选格） */
export interface SkillPendingState {
  skillId: SkillId
  selectedRow: number | null
  selectedCol: number | null
  targetRow: number | null
  targetCol: number | null
}

function getStone(colorMapping: ColorMapping, player: PlayerIndex): Stone {
  return colorMapping.blackPlayer === player ? 1 : 2
}

function getOpponentStone(colorMapping: ColorMapping, player: PlayerIndex): Stone {
  return colorMapping.blackPlayer === player ? 2 : 1
}

/** 创建新小局。firstPlayer: 谁先手（玩家索引） */
export function createGameState(
  firstPlayer: PlayerIndex,
  blackPlayer: PlayerIndex,
  whitePlayer: PlayerIndex
): GameState {
  return {
    board: createBoard(),
    currentPlayer: firstPlayer,
    skillPoints: [0, 0],
    result: 'playing',
    skipNextTurn: false,
    extraStonesLeft: 0,
    blackPlayer,
    whitePlayer,
  }
}

/** 创建新大对局，双人单机默认 0 黑 1 白，黑先 */
export function createMatchState(): MatchState {
  const game = createGameState(0, 0, 1)
  return {
    score: [0, 0],
    currentGame: game,
    isReplay: false,
    lastGameWinner: null,
  }
}

/** 当前颜色映射 */
export function getColorMapping(game: GameState): ColorMapping {
  return { blackPlayer: game.blackPlayer, whitePlayer: game.whitePlayer }
}

/** 落子并检查胜负/和棋 */
export function doPlaceStone(
  match: MatchState,
  row: number,
  col: number
): { success: boolean; newResult?: GameResult; winner?: PlayerIndex } {
  const g = match.currentGame
  if (g.result !== 'playing') {
    return { success: false }
  }
  const mapping = getColorMapping(g)
  const stone = getStone(mapping, g.currentPlayer)
  const board = g.board
  if (board[row]?.[col] !== 0) return { success: false }
  placeStone(board, row, col, stone)
  g.skillPoints[g.currentPlayer] += 1
  if (g.extraStonesLeft > 0) {
    g.extraStonesLeft--
    if (g.extraStonesLeft === 0) {
      g.currentPlayer = (1 - g.currentPlayer) as PlayerIndex
      if (g.skipNextTurn) {
        g.skipNextTurn = false
        g.currentPlayer = (1 - g.currentPlayer) as PlayerIndex
      }
    }
  } else {
    g.currentPlayer = (1 - g.currentPlayer) as PlayerIndex
    if (g.skipNextTurn) {
      g.skipNextTurn = false
      g.currentPlayer = (1 - g.currentPlayer) as PlayerIndex
    }
  }
  if (checkWinner(board, stone)) {
    g.result = stone === 1 ? 'black_win' : 'white_win'
    const winner = stone === 1 ? g.blackPlayer : g.whitePlayer
    return { success: true, newResult: g.result, winner }
  }
  if (isBoardFull(board)) {
    g.result = 'draw'
    return { success: true, newResult: 'draw' }
  }
  return { success: true }
}

/** 抽技能卡：扣 3 点，返回抽到的技能 ID */
export function doDrawSkill(match: MatchState): SkillId | null {
  const g = match.currentGame
  if (g.result !== 'playing' || g.skillPoints[g.currentPlayer] < 3) return null
  g.skillPoints[g.currentPlayer] -= 3
  return drawSkill()
}

/** 应用技能（在 UI 选完子/格后调用） */
export function applySkill(
  match: MatchState,
  skillId: SkillId,
  param: { row?: number; col?: number; toRow?: number; toCol?: number }
): { success: boolean; nextPlayer?: PlayerIndex; gameEnd?: 'win' | 'lose'; clearBoard?: boolean }
{
  const g = match.currentGame
  if (g.result !== 'playing') return { success: false }
  const mapping = getColorMapping(g)
  const me = g.currentPlayer
  const opp = (1 - me) as PlayerIndex
  const oppStone = getOpponentStone(mapping, me)
  const board = g.board

  const endGame = skillEndsGame(skillId)
  if (endGame === 'win') {
    g.result = g.blackPlayer === me ? 'black_win' : 'white_win'
    return { success: true, gameEnd: 'win', nextPlayer: me }
  }
  if (endGame === 'lose') {
    g.result = g.blackPlayer === opp ? 'black_win' : 'white_win'
    return { success: true, gameEnd: 'lose', nextPlayer: opp }
  }

  if (skillId === 'fly_sand' && param.row != null && param.col != null) {
    applyFlySand(board, param.row, param.col, oppStone)
    finishSkillTurn(g, me, opp)
    return { success: true, nextPlayer: opp }
  }
  if (
    skillId === 'move_opponent' &&
    param.row != null &&
    param.col != null &&
    param.toRow != null &&
    param.toCol != null
  ) {
    const ok = applyMoveOpponent(board, param.row, param.col, param.toRow, param.toCol)
    if (!ok) return { success: false }
    finishSkillTurn(g, me, opp)
    return { success: true, nextPlayer: opp }
  }
  if (skillId === 'clear_board') {
    applyClearBoard(board)
    g.currentPlayer = opp
    return { success: true, clearBoard: true, nextPlayer: opp }
  }
  if (skillId === 'still_water') {
    g.skipNextTurn = true
    finishSkillTurn(g, me, opp)
    return { success: true, nextPlayer: opp }
  }
  if (skillId === 'see_you_again') {
    applySeeYouAgain(board, oppStone)
    finishSkillTurn(g, me, opp)
    return { success: true, nextPlayer: opp }
  }
  if (skillId === 'reverse_color') {
    g.blackPlayer = opp
    g.whitePlayer = me
    g.currentPlayer = opp
    return { success: true, nextPlayer: opp }
  }
  if (skillId === 'double_stone') {
    g.extraStonesLeft = 2
    g.currentPlayer = me
    return { success: true, nextPlayer: me }
  }
  return { success: false }
}

function finishSkillTurn(g: GameState, me: PlayerIndex, opp: PlayerIndex): void {
  g.currentPlayer = opp
  if (g.skipNextTurn) {
    g.skipNextTurn = false
    g.currentPlayer = me
  }
}

/** 小局结束后更新大比分并决定是否重开（和棋）或进入下一小局 */
export function commitGameResult(
  match: MatchState,
  result: GameResult,
  winner: PlayerIndex | null
): { needReplay: boolean; matchOver: boolean; nextFirstPlayer?: PlayerIndex } {
  if (result === 'draw') {
    match.isReplay = true
    match.currentGame = createGameState(
      match.currentGame.currentPlayer,
      match.currentGame.blackPlayer,
      match.currentGame.whitePlayer
    )
    return { needReplay: true, matchOver: false }
  }
  if (winner !== null) {
    match.score[winner] += 1
    match.lastGameWinner = winner
  }
  const [s0, s1] = match.score
  if (s0 >= 2 || s1 >= 2) {
    return { needReplay: false, matchOver: true }
  }
  const nextFirst = match.lastGameWinner!
  match.currentGame = createGameState(nextFirst, match.currentGame.blackPlayer, match.currentGame.whitePlayer)
  match.isReplay = false
  return { needReplay: false, matchOver: false, nextFirstPlayer: nextFirst }
}

export { getStone, getOpponentStone, BOARD_SIZE }
