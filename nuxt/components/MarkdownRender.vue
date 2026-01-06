<template>
  <div class="prose prose-slate max-w-none" v-html="safeHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const props = defineProps<{ markdown: string }>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

const safeHtml = computed(() => {
  const raw = md.render(props.markdown || '')
  return DOMPurify.sanitize(raw)
})
</script>
