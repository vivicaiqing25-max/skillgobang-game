<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div v-if="visible" class="confirm-bar">
    <span class="msg">{{ message }}</span>
    <div class="btns">
      <button class="btn confirm" @click="emit('confirm')">✅ 确认</button>
      <button class="btn cancel" @click="emit('cancel')">❌ 取消</button>
    </div>
  </div>
</template>

<style scoped>
.confirm-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  margin-top: 0.5rem;
}
.msg { color: #e8e8e8; font-size: 0.95rem; }
.btns { display: flex; gap: 0.5rem; }
.btn {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: none;
  font-size: 0.95rem;
  cursor: pointer;
}
.btn.confirm { background: #27ae60; color: #fff; }
.btn.cancel { background: #7f8c8d; color: #fff; }
</style>
