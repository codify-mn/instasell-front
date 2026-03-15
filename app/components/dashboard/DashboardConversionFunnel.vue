<script setup lang="ts">
import type { ConversionStats } from '~/composables/useDashboardData'

interface Props {
    stats?: ConversionStats | null
}

const props = withDefaults(defineProps<Props>(), { stats: null })

const liveOrders = computed(() => props.stats?.live_orders_created ?? 0)
const postOrders = computed(() => props.stats?.post_orders_created ?? 0)
const manualOrders = computed(() => props.stats?.manual_orders_created ?? 0)
const totalOrders = computed(() => liveOrders.value + postOrders.value + manualOrders.value)

const pct = (val: number) => {
    if (!totalOrders.value) return 0
    return Math.round((val / totalOrders.value) * 100)
}

const livePct = computed(() => pct(liveOrders.value))
const postPct = computed(() => pct(postOrders.value))
const manualPct = computed(() => {
    if (!totalOrders.value) return 0
    return 100 - livePct.value - postPct.value
})

// SVG donut chart
const SIZE = 120
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

// Segment calculations: Live → Post → Manual (clockwise from top)
const liveDash = computed(() => (livePct.value / 100) * CIRCUMFERENCE)
const postDash = computed(() => (postPct.value / 100) * CIRCUMFERENCE)
const manualDash = computed(() => (manualPct.value / 100) * CIRCUMFERENCE)

const liveRotation = -90
const postRotation = computed(() => liveRotation + (livePct.value / 100) * 360)
const manualRotation = computed(() => postRotation.value + (postPct.value / 100) * 360)

const liveComments = computed(() => props.stats?.live_comments ?? 0)
const postComments = computed(() => props.stats?.post_comments ?? 0)

const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}сая₮`
    if (v >= 1_000) return `${Math.round(v / 1_000)}мян₮`
    return `${Math.round(v).toLocaleString()}₮`
}
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden rounded-xl border border-(--border-primary) bg-(--surface-card) shadow-sm card-hover">
        <!-- Header -->
        <div class="border-b border-(--border-subtle) px-5 py-4">
            <div class="text-sm font-bold text-(--text-heading)">Захиалга хаанаас ирсэн?</div>
            <div class="text-xs text-(--text-muted) mt-0.5">Эх сурвалжаар ангилсан захиалгууд</div>
        </div>

        <!-- Body -->
        <div class="flex flex-1 flex-col px-5 py-4 gap-4">
            <!-- Pie chart + legend -->
            <div class="flex items-center gap-5">
                <!-- Donut -->
                <div class="relative shrink-0" :style="{ width: `${SIZE}px`, height: `${SIZE}px` }">
                    <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`">
                        <!-- Empty state -->
                        <circle
                            v-if="!totalOrders"
                            :cx="CENTER" :cy="CENTER" :r="RADIUS"
                            fill="none" :stroke-width="STROKE" stroke="var(--border-subtle)"
                        />
                        <!-- Live segment -->
                        <circle
                            v-if="totalOrders && livePct > 0"
                            :cx="CENTER" :cy="CENTER" :r="RADIUS"
                            fill="none" :stroke-width="STROKE"
                            stroke="var(--color-primary-500)"
                            :stroke-dasharray="`${liveDash} ${CIRCUMFERENCE - liveDash}`"
                            :transform="`rotate(${liveRotation} ${CENTER} ${CENTER})`"
                            style="transition: stroke-dasharray 0.7s ease"
                        />
                        <!-- Post/Messenger segment -->
                        <circle
                            v-if="totalOrders && postPct > 0"
                            :cx="CENTER" :cy="CENTER" :r="RADIUS"
                            fill="none" :stroke-width="STROKE"
                            stroke="var(--accent-green)"
                            :stroke-dasharray="`${postDash} ${CIRCUMFERENCE - postDash}`"
                            :transform="`rotate(${postRotation} ${CENTER} ${CENTER})`"
                            style="transition: stroke-dasharray 0.7s ease"
                        />
                        <!-- Manual segment -->
                        <circle
                            v-if="totalOrders && manualPct > 0"
                            :cx="CENTER" :cy="CENTER" :r="RADIUS"
                            fill="none" :stroke-width="STROKE"
                            stroke="var(--text-muted)"
                            :stroke-dasharray="`${manualDash} ${CIRCUMFERENCE - manualDash}`"
                            :transform="`rotate(${manualRotation} ${CENTER} ${CENTER})`"
                            style="transition: stroke-dasharray 0.7s ease"
                        />
                    </svg>
                    <!-- Center text -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-lg font-extrabold text-(--text-heading) leading-none">{{ totalOrders }}</span>
                        <span class="text-[10px] text-(--text-muted) mt-0.5">захиалга</span>
                    </div>
                </div>

                <!-- Legend -->
                <div class="flex flex-col gap-2.5 flex-1 min-w-0">
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <div class="size-2 rounded-full bg-primary-500 shrink-0" />
                            <span class="text-xs font-semibold text-(--text-heading)">Live дамжуулалт</span>
                        </div>
                        <div class="pl-4 text-xs text-(--text-muted)">
                            {{ liveOrders.toLocaleString() }} захиалга
                            <span v-if="totalOrders" class="font-semibold text-(--text-body)">({{ livePct }}%)</span>
                        </div>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <div class="size-2 rounded-full bg-(--accent-green) shrink-0" />
                            <span class="text-xs font-semibold text-(--text-heading)">Мессеж / Пост</span>
                        </div>
                        <div class="pl-4 text-xs text-(--text-muted)">
                            {{ postOrders.toLocaleString() }} захиалга
                            <span v-if="totalOrders" class="font-semibold text-(--text-body)">({{ postPct }}%)</span>
                        </div>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <div class="size-2 rounded-full bg-(--text-muted) shrink-0" />
                            <span class="text-xs font-semibold text-(--text-heading)">Гараар үүсгэсэн</span>
                        </div>
                        <div class="pl-4 text-xs text-(--text-muted)">
                            {{ manualOrders.toLocaleString() }} захиалга
                            <span v-if="totalOrders" class="font-semibold text-(--text-body)">({{ manualPct }}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-auto border-t border-(--border-subtle) pt-3 flex items-center justify-between">
                <div>
                    <div class="text-xs text-(--text-muted)">Төлөгдсөн</div>
                    <div class="text-sm font-bold text-(--text-heading)">{{ (stats?.orders_paid ?? 0).toLocaleString() }}</div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-(--text-muted)">Орлого</div>
                    <div class="text-sm font-bold text-(--text-heading)">{{ formatRevenue(stats?.paid_revenue ?? 0) }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
