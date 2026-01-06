<script setup lang="ts">
import { ref, onMounted } from 'vue'

const content = ref('')
const loading = ref(false)
const loadError = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:3001/content/algorithm')
    if (!res.ok) throw new Error(String(res.status))
    content.value = await res.text()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container-page">
    <h1>Алгоритм размышлений</h1>
    <div class="card">
      <div v-if="loading">Загрузка…</div>
      <div v-else-if="loadError">Не удалось загрузить контент</div>
      <pre v-else style="white-space: pre-wrap">{{ content }}</pre>
    </div>
  </div>
</template>
