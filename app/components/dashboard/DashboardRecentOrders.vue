<!-- app/components/dashboard/DashboardRecentOrders.vue -->
<script setup lang="ts">
import type { Order } from '~/composables/useOrders'

const { fetchOrders, formatPrice } = useOrders()

const orders = ref<Order[]>([])
const loading = ref(true)

const loadOrders = async () => {
    loading.value = true
    try {
        const res = await fetchOrders({ size: 5 })
        orders.value = res.orders || []
    } catch (err) {
        console.error('Failed to fetch recent orders:', err)
    } finally {
        loading.value = false
    }
}

const sourceLabel = (source?: string): string => {
    if (!source) return ''
    if (source.includes('live')) return 'FB Live'
    if (source.includes('messenger')) return 'FB Мессеж'
    if (source.includes('post')) return 'FB Пост'
    return 'Гараар'
}

type BadgeStyle = { bg: string; text: string; label: string }

const statusStyle = (status: string): BadgeStyle => {
    const map: Record<string, BadgeStyle> = {
        paid:      { bg: 'bg-[#f0fdf4] dark:bg-[#064e3b]/30', text: 'text-[#059669]', label: 'Төлөгдсөн' },
        delivered: { bg: 'bg-[#f0fdf4] dark:bg-[#064e3b]/30', text: 'text-[#059669]', label: 'Хүргэгдсэн' },
        pending:   { bg: 'bg-[#fff8ec] dark:bg-[#451a03]/30', text: 'text-[#b45309]', label: 'Хүлээгдэж буй' },
        shipped:   { bg: 'bg-[#eff6ff] dark:bg-[#1e3a5f]/30', text: 'text-[#1d4ed8]', label: 'Илгээгдсэн' },
        cancelled: { bg: 'bg-[#fff1f0] dark:bg-[#450a0a]/30', text: 'text-[#c0392b]', label: 'Цуцлагдсан' },
        refunded:  { bg: 'bg-[#f6f9fc] dark:bg-[#0f172a]', text: 'text-[#697386] dark:text-[#94a3b8]', label: 'Буцаагдсан' },
    }
    return map[status] ?? { bg: 'bg-[#f6f9fc] dark:bg-[#0f172a]', text: 'text-[#697386] dark:text-[#94a3b8]', label: status }
}

onMounted(() => { loadOrders() })
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden rounded-xl border border-[#e3e8ee] bg-white dark:border-[#334155] dark:bg-[#1e293b]">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[#f0f4f8] px-5 py-4 dark:border-[#1e293b]">
            <div class="text-[13px] font-bold text-[#1a1f36] dark:text-[#e2e8f0]">Сүүлийн захиалгууд</div>
            <NuxtLink
                to="/dashboard/orders"
                class="text-[12px] font-semibold text-[#059669] hover:text-[#047857] transition-colors"
            >
                Бүгдийг харах →
            </NuxtLink>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="flex flex-col divide-y divide-[#f7fafc] dark:divide-[#334155]">
            <div
                v-for="i in 5"
                :key="i"
                class="flex animate-pulse items-center gap-3 px-5 py-3"
            >
                <div class="h-3 w-16 rounded bg-[#f0f4f8] dark:bg-[#0f172a]" />
                <div class="h-4 w-20 flex-1 rounded bg-[#f0f4f8] dark:bg-[#0f172a]" />
                <div class="h-3 w-14 rounded bg-[#f0f4f8] dark:bg-[#0f172a]" />
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!orders.length" class="flex flex-1 flex-col items-center justify-center gap-2 py-10">
            <div class="text-2xl">🛒</div>
            <p class="text-[12px] text-[#9baacf] dark:text-[#64748b]">Захиалга байхгүй байна</p>
        </div>

        <!-- Order rows -->
        <div v-else class="flex flex-col divide-y divide-[#f7fafc] dark:divide-[#334155]">
            <NuxtLink
                v-for="order in orders"
                :key="order.id"
                :to="`/dashboard/orders/${order.id}`"
                class="flex items-center gap-3 px-5 py-3 hover:bg-[#f6f9fc] transition-colors dark:hover:bg-[#0f172a]"
            >
                <!-- Order number + source -->
                <div class="min-w-0 flex-1">
                    <div class="text-[12px] font-bold text-[#1a1f36] dark:text-[#e2e8f0]">#{{ order.order_number }}</div>
                    <div class="text-[11px] text-[#9baacf] dark:text-[#64748b]">
                        {{ order.customer?.name || 'Хэрэглэгч' }}
                        <template v-if="order.metadata?.source">
                            · {{ sourceLabel(order.metadata.source) }}
                        </template>
                    </div>
                </div>

                <!-- Status badge -->
                <span
                    class="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    :class="[statusStyle(order.status).bg, statusStyle(order.status).text]"
                >
                    {{ statusStyle(order.status).label }}
                </span>

                <!-- Amount -->
                <div class="flex-shrink-0 text-right text-[12px] font-bold text-[#1a1f36] dark:text-[#e2e8f0]">
                    {{ formatPrice(order.total_amount) }}
                </div>
            </NuxtLink>
        </div>
    </div>
</template>
