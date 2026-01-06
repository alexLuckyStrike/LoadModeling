
<script setup>
import { ref, onMounted } from 'vue'

const content = ref('')
const error = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/notes/models')
    const data = await res.json()
    content.value = data.content
  } catch (e) {
    error.value = true
  }
})
</script>

<template>
  <div class="container-page">
    <h1>Модели микроциклов</h1>
    <div class="card">
      <div v-if="error">Не удалось загрузить контент</div>
      <pre v-else style="white-space: pre-wrap">{{ content }}</pre>
    </div>
  </div>
</template>
