<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">Моделирование микроциклов</h1>
        <p class="text-slate-700 mt-2">
          Вводите параметры нагрузки (V/P/R) и маркеры, затем нажимайте <b>«Получить модель тренировочного плана»</b>.
          Приложение построит недельные микроциклы, покажет план, график динамики и позволит экспортировать результат в PDF.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UiCard title="Период" subtitle="Наблюдение и план до даты старта">
          <div class="grid grid-cols-2 gap-3">
            <Field label="Недели наблюдения">
              <input v-model.number="observationWeeks" type="number" min="1" max="52" class="input" />
            </Field>
            <Field label="Тренировок/нед">
              <input v-model.number="sessionsPerWeek" type="number" min="1" max="10" class="input" />
            </Field>
          </div>
          <div class="mt-3">
            <div class="grid grid-cols-2 gap-3">
              <Field label="Дата начала плана">
                <input v-model="startDate" type="date" class="input" />
              </Field>
              <Field label="Недель до старта">
                <input :value="planWeeks" type="number" class="input" disabled />
              </Field>
            </div>
            <Field label="Дата соревнований">
              <input v-model="competitionDate" type="date" class="input" />
            </Field>
            <div class="text-xs text-slate-600 mt-2">
              План формируется <b>до даты соревнований</b> (от даты начала плана).
              «Недели наблюдения» — это период, в котором вы вводите данные заборов биоматериала (база для регрессии).
            </div>
          </div>
        </UiCard>

        <UiCard title="Данные" subtitle="База для моделирования">
          <div class="text-sm text-slate-700">
            Заполните хотя бы 1 неделю — по средним значениям будет построена базовая нагрузка, от которой рассчитываются микроциклы.
          </div>
          <div class="mt-3 flex flex-col gap-2">
            <button class="h-10 px-3 rounded-xl bg-slate-100 text-slate-900 font-medium hover:bg-slate-200" @click="fillDemo">
              Загрузить демоданные
            </button>
            <button class="h-10 px-3 rounded-xl border font-medium hover:bg-slate-50" @click="resetAll">
              Сбросить ввод
            </button>
          </div>
        </UiCard>

        <UiCard title="Моделирование" subtitle="Кнопка запуска">
          <div class="flex flex-col gap-2">
            <button
              :disabled="!canModel"
              class="h-10 px-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="model"
            >
              Получить модель тренировочного плана
            </button>
            <button :disabled="!plan" class="h-10 px-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50" @click="exportPdf">
              Скачать PDF (план + график)
            </button>
          </div>
          <div v-if="!competitionDate" class="mt-3 text-xs text-slate-600">
            Укажите <b>дату соревнований</b>, чтобы активировать расчёт.
          </div>
          <div v-if="plan" class="mt-3 text-xs text-slate-600">
            Сформировано недель: <b>{{ plan.weeks.length }}</b>, тренировок: <b>{{ flatPlan.length }}</b>
          </div>
        </UiCard>

        <UiCard title="Контент" subtitle="Obsidian страницы">
          <div class="text-sm text-slate-700">
            Описание маркеров и моделей хранится в Obsidian:
          </div>
          <div class="mt-3 flex gap-2 flex-wrap">
            <NuxtLink class="px-3 py-2 rounded-xl border hover:bg-slate-50 text-sm" to="/markers">Маркеры</NuxtLink>
            <NuxtLink class="px-3 py-2 rounded-xl border hover:bg-slate-50 text-sm" to="/models">Модели</NuxtLink>
            <NuxtLink class="px-3 py-2 rounded-xl border hover:bg-slate-50 text-sm" to="/regression">Логарифмическая регрессия</NuxtLink>
            <NuxtLink class="px-3 py-2 rounded-xl border hover:bg-slate-50 text-sm" to="/algorithm">Алгоритм размышлений</NuxtLink>
          </div>
        </UiCard>
      </div>
    </section>

    <section class="grid gap-6">
      <div>
        <UiCard title="Ввод данных по неделям" subtitle="Каждая тренировка: V, P, R и маркеры">
          <div class="space-y-4">
            <details
              v-for="w in observationWeeks"
              :key="w"
              class="rounded-2xl border bg-white p-4"
              :open="expandedWeeks.includes(w)"
            >
              <summary class="cursor-pointer select-none flex items-center justify-between gap-3">
                <div class="font-semibold">Неделя {{ w }}</div>
                <div class="text-xs text-slate-600">{{ summaryWeek(w) }}</div>
              </summary>

              <div class="mt-4 space-y-3">
                <!-- Mobile cards -->
                <div class="grid gap-3 lg:hidden">
                  <div v-for="s in sessionsPerWeek" :key="`${w}-${s}`" class="rounded-2xl border p-4">
                    <div class="flex items-center justify-between">
                      <div class="font-medium">Тренировка {{ s }}</div>
                      <span class="text-xs px-2 py-1 rounded-full" :class="chipClass(getRow(w,s))">{{ chipText(getRow(w,s)) }}</span>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-3">
                      <Field label="V (кг)"><input v-model.number="rows[keyOf(w,s)].V" type="number" class="input" /></Field>
                      <Field label="P (раз)"><input v-model.number="rows[keyOf(w,s)].P" type="number" class="input" /></Field>
                      <Field label="R (мин)"><input v-model.number="rows[keyOf(w,s)].R" type="number" step="0.1" class="input" /></Field>
                      <div class="rounded-xl bg-slate-50 border p-3">
                        <div class="text-xs text-slate-600">Подсказка</div>
                        <div class="text-sm text-slate-700 mt-1">P↑ = средний вес↓; P↓ = средний вес↑</div>
                      </div>
                    </div>
                    <div class="mt-3 grid grid-cols-3 gap-3">
                      <Field label="Креатинин"><input v-model.number="rows[keyOf(w,s)].creatinine" type="number" step="0.1" class="input" /></Field>
                      <Field label="Белок"><input v-model.number="rows[keyOf(w,s)].protein" type="number" step="0.1" class="input" /></Field>
                      <Field label="Миоглобин"><input v-model.number="rows[keyOf(w,s)].myoglobin" type="number" step="0.1" class="input" /></Field>
                    </div>
                  </div>
                </div>

                <!-- Desktop table -->
                <div class="hidden lg:block overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-left text-slate-600">
                        <th class="py-2 pr-3">Трен.</th>
                        <th class="py-2 pr-3">V</th>
                        <th class="py-2 pr-3">P</th>
                        <th class="py-2 pr-3">R</th>
                        <th class="py-2 pr-3">Креатинин</th>
                        <th class="py-2 pr-3">Белок</th>
                        <th class="py-2 pr-3">Миоглобин</th>
                        <th class="py-2">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="s in sessionsPerWeek" :key="`${w}-${s}`" class="border-t">
                        <td class="py-3 pr-3 font-medium">{{ s }}</td>
                        <td class="py-3 pr-3"><input v-model.number="rows[keyOf(w,s)].V" type="number" class="input h-10 w-28" /></td>
                        <td class="py-3 pr-3"><input v-model.number="rows[keyOf(w,s)].P" type="number" class="input h-10 w-24" /></td>
                        <td class="py-3 pr-3"><input v-model.number="rows[keyOf(w,s)].R" type="number" step="0.1" class="input h-10 w-24" /></td>
                        <td class="py-3 pr-3"><input v-model.number="rows[keyOf(w,s)].creatinine" type="number" step="0.1" class="input h-10 w-28" /></td>
                        <td class="py-3 pr-3"><input v-model.number="rows[keyOf(w,s)].protein" type="number" step="0.1" class="input h-10 w-24" /></td>
                        <td class="py-3 pr-3"><input v-model.number="rows[keyOf(w,s)].myoglobin" type="number" step="0.1" class="input h-10 w-28" /></td>
                        <td class="py-3">
                          <span class="text-xs px-2 py-1 rounded-full" :class="chipClass(getRow(w,s))">{{ chipText(getRow(w,s)) }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </div>
        </UiCard>
      </div>

      <div class="space-y-6 w-full">
        <div class="grid gap-6 lg:grid-cols-3">
          <UiCard title="Динамика объёма" subtitle="V (кг) по всем тренировкам">
            <div v-if="!plan" class="text-slate-600 text-sm">Сначала получите модель тренировочного плана.</div>
            <div v-else class="relative h-64 max-h-64 w-full">
              <canvas ref="chartVEl" class="absolute inset-0 w-full h-full" />
            </div>
          </UiCard>

          <UiCard title="Динамика подъёмов" subtitle="P (раз) по всем тренировкам">
            <div v-if="!plan" class="text-slate-600 text-sm">Сначала получите модель тренировочного плана.</div>
            <div v-else class="relative h-64 max-h-64 w-full">
              <canvas ref="chartPEl" class="absolute inset-0 w-full h-full" />
            </div>
          </UiCard>

          <UiCard title="Динамика пауз" subtitle="R (мин) по всем тренировкам">
            <div v-if="!plan" class="text-slate-600 text-sm">Сначала получите модель тренировочного плана.</div>
            <div v-else class="relative h-64 max-h-64 w-full">
              <canvas ref="chartREl" class="absolute inset-0 w-full h-full" />
            </div>
          </UiCard>
        </div>

        <UiCard title="План" subtitle="Красивое отображение микроциклов">
          <div v-if="!plan" class="text-slate-600 text-sm">После получения модели здесь появится план микроциклов.</div>

          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="(w, idx) in plan.weeks" :key="w.week" class="rounded-2xl border p-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div class="font-semibold">Неделя {{ w.week }}</div>
                  <div class="text-xs text-slate-600 mt-1">Модель: <b>{{ w.model }}</b></div>
                </div>
                <div class="text-xs text-slate-600">{{ weekDates(idx) }}</div>
              </div>

              <div class="mt-3 grid gap-3 lg:grid-cols-3">
                <div v-for="t in w.sessions" :key="t.id" class="rounded-2xl bg-slate-50 border p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="font-medium">Тренировка {{ t.session }}</div>
                      <div class="text-xs text-slate-600 mt-1">V={{ t.V }} кг · P={{ t.P }} · R={{ t.R }} мин</div>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full" :class="statusChip(t)">
                      {{ t.flag }}
                    </span>
                  </div>

                  <div class="mt-3 text-sm text-slate-800 whitespace-pre-line">{{ t.workout }}</div>
                </div>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import UiCard from '~/components/UiCard.vue'
import Field from '~/components/UiField.vue'
import Chart from 'chart.js/auto'

type Row = {
  V: number | null
  P: number | null
  R: number | null
  creatinine: number | null
  protein: number | null
  myoglobin: number | null
}

type PlannedSession = {
  id: string
  week: number
  session: number
  focus: string
  model: string
  V: number
  P: number
  R: number
  workout: string
  flag: 'OK' | 'Внимание'
}

type PlannedWeek = {
  week: number
  model: string
  sessions: PlannedSession[]
}

type Plan = {
  createdAt: string
  competitionDate?: string
  weeks: PlannedWeek[]
}

const observationWeeks = ref<number>(4)
const sessionsPerWeek = ref<number>(3)
const competitionDate = ref<string>('')

// Дата начала плана (по умолчанию сегодня). От неё и до competitionDate строится план.
const startDate = ref<string>(new Date().toISOString().slice(0, 10))

const canModel = computed(() => Boolean(competitionDate.value && startDate.value))

const planWeeks = computed(() => {
  if (!competitionDate.value || !startDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(competitionDate.value)
  const ms = end.getTime() - start.getTime()
  if (!Number.isFinite(ms) || ms <= 0) return 0
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)))
})

