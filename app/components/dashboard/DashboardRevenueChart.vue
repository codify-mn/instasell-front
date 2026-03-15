<!-- app/components/dashboard/DashboardRevenueChart.vue -->
<script setup lang="ts">
interface Props {
    data?: { label: string; value: number }[]
    totalRevenue?: number
    averageOrderValue?: number
    period?: string
}

const props = withDefaults(defineProps<Props>(), {
    data: () => [],
    totalRevenue: 0,
    averageOrderValue: 0,
    period: '7d',
})

const dayNames = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя']

const xLabels = computed(() => {
    return props.data.map(d => {
        const date = new Date(d.label)
        if (props.period === 'today') return `${date.getHours()}:00`
        if (props.period === '7d') return dayNames[date.getDay()] ?? ''
        return `${date.getDate()}`
    })
})

const maxValue = computed(() => Math.max(...props.data.map(d => d.value), 1))

const W = 600
const H = 100
const PAD_TOP = 8
const PAD_BOTTOM = 4

const svgPoints = computed(() => {
    if (!props.data.length) return []
    const n = props.data.length
    return props.data.map((d, i) => ({
        x: n === 1 ? W / 2 : (i / (n - 1)) * W,
        y: PAD_TOP + (1 - d.value / maxValue.value) * (H - PAD_TOP - PAD_BOTTOM),
    }))
})

const linePath = computed(() => {
    const pts = svgPoints.value
    if (!pts.length) return ''
    if (pts.length === 1) return `M ${pts[0]!.x} ${pts[0]!.y}`
    let d = `M ${pts[0]!.x} ${pts[0]!.y}`
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1]!
        const curr = pts[i]!
        const cp1x = prev.x + (curr.x - prev.x) / 3
        const cp2x = curr.x - (curr.x - prev.x) / 3
        d += ` C ${cp1x} ${prev.y} ${cp2x} ${curr.y} ${curr.x} ${curr.y}`
    }
    return d
})

const areaPath = computed(() => {
    if (!linePath.value || !svgPoints.value.length) return ''
    const first = svgPoints.value[0]!
    const last = svgPoints.value[svgPoints.value.length - 1]!
    return `${linePath.value} L ${last.x} ${H} L ${first.x} ${H} Z`
})

const yTicks = computed(() => {
    const steps = 4
    return Array.from({ length: steps + 1 }, (_, i) => {
        const frac = (steps - i) / steps
        return {
            value: maxValue.value * frac,
            pct: (i / steps) * 100,
        }
    })
})

const formatCompact = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}сая`
    if (v >= 1_000) return `${Math.round(v / 1_000)}мян`
    return v > 0 ? Math.round(v).toString() : '0'
}

const formatRevenue = (v: number) =>
    new Intl.NumberFormat('mn-MN').format(Math.round(v)) + '₮'

// Tooltip
const svgRef = ref<SVGSVGElement>()
const tooltip = ref<{ xPct: number; yPct: number; label: string; value: number } | null>(null)

const onMouseMove = (e: MouseEvent) => {
    const el = svgRef.value
    if (!el || !svgPoints.value.length) return
    const rect = el.getBoundingClientRect()
    const xRaw = ((e.clientX - rect.left) / rect.width) * W
    let nearest = 0
    let minDist = Infinity
    svgPoints.value.forEach((p, i) => {
        const dist = Math.abs(p.x - xRaw)
        if (dist < minDist) { minDist = dist; nearest = i }
    })
    const pt = svgPoints.value[nearest]!
    tooltip.value = {
        xPct: (pt.x / W) * 100,
        yPct: (pt.y / H) * 100,
        label: xLabels.value[nearest] ?? '',
        value: props.data[nearest]?.value ?? 0,
    }
}

const onMouseLeave = () => { tooltip.value = null }
</script>

<template>
    <div class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5 shadow-sm card-hover">
        <!-- Header -->
        <div class="mb-5 flex items-start justify-between">
            <div>
                <div class="text-sm font-bold text-[var(--text-heading)]">Орлогын чиг хандлага</div>
                <div class="mt-0.5 text-xs text-[var(--text-muted)]">
                    Нийт:
                    <strong class="text-[var(--accent-green)]">{{ formatRevenue(totalRevenue) }}</strong>
                    <template v-if="averageOrderValue">
                        · Дундаж: {{ formatRevenue(averageOrderValue) }}
                    </template>
                </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <div class="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
                Орлого
            </div>
        </div>

        <!-- Chart -->
        <div class="flex">
            <!-- Y axis -->
            <div class="relative w-10 flex-shrink-0" style="height: 100px">
                <div
                    v-for="tick in yTicks"
                    :key="tick.pct"
                    class="absolute right-2 -translate-y-1/2 whitespace-nowrap text-[9px] text-[var(--text-dimmed)]"
                    :style="{ top: `${tick.pct}%` }"
                >
                    {{ formatCompact(tick.value) }}
                </div>
            </div>

            <!-- SVG + tooltip wrapper -->
            <div class="relative flex-1" style="height: 100px">
                <!-- Grid -->
                <div class="pointer-events-none absolute inset-0 flex flex-col justify-between">
                    <div v-for="n in 5" :key="n" class="border-t border-dashed border-[var(--border-subtle)]" />
                </div>

                <svg
                    ref="svgRef"
                    :viewBox="`0 0 ${W} ${H}`"
                    preserveAspectRatio="none"
                    class="h-full w-full cursor-crosshair"
                    @mousemove="onMouseMove"
                    @mouseleave="onMouseLeave"
                >
                    <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="var(--accent-green)" stop-opacity="0.12" />
                            <stop offset="100%" stop-color="var(--accent-green)" stop-opacity="0" />
                        </linearGradient>
                    </defs>
                    <path v-if="areaPath" :d="areaPath" fill="url(#revGrad)" />
                    <path
                        v-if="linePath"
                        :d="linePath"
                        stroke="var(--accent-green)"
                        stroke-width="2"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <circle
                        v-for="(pt, i) in svgPoints"
                        :key="i"
                        :cx="pt.x"
                        :cy="pt.y"
                        r="3"
                        fill="var(--accent-green)"
                        stroke="var(--surface-card)"
                        stroke-width="1.5"
                        class="opacity-0 hover:opacity-100 transition-opacity"
                    />
                </svg>

                <!-- Tooltip -->
                <Transition name="fade">
                    <div
                        v-if="tooltip"
                        class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
                        :style="{ left: `${tooltip.xPct}%`, top: `${tooltip.yPct}%`, marginTop: '-10px' }"
                    >
                        <div class="rounded-lg bg-[var(--surface-overlay)] px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg whitespace-nowrap">
                            {{ tooltip.label }} · {{ formatCompact(tooltip.value) }}₮
                        </div>
                    </div>
                </Transition>
            </div>
        </div>

        <!-- X labels -->
        <div class="mt-2 flex pl-10">
            <div
                v-for="(lbl, i) in xLabels"
                :key="i"
                class="flex-1 text-center text-[10px] font-medium text-[var(--text-placeholder)]"
            >
                {{ lbl }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.1s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
