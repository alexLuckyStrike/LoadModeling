export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const base = config.public.backendBase || 'http://localhost:3001'
  return await $fetch(`${base}/content`)
})
