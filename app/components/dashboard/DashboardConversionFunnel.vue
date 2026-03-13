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
    if (rate.value >= 50) return 'text-[#059669]'
    if (rate.value >= 25) return 'text-[#b45309]'
    return 'text-[#dc2626]'
})

const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}сая₮`
    if (v >= 1_000) return `${Math.round(v / 1_000)}мян₮`
    return `${Math.round(v).toLocaleString()}₮`
}
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden rounded-xl border border-[#e3e8ee] bg-white dark:border-[#334155] dark:bg-[#1e293b]">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[#f0f4f8] px-5 py-4 dark:border-[#1e293b]">
            <div class="text-[13px] font-bold text-[#1a1f36] dark:text-[#e2e8f0]">Хувиргалтын алхмууд</div>
            <div :class="['text-2xl font-black leading-none tracking-tight', rateClass]">
                {{ rate }}%
            </div>
        </div>

        <!-- Body -->
        <div class="flex flex-1 flex-col px-5 py-4">
            <div class="mb-4 text-[11px] text-[#697386] dark:text-[#94a3b8]">
                {{ (stats?.comments_processed ?? 0).toLocaleString() }} сэтгэгдэлээс →
                {{ (stats?.orders_paid ?? 0).toLocaleString() }} нь төлөлт хийгдсэн
            </div>

            <!-- Funnel steps -->
            <div class="flex flex-col gap-3.5">
                <!-- Step 1: comments — neutral baseline -->
                <div>
                    <div class="mb-1.5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="h-2 w-2 rounded-full bg-[#c4cdd8]" />
                            <span class="text-[12px] text-[#697386] dark:text-[#94a3b8]">Боловсруулсан сэтгэгдэл</span>
                        </div>
                        <span class="text-[13px] font-semibold text-[#697386] dark:text-[#94a3b8]">
                            {{ (stats?.comments_processed ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-[5px] w-full overflow-hidden rounded-full bg-[#f0f4f8] dark:bg-[#0f172a]">
                        <div class="h-full w-full rounded-full bg-[#e3e8ee] dark:bg-[#334155]" />
                    </div>
                </div>

                <!-- Step 2: orders created — dark neutral -->
                <div>
                    <div class="mb-1.5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="h-2 w-2 rounded-full bg-[#697386]" />
                            <span class="text-[12px] text-[#4f566b] dark:text-[#94a3b8]">Үүссэн захиалга</span>
                        </div>
                        <span class="text-[13px] font-semibold text-[#4f566b] dark:text-[#94a3b8]">
                            {{ (stats?.orders_created ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-[5px] w-full overflow-hidden rounded-full bg-[#f0f4f8] dark:bg-[#0f172a]">
                        <div
                            class="h-full rounded-full bg-[#697386] transition-all duration-700"
                            :style="{ width: `${ordersCreatedPct}%` }"
                        />
                    </div>
                </div>

                <!-- Step 3: paid — GREEN only here -->
                <div>
                    <div class="mb-1.5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="h-2 w-2 rounded-full bg-[#059669]" />
                            <span class="text-[12px] font-semibold text-[#1a1f36] dark:text-[#e2e8f0]">Төлөгдсөн захиалга</span>
                        </div>
                        <span class="text-[13px] font-bold text-[#059669]">
                            {{ (stats?.orders_paid ?? 0).toLocaleString() }}
                        </span>
                    </div>
                    <div class="h-[5px] w-full overflow-hidden rounded-full bg-[#f0f4f8] dark:bg-[#0f172a]">
                        <div
                            class="h-full rounded-full bg-[#059669] transition-all duration-700"
                            :style="{ width: `${ordersPaidPct}%` }"
                        />
                    </div>
                </div>
            </div>

            <!-- Footer: Facebook revenue — GREEN value only -->
            <div class="mt-auto border-t border-[#f0f4f8] pt-4 dark:border-[#1e293b]">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] text-[#697386] dark:text-[#94a3b8]">Facebook-аас орсон орлого</span>
                    <span class="text-[14px] font-bold text-[#059669]">
                        {{ formatRevenue(stats?.paid_revenue ?? 0) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
