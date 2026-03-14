import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'title', component: () => import('@/views/TitleView.vue'), meta: { title: '技能五子棋' } },
    { path: '/game', name: 'game', component: () => import('@/views/GameView.vue'), meta: { title: '对局' } },
    { path: '/settle', name: 'settle', component: () => import('@/views/SettleView.vue'), meta: { title: '结算' } },
  ],
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) || '技能五子棋'
})

export default router
