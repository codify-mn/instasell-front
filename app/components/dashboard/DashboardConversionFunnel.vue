<script setup lang="ts">
import type { ConversionStats } from '~/composables/useDashboardData'

interface Props {
    stats?: ConversionStats | null
}

const props = withDefaults(defineProps<Props>(), { stats: null })

const rate = computed(() => {
    if (!props.stats) return 0
    return Math.round(props.stats.conversion_rate * 10) / 10
})

const ordersCreatedPct = computed(() => {
    if (!props.stats?.comments_processed) return 0
    return Math.min((props.stats.orders_created / props.stats.comments_processed) * 100, 100)
})

const ordersPaidPct = computed(() => {
    if (!props.stats?.comments_processed) return 0
    return Math.min((props.stats.orders_paid / props.stats.comments_processed) * 100, 100)
})

const rateClass = computed(() => {
    if (rate.value >= 50) return 'text-[var(--accent-green)]'
    if (rate.value >= 25) return 'text-[var(--accent-warn-dark)]'
    return 'text-[var(--accent-error)]'
})

const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}сая₮`
    if (v >= 1_000) return `${Math.round(v / 1_000)}мян₮`
    return `${Math.round(v).toLocaleString()}₮`
}
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] shadow-sm">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
            <div class="text-sm font-bold text-[var(--text-heading)]">Хувиргалтын алхмууд</div>
            <div :class="['text-2xl font-black leading-none tracking-tight', rateClass]">
                {{ rate }}%
            </div>
        </div>

        <!-- Body -->
        <div class="flex flex-1 flex-col px-5 py-4">
            <div class="mb-4 text-xs text-[var(--text-muted)]">
                {{ (stats?.comments_processed ?? 0).toLocaleString() }} сэтгэгдэлээс →
                {{ (stats?.orders_paid ?? 0).toLocaleString() }} нь төлөлт хийгдсэн
            </div>

            <!-- Funnel steps -->
            <div class="flex flex-col gap-3.5">
                <!-- Step 1: comments — neutral baseline -->
                <div>
                    <div class="mb-1.5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="h-2 w-2 rounded-full bg-[var(--text-dimmed)]" />
                            <span class="text-xs text-[var(--text-muted)]">Боловсруулсан сэтгэгдэл</span>
                        </div>
                        <span class="text-xs font-semibold text-[var(--text-muted)]">
                            {{ (stats?.comments_processed ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-[5px] w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                        <div class="h-full w-full rounded-full bg-[var(--border-primary)]" />
                    </div>
                </div>

                <!-- Step 2: orders created — dark neutral -->
                <div>
                    <div class="mb-1.5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
                            <span class="text-xs text-[var(--text-body)]">Үүссэн захиалга</span>
                        </div>
                        <span class="text-xs font-semibold text-[var(--text-body)]">
                            {{ (stats?.orders_created ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-[5px] w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                        <div
                            class="h-full rounded-full bg-[var(--text-muted)] transition-all duration-700"
                            :style="{ width: `${ordersCreatedPct}%` }"
                        />
                    </div>
                </div>

                <!-- Step 3: paid — GREEN only here -->
                <div>
                    <div class="mb-1.5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
                            <span class="text-xs font-semibold text-[var(--text-heading)]">Төлөгдсөн захиалга</span>
                        </div>
                        <span class="text-sm font-bold text-[var(--accent-green)]">
                            {{ (stats?.orders_paid ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-[5px] w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                        <div
                            class="h-full rounded-full bg-[var(--accent-green)] transition-all duration-700"
                            :style="{ width: `${ordersPaidPct}%` }"
                        />
                    </div>
                </div>
            </div>

            <!-- Footer: Facebook revenue — GREEN value only -->
            <div class="mt-auto border-t border-[var(--border-subtle)] pt-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs text-[var(--text-muted)]">Facebook-аас орсон орлого</span>
                    <span class="text-sm font-bold text-[var(--accent-green)]">
                        {{ formatRevenue(stats?.paid_revenue ?? 0) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
