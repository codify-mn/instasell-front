<script setup lang="ts">
import type { ConversionStats } from '~/composables/useDashboardData'

interface Props {
    stats?: ConversionStats | null
}

const props = withDefaults(defineProps<Props>(), {
    stats: null
})

const formatRevenue = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}сая₮`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}мян₮`
    return `${value.toLocaleString()}₮`
}

const conversionRate = computed(() => {
    if (!props.stats) return 0
    return Math.round(props.stats.conversion_rate * 10) / 10
})

// Width % for each funnel bar relative to comments_processed (the widest)
const ordersCreatedPct = computed(() => {
    if (!props.stats || props.stats.comments_processed === 0) return 0
    return Math.min((props.stats.orders_created / props.stats.comments_processed) * 100, 100)
})

const ordersPaidPct = computed(() => {
    if (!props.stats || props.stats.comments_processed === 0) return 0
    return Math.min((props.stats.orders_paid / props.stats.comments_processed) * 100, 100)
})

const rateColor = computed(() => {
    const r = conversionRate.value
    if (r >= 50) return 'text-[#16a34a]'
    if (r >= 25) return 'text-[#d97706]'
    return 'text-[#dc2626]'
})
</script>

<template>
    <DashboardCard padding="lg">
        <div class="space-y-5">
            <!-- Header -->
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Хувиргалтын хувь
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Сэтгэгдэл → Захиалга → Төлөгдсөн
                    </p>
                </div>
                <div class="flex items-center gap-1.5">
                    <span :class="['text-3xl font-bold tabular-nums', rateColor]">
                        {{ conversionRate }}%
                    </span>
                </div>
            </div>

            <!-- Funnel steps -->
            <div class="space-y-3">
                <!-- Step 1: Comments processed -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                            <span class="text-gray-600 dark:text-gray-300 font-medium">Боловсруулсан сэтгэгдэл</span>
                        </div>
                        <span class="font-bold text-gray-900 dark:text-white tabular-nums">
                            {{ (stats?.comments_processed ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full w-full bg-[#0ea5e9] rounded-full" />
                    </div>
                </div>

                <!-- Step 2: Orders created -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-[#6366f1]" />
                            <span class="text-gray-600 dark:text-gray-300 font-medium">Үүссэн захиалга</span>
                        </div>
                        <span class="font-bold text-gray-900 dark:text-white tabular-nums">
                            {{ (stats?.orders_created ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-[#6366f1] rounded-full transition-all duration-700"
                            :style="{ width: `${ordersCreatedPct}%` }"
                        />
                    </div>
                </div>

                <!-- Step 3: Orders paid -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-[#16a34a]" />
                            <span class="text-gray-600 dark:text-gray-300 font-medium">Төлөгдсөн захиалга</span>
                        </div>
                        <span class="font-bold text-gray-900 dark:text-white tabular-nums">
                            {{ (stats?.orders_paid ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-[#16a34a] rounded-full transition-all duration-700"
                            :style="{ width: `${ordersPaidPct}%` }"
                        />
                    </div>
                </div>
            </div>

            <!-- Revenue highlight -->
            <div class="pt-1 border-t border-gray-100 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-banknote" class="w-4 h-4 text-[#16a34a]" />
                        <span class="text-sm text-gray-500 dark:text-gray-400">Facebook-аас орсон орлого</span>
                    </div>
                    <span class="text-base font-bold text-[#16a34a] tabular-nums">
                        {{ formatRevenue(stats?.paid_revenue ?? 0) }}
                    </span>
                </div>
            </div>
        </div>
    </DashboardCard>
</template>
