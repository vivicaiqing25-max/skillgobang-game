/** 棋子颜色：1 黑 2 白 */
export type Stone = 1 | 2

/** 玩家索引 0 或 1，对应黑/白由当前对局映射决定 */
export type PlayerIndex = 0 | 1

/** 小局结果 */
export type GameResult = 'playing' | 'black_win' | 'white_win' | 'draw'

/** 技能卡 ID */
export type SkillId =
  | 'fly_sand'
  | 'still_water'
  | 'clear_board'
  | 'move_opponent'
  | 'reverse_color'
  | 'see_you_again'
  | 'instant_win'
  | 'double_stone'
  | 'instant_lose'

/** 回合阶段：可落子/抽卡 或 正在执行技能 */
export type TurnPhase = 'placing' | 'using_skill'

/** 游戏模式 */
export type GameMode = 'two_player' | 'vs_ai' | 'online'

/** 棋盘格子：0 空，1 黑，2 白 */
export type Cell = 0 | 1 | 2

/** 坐标 */
export interface Point {
  row: number
  col: number
}
