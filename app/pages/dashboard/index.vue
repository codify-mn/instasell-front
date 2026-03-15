<!-- app/pages/dashboard/index.vue -->
<script setup lang="ts">
import type { Period } from '~/components/dashboard/DashboardPeriodSelect.vue'

const { orderStats, conversionStats, revenueChart, isLoading, fetchAll } = useDashboardData()
const shop = useShop()
const isDev = import.meta.dev
const { resetTour } = useTour()
const tourRef = ref<{ startTour: () => void } | null>(null)

const period = ref<Period>('7d')

const periodToDays = (p: Period): number => {
    const map: Record<Period, number> = { today: 1, '7d': 7, '30d': 30, all: 365 }
    return map[p]
}

onMounted(() => { fetchAll(periodToDays(period.value)) })

watch(period, (p) => { fetchAll(periodToDays(p)) })

const replayTour = () => {
    resetTour()
    nextTick(() => tourRef.value?.startTour())
}

// Stat card values
const totalRevenue = computed(() => orderStats.value?.total_revenue ?? 0)
const conversionRate = computed(() => conversionStats.value?.conversion_rate ?? 0)
const totalOrders = computed(() => orderStats.value?.total_orders ?? 0)
const ordersPaid = computed(() => conversionStats.value?.orders_paid ?? 0)
const pendingOrders = computed(() => orderStats.value?.pending_orders ?? 0)
const avgOrderValue = computed(() => orderStats.value?.average_order_value ?? 0)

const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}сая₮`
    if (v >= 1_000) return `${Math.round(v / 1_000)}мян₮`
    return `${Math.round(v).toLocaleString()}₮`
}

// Shop panel props
const shopName = computed(() => shop.value?.name || 'Миний дэлгүүр')
const shopHandle = computed(() =>
    shop.value?.id ? `instasell.mn/shop/${shop.value.id}` : ''
)

const shopChecks = computed(() => [
    {
        label: 'QPay бүртгэлтэй',
        ok: !!shop.value?.qpay?.is_registered,
        action: '/dashboard/settings#qpay',
    },
    {
        label: 'Facebook холбогдсон',
        ok: !!shop.value?.facebook_page_id,
        action: '/dashboard/settings',
    },
    {
        label: 'Банкны данс',
        ok: !!shop.value?.settings?.bank_account?.account_number,
        action: '/dashboard/settings#bank-account',
    },
])
</script>

<template>
    <div class="flex w-full h-full flex-col overflow-hidden bg-[var(--surface-page)]">
        <!-- Topbar -->
        <div class="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--surface-card)] px-4 sm:px-7">
            <div class="flex items-center gap-3">
                <span class="text-base font-bold text-[var(--text-heading)]">Нүүр хуудас</span>
            </div>
            <div class="flex items-center gap-2.5">
                <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
                    title="Заавар"
                    @click="replayTour"
                >
                    <UIcon name="i-lucide-circle-help" class="h-4 w-4" />
                </button>
            </div>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto">
            <!-- Loading skeleton -->
            <div v-if="isLoading" class="mx-auto max-w-7xl px-4 sm:px-7 py-6 space-y-5">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div v-for="i in 4" :key="i" class="h-28 skeleton-shimmer" />
                </div>
                <div class="h-52 skeleton-shimmer" />
                <div class="grid grid-cols-3 gap-3.5">
                    <div v-for="i in 3" :key="i" class="h-56 skeleton-shimmer" />
                </div>
            </div>

            <!-- Content -->
            <div v-else class="mx-auto max-w-7xl px-4 sm:px-7 py-6 space-y-5">
                <DashboardTour ref="tourRef" />

                <!-- Period filter -->
                <div class="flex items-center justify-start">
                    <DashboardPeriodSelect v-model="period" />
                </div>

                <!-- Zone 1: 4 stat cards -->
                <div data-tour-stats class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 lg:grid-cols-4 stagger-in">
                    <DashboardStatCard
                        label="Нийт орлого"
                        :value="formatRevenue(totalRevenue)"
                        :subtitle="`Дундаж захиалга ${formatRevenue(avgOrderValue)}`"
                        icon="i-lucide-wallet"
                        top-bar="primary"
                        to="/dashboard/orders"
                    />
                    <DashboardStatCard
                        label="Хувиргалт"
                        :value="`${Math.round(conversionRate * 10) / 10}%`"
                        subtitle="Сэтгэгдлээс төлбөр хүртэл"
                        icon="i-lucide-arrow-right-left"
                        top-bar="primary"
                    />
                    <DashboardStatCard
                        label="Нийт захиалга"
                        :value="totalOrders"
                        :subtitle="`${ordersPaid} төлөгдсөн`"
                        icon="i-lucide-shopping-bag"
                        :accent="true"
                        to="/dashboard/orders"
                    />
                    <DashboardStatCard
                        label="Шийдвэрлэх захиалга"
                        :value="pendingOrders"
                        subtitle="Төлбөр хүлээгдэж буй"
                        icon="i-lucide-clock"
                        :warn="pendingOrders > 0"
                        to="/dashboard/orders"
                    />
                </div>

                <!-- Zone 2: Revenue chart (full width) -->
                <DashboardRevenueChart
                    :data="revenueChart"
                    :total-revenue="totalRevenue"
                    :average-order-value="avgOrderValue"
                    :period="period"
                />

                <!-- Zone 3: Funnel + Orders + Shop -->
                <div class="grid gap-3.5 grid-cols-1 lg:grid-cols-[1.6fr_1.4fr_1fr] stagger-in">
                    <DashboardConversionFunnel :stats="conversionStats" />
                    <DashboardRecentOrders />
                    <DashboardShopCard
                        :shop-name="shopName"
                        :shop-handle="shopHandle"
                        :checks="shopChecks"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
