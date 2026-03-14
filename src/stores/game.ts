import { defineStore } from 'pinia'
import type { GameMode, SkillId } from '@/types'
import {
  createMatchState,
  doPlaceStone,
  doDrawSkill,
  applySkill,
  commitGameResult,
  type MatchState,
  type GameState,
  type SkillPendingState,
} from '@/game/match'
import type { PlayerIndex } from '@/types'

export type SettleReason = 'normal' | 'instant_win' | 'instant_lose'

export const useGameStore = defineStore('game', {
  state: () => ({
    mode: 'two_player' as GameMode,
    match: null as MatchState | null,
    /** 当前抽到待执行的技能（未选子/格前） */
    pendingSkill: null as SkillId | null,
    /** 选子/选格临时状态 */
    skillPending: null as SkillPendingState | null,
    /** 结算页用：最终胜者 0|1，以及是否因大获全胜/满盘皆输 */
    settleWinner: null as 0 | 1 | null,
    settleReason: 'normal' as SettleReason,
    /** 结算前短暂提示文案（大获全胜/满盘皆输） */
    settleToast: '',
  }),

  getters: {
    currentGame(state): GameState | null {
      return state.match?.currentGame ?? null
    },
    score(state): [number, number] {
      return state.match?.score ?? [0, 0]
    },
    isGameOver(state): boolean {
      const g = state.match?.currentGame
      if (!g) return false
      return g.result !== 'playing'
    },
    currentPlayer(state): 0 | 1 | null {
      return state.match?.currentGame?.currentPlayer ?? null
    },
    canDrawSkill(state): boolean {
      const g = state.match?.currentGame
      if (!g || g.result !== 'playing') return false
      return g.skillPoints[g.currentPlayer] >= 3 && !state.pendingSkill && !state.skillPending
    },
    isInSkillFlow(state): boolean {
      return state.pendingSkill != null || state.skillPending != null
    },
  },

  actions: {
    setMode(mode: GameMode) {
      this.mode = mode
    },
    startMatch() {
      this.match = createMatchState()
      this.pendingSkill = null
      this.skillPending = null
      this.settleWinner = null
      this.settleReason = 'normal'
      this.settleToast = ''
    },
    placeStone(row: number, col: number): { ok: boolean; needReplay?: boolean; matchOver?: boolean; gameEnded?: boolean; winner?: PlayerIndex } {
      const match = this.match
      if (!match) return { ok: false }
      const ret = doPlaceStone(match, row, col)
      if (!ret.success) return { ok: false }
      if (ret.newResult && ret.newResult !== 'playing') {
        if (ret.newResult === 'draw') {
          const commit = commitGameResult(match, ret.newResult, null)
          return { ok: true, needReplay: commit.needReplay }
        }
        return { ok: true, gameEnded: true, winner: ret.winner ?? undefined }
      }
      return { ok: true }
    },
    /** 小局结束后由视图在展示红线 2s 后调用，提交本局结果并进入下一小局或结算 */
    commitGameEnd(): { matchOver: boolean } {
      const match = this.match
      if (!match || match.currentGame.result === 'playing') return { matchOver: false }
      const g = match.currentGame
      const winner = (g.result === 'black_win' ? g.blackPlayer : g.whitePlayer) as PlayerIndex
      const commit = commitGameResult(match, g.result, winner)
      if (commit.matchOver) {
        this.settleWinner = winner as 0 | 1
        this.settleReason = 'normal'
        return { matchOver: true }
      }
      return { matchOver: false }
    },
    drawSkill(): SkillId | null {
      const match = this.match
      if (!match) return null
      const skillId = doDrawSkill(match)
      if (!skillId) return null
      this.pendingSkill = skillId
      this.skillPending = {
        skillId,
        selectedRow: null,
        selectedCol: null,
        targetRow: null,
        targetCol: null,
      }
      return skillId
    },
    cancelSkill() {
      this.pendingSkill = null
      this.skillPending = null
    },
    /** 仅清除当前选中的棋子/目标格，不结束技能流程，可重新选择 */
    clearSkillSelection() {
      if (!this.skillPending) return
      this.skillPending.selectedRow = null
      this.skillPending.selectedCol = null
      this.skillPending.targetRow = null
      this.skillPending.targetCol = null
    },
    confirmSkillSelection(
      row: number,
      col: number,
      toRow?: number,
      toCol?: number
    ): { ok: boolean; needReplay?: boolean; matchOver?: boolean; gameEnd?: 'win' | 'lose' } {
      const match = this.match
      const sp = this.skillPending
      if (!match || !sp) return { ok: false }
      const param: { row?: number; col?: number; toRow?: number; toCol?: number } = {}
      if (sp.skillId === 'fly_sand') {
        param.row = row
        param.col = col
      } else if (sp.skillId === 'move_opponent' && toRow != null && toCol != null) {
        param.row = row
        param.col = col
        param.toRow = toRow
        param.toCol = toCol
      }
      const ret = applySkill(match, sp.skillId, param)
      this.pendingSkill = null
      this.skillPending = null
      if (!ret.success) return { ok: false }
      if (ret.gameEnd === 'win') {
        this.settleToast = '大获全胜！'
        this.settleReason = 'instant_win'
        this.settleWinner = ret.nextPlayer as 0 | 1
        const commit = commitGameResult(match, match.currentGame.result, ret.nextPlayer!)
        if (commit.matchOver) return { ok: true, matchOver: true, gameEnd: 'win' }
        return { ok: true, gameEnd: 'win' }
      }
      if (ret.gameEnd === 'lose') {
        this.settleToast = '满盘皆输！'
        this.settleReason = 'instant_lose'
        this.settleWinner = ret.nextPlayer as 0 | 1
        const commit = commitGameResult(match, match.currentGame.result, ret.nextPlayer!)
        if (commit.matchOver) return { ok: true, matchOver: true, gameEnd: 'lose' }
        return { ok: true, gameEnd: 'lose' }
      }
      return { ok: true }
    },
    setSkillSelection(row: number, col: number) {
      if (!this.skillPending) return
      if (this.skillPending.targetRow == null) {
        this.skillPending.selectedRow = row
        this.skillPending.selectedCol = col
      } else {
        this.skillPending.targetRow = row
        this.skillPending.targetCol = col
      }
    },
    setSkillTarget(row: number, col: number) {
      if (!this.skillPending) return
      this.skillPending.targetRow = row
      this.skillPending.targetCol = col
    },
    commitRoundAfterSkill(): { needReplay?: boolean; matchOver?: boolean } {
      const match = this.match
      if (!match) return {}
      const g = match.currentGame
      if (g.result !== 'playing') {
        const commit = commitGameResult(match, g.result, g.result === 'draw' ? null : (g.result === 'black_win' ? g.blackPlayer : g.whitePlayer))
        if (commit.needReplay) return { needReplay: true }
        if (commit.matchOver) {
          this.settleWinner = (g.result === 'black_win' ? g.blackPlayer : g.whitePlayer) as 0 | 1
          return { matchOver: true }
        }
      }
      return {}
    },
    goToSettle() {
      const match = this.match
      if (!match) return
      const [s0] = match.score
      this.settleWinner = s0 >= 2 ? 0 : 1
      this.settleReason = 'normal'
    },
    resetForReplay() {
      const match = this.match
      if (!match || !match.isReplay) return
      this.pendingSkill = null
      this.skillPending = null
    },
  },
})
