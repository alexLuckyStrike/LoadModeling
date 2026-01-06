
<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const isActive = (path) => route.path === path
</script>

<template>
  <header class="header">
    <div class="logo">
      <strong>Модель управления нагрузкой</strong>
      <span class="subtitle">логарифмическая регрессия · биомаркеры мочи</span>
    </div>
    <nav class="nav">
      <NuxtLink to="/" class="nav-btn" :class="{ active: isActive('/') }">Идея</NuxtLink>
      <NuxtLink to="/markers" class="nav-btn" :class="{ active: isActive('/markers') }">Маркеры</NuxtLink>
      <NuxtLink to="/models" class="nav-btn" :class="{ active: isActive('/models') }">Модели</NuxtLink>
      <NuxtLink to="/regression" class="nav-btn" :class="{ active: isActive('/regression') }">Регрессия</NuxtLink>
      <NuxtLink to="/algorithm" class="nav-btn" :class="{ active: isActive('/algorithm') }">Алгоритм</NuxtLink>
      <NuxtLink to="/planner" class="nav-btn" :class="{ active: isActive('/planner') }">Моделирование</NuxtLink>
    </nav>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}
.logo {
  display: flex;
  flex-direction: column;
}
.subtitle {
  font-size: 12px;
  color: #666;
}
.nav {
  display: flex;
  gap: 12px;
}
.nav-btn {
  padding: 6px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: #333;
}
.nav-btn.active {
  background: #111;
  color: white;
}
</style>
