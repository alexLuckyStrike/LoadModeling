export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  const config = useRuntimeConfig()
  const base = config.public.backendBase || 'http://localhost:3001'
  return await $fetch(`${base}/content/${encodeURIComponent(slug)}`)
})