const rows = ref<Record<string, Row>>({})
const keyOf = (w: number, s: number) => `${w}-${s}`

const ensureRows = () => {
  const next: Record<string, Row> = { ...rows.value }
  for (let w = 1; w <= observationWeeks.value; w++) {
    for (let s = 1; s <= sessionsPerWeek.value; s++) {
      const k = keyOf(w, s)
      if (!next[k]) {
        next[k] = { V: null, P: null, R: null, creatinine: null, protein: null, myoglobin: null }
      }
    }
  }
  // prune
  for (const k of Object.keys(next)) {
    const [w, s] = k.split('-').map(Number)
    if (w > observationWeeks.value || s > sessionsPerWeek.value) delete next[k]
  }
  rows.value = next
}

watch([observationWeeks, sessionsPerWeek], ensureRows, { immediate: true })

// ВАЖНО: "Недели наблюдения" — это период педагогического наблюдения/заборов.
// Тренировочный план, наоборот, строится от startDate до competitionDate (до даты старта).

// Persist UI state locally (чтобы дата и параметры не "слетали" при перерисовке)
const STORAGE_KEY = 'powerlift-planner:v1'
const saveState = () => {
  if (!process.client) return
  const payload = {
    observationWeeks: observationWeeks.value,
    sessionsPerWeek: sessionsPerWeek.value,
    startDate: startDate.value,
    competitionDate: competitionDate.value,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

watch([observationWeeks, sessionsPerWeek, startDate, competitionDate], saveState)

const getRow = (w: number, s: number) => rows.value[keyOf(w, s)]

const isFilled = (r: Row) => [r.V, r.P, r.R].every((x) => typeof x === 'number' && !Number.isNaN(x))
const chipText = (r: Row) => (isFilled(r) ? 'База' : '—')
const chipClass = (r: Row) => (isFilled(r) ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-slate-50 border border-slate-200 text-slate-600')

const summaryWeek = (w: number) => {
  const filled = Array.from({ length: sessionsPerWeek.value }, (_, i) => getRow(w, i + 1)).filter(isFilled).length
  return `Заполнено ${filled}/${sessionsPerWeek.value}`
}

const plan = ref<Plan | null>(null)
const chartVEl = ref<HTMLCanvasElement | null>(null)
const chartPEl = ref<HTMLCanvasElement | null>(null)
const chartREl = ref<HTMLCanvasElement | null>(null)
let chartV: Chart | null = null
let chartP: Chart | null = null
let chartR: Chart | null = null

const expandedWeeks = ref<number[]>([1])

watch(observationWeeks, (n) => {
  // если пользователь увеличил число недель — автоматически раскрываем новые
  const set = new Set(expandedWeeks.value)
  for (let w = 1; w <= n; w++) set.add(w)
  expandedWeeks.value = Array.from(set).sort((a, b) => a - b)
})

const baseline = computed(() => {
  const all = Object.values(rows.value).filter(isFilled)
  const avg = (k: keyof Row) => {
    const vals = all.map((r) => r[k]).filter((v): v is number => typeof v === 'number')
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }
  return {
    V: avg('V') ?? 8000,
    P: avg('P') ?? 60,
    R: avg('R') ?? 4.0,
  }
})

const pickModel = (weekIndexZero: number, totalWeeks: number) => {
  const w = weekIndexZero + 1
  const last = totalWeeks
  if (w >= last - 1) return 'Пиковый (taper)'
  if (w % 4 === 0) return 'Восстановительный'
  if (w % 2 === 0) return 'Интенсивностный'
  return 'Объёмный'
}

const buildWorkout = (focus: string, V: number, P: number) => {
  // Очень простые шаблоны: задают структуру и объём. Вы сможете заменить их на свои.
  const round5 = (x: number) => Math.round(x / 5) * 5
  const mainPct = focus === 'Сила' ? 0.82 : focus === 'Объём' ? 0.70 : 0.60
  const mainReps = focus === 'Сила' ? '5×3' : focus === 'Объём' ? '5×6' : '3×5'
  const benchReps = focus === 'Сила' ? '5×3' : focus === 'Объём' ? '4×8' : '3×6'
  const deadReps = focus === 'Сила' ? '4×2' : focus === 'Объём' ? '4×5' : '2×3'
  // "условный" рабочий вес из V и P: средний вес ~ V / P
  const avgW = V / Math.max(1, P)
  const squatW = round5(avgW / mainPct)
  const benchW = round5((avgW * 0.65) / mainPct)
  const deadW = round5((avgW * 0.9) / mainPct)

  return [
    `Присед: ${mainReps} @ ~${squatW} кг`,
    `Жим: ${benchReps} @ ~${benchW} кг`,
    `Тяга: ${deadReps} @ ~${deadW} кг`,
    `Аксессуары: 2–3 упражнения по 3–4 подхода (спина/трицепс/задняя цепь)`,
  ].join('\n')
}

const model = async () => {
  const base = baseline.value
  const total = planWeeks.value
  if (total <= 0) return

  const out: PlannedWeek[] = []
  for (let i = 0; i < total; i++) {
    const modelName = pickModel(i, total)

    // Скейлы — очень простые, их можно заменить на вычисления по регрессии.
    let Vmul = 1.0
    let Pmul = 1.0
    let Radd = 0.0

    if (modelName.includes('Объём')) {
      Vmul = 1.12
      Pmul = 1.08
      Radd = 0.0
    } else if (modelName.includes('Интенсив')) {
      Vmul = 0.95
      Pmul = 0.85 // P↓ => тяжелее
      Radd = 0.6
    } else if (modelName.includes('Восстанов')) {
      Vmul = 0.75
      Pmul = 1.15
      Radd = 0.8
    } else if (modelName.includes('Пиков')) {
      Vmul = 0.65
      Pmul = 0.80
      Radd = 0.7
    }

    const sessions: PlannedSession[] = []
    for (let s = 1; s <= sessionsPerWeek.value; s++) {
      const focus = modelName.includes('Восстанов') ? 'Техника' : modelName.includes('Объём') ? 'Объём' : 'Сила'
      const V = Math.round(base.V * Vmul)
      const P = Math.max(10, Math.round(base.P * Pmul))
      const R = Math.round((base.R + Radd) * 10) / 10

      // very simple flag based on rough thresholds (can be replaced by predicted markers)
      const flag: PlannedSession['flag'] = modelName.includes('Объём') && R < 4 ? 'Внимание' : 'OK'

      sessions.push({
        id: crypto.randomUUID(),
        week: i + 1,
        session: s,
        focus,
        model: modelName,
        V,
        P,
        R,
        workout: buildWorkout(focus, V, P),
        flag,
      })
    }

    out.push({ week: i + 1, model: modelName, sessions })
  }

  plan.value = {
    createdAt: new Date().toISOString(),
    competitionDate: competitionDate.value || undefined,
    weeks: out,
  }

  await nextTick()
  drawCharts()
}

const flatPlan = computed(() => (plan.value ? plan.value.weeks.flatMap((w) => w.sessions) : []))

const drawCharts = () => {
  if (!plan.value) return
  const data = flatPlan.value
  const labels = data.map((d) => `Н${d.week}·Т${d.session}`)

  const mk = (el: HTMLCanvasElement | null, prev: Chart | null, label: string, values: number[]) => {
    if (!el) return prev
    if (prev) prev.destroy()
    return new Chart(el.getContext('2d')!, {
      type: 'line',
      data: {
        labels,
        datasets: [{ label, data: values }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: { y: { beginAtZero: false } },
        plugins: { legend: { position: 'bottom' } },
      },
    })
  }

  chartV = mk(chartVEl.value, chartV, 'V (кг)', data.map((d) => d.V))
  chartP = mk(chartPEl.value, chartP, 'P (раз)', data.map((d) => d.P))
  chartR = mk(chartREl.value, chartR, 'R (мин)', data.map((d) => d.R))
}

const statusChip = (t: PlannedSession) =>
  t.flag === 'OK'
    ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
    : 'bg-amber-50 border border-amber-100 text-amber-800'

const weekDates = (weekIndexZero: number) => {
  if (!startDate.value) return ''
  const start = new Date(startDate.value)
  const a = new Date(start)
  a.setDate(a.getDate() + weekIndexZero * 7)
  const b = new Date(a)
  b.setDate(b.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  return `${fmt(a)}–${fmt(b)}`
}

const resetAll = () => {
  rows.value = {}
  ensureRows()
  plan.value = null
  if (chartV) chartV.destroy()
  if (chartP) chartP.destroy()
  if (chartR) chartR.destroy()
  chartV = chartP = chartR = null
}

const fillDemo = () => {
  // Демо не меняет введённые weeks/sessionsPerWeek/дату — только заполняет таблицу.
  // Если дата старта не задана — ставим через 8 недель от старта по умолчанию.
  if (!startDate.value) startDate.value = new Date().toISOString().slice(0, 10)
  if (!competitionDate.value) {
    const target = new Date(startDate.value)
    target.setDate(target.getDate() + 8 * 7)
    competitionDate.value = target.toISOString().slice(0, 10)
  }
  ensureRows()
  const patterns = [
    { V: 9500, P: 72, R: 4.0, creatinine: 5.5, protein: 2.4, myoglobin: 25.0 },
    { V: 8800, P: 64, R: 4.5, creatinine: 6.2, protein: 3.2, myoglobin: 38.0 },
    { V: 7600, P: 56, R: 5.0, creatinine: 4.8, protein: 2.0, myoglobin: 18.0 },
    { V: 6800, P: 60, R: 5.2, creatinine: 4.2, protein: 1.6, myoglobin: 12.0 },
  ]

  for (let w = 1; w <= observationWeeks.value; w++) {
    for (let s = 1; s <= sessionsPerWeek.value; s++) {
      const idx = (w + s) % patterns.length
      rows.value[keyOf(w, s)] = { ...rows.value[keyOf(w, s)], ...patterns[idx] }
    }
  }
  // раскрыть все недели наблюдения
  expandedWeeks.value = Array.from({ length: observationWeeks.value }, (_, i) => i + 1)
  plan.value = null
  if (chartV) chartV.destroy()
  if (chartP) chartP.destroy()
  if (chartR) chartR.destroy()
  chartV = chartP = chartR = null
}

const exportPdf = async () => {
  if (!plan.value) return
  const chartPngDataUrls = {
    V: chartVEl.value ? chartVEl.value.toDataURL('image/png', 1.0) : '',
    P: chartPEl.value ? chartPEl.value.toDataURL('image/png', 1.0) : '',
    R: chartREl.value ? chartREl.value.toDataURL('image/png', 1.0) : '',
  }

  const planText = plan.value.weeks
    .map((w) => {
      const head = `Неделя ${w.week} — ${w.model}`
      const sessions = w.sessions
        .map((t) =>
          [
            `  Тренировка ${t.session}: V=${t.V} кг, P=${t.P}, R=${t.R} мин`,
            `  ${t.workout.replace(/\n/g, '\n  ')}`,
          ].join('\n')
        )
        .join('\n\n')
      return `${head}\n${sessions}`
    })
    .join('\n\n' + '-'.repeat(40) + '\n\n')

  const subtitle = competitionDate.value ? `Дата соревнований: ${competitionDate.value}` : `Сформировано: ${new Date(plan.value.createdAt).toLocaleString('ru-RU')}`

  const blob = await $fetch<Blob>('/api/pdf', {
    method: 'POST',
    body: {
      title: 'Тренировочный план (микроциклы)',
      subtitle,
      planText,
      chartPngDataUrls,
    },
    responseType: 'blob',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'training-plan.pdf'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  if (!process.client) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (typeof parsed?.observationWeeks === 'number') observationWeeks.value = parsed.observationWeeks
    if (typeof parsed?.sessionsPerWeek === 'number') sessionsPerWeek.value = parsed.sessionsPerWeek
    if (typeof parsed?.startDate === 'string') startDate.value = parsed.startDate
    if (typeof parsed?.competitionDate === 'string') competitionDate.value = parsed.competitionDate
  } catch {
    // ignore
  }

  // пересоздать сетку после восстановления состояния
  ensureRows()
  expandedWeeks.value = Array.from({ length: observationWeeks.value }, (_, i) => i + 1)
})
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  background: #ffffff;
  outline: none;
}
.input:focus {
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.45);
  border-color: #cbd5e1;
}
</style>
