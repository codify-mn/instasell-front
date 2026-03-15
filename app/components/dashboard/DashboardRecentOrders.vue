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
        paid:      { bg: 'bg-[var(--accent-green-light)]', text: 'text-[var(--accent-green)]', label: 'Төлөгдсөн' },
        delivered: { bg: 'bg-[var(--accent-green-light)]', text: 'text-[var(--accent-green)]', label: 'Хүргэгдсэн' },
        pending:   { bg: 'bg-[var(--accent-warn-light)]', text: 'text-[var(--accent-warn-dark)]', label: 'Хүлээгдэж буй' },
        shipped:   { bg: 'bg-[var(--accent-info-light)]', text: 'text-[var(--accent-info)]', label: 'Илгээгдсэн' },
        cancelled: { bg: 'bg-[var(--accent-error-light)]', text: 'text-[var(--accent-error)]', label: 'Цуцлагдсан' },
        refunded:  { bg: 'bg-[var(--surface-inset)]', text: 'text-[var(--text-muted)]', label: 'Буцаагдсан' },
    }
    return map[status] ?? { bg: 'bg-[var(--surface-inset)]', text: 'text-[var(--text-muted)]', label: status }
}

onMounted(() => { loadOrders() })
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] shadow-sm">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
            <div class="text-sm font-bold text-[var(--text-heading)]">Сүүлийн захиалгууд</div>
            <NuxtLink
                to="/dashboard/orders"
                class="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
            >
                Бүгдийг харах →
            </NuxtLink>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="flex flex-col divide-y divide-[var(--border-subtle)]">
            <div
                v-for="i in 5"
                :key="i"
                class="flex animate-pulse items-center gap-3 px-5 py-3"
            >
                <div class="h-3 w-16 rounded bg-[var(--border-subtle)]" />
                <div class="h-4 w-20 flex-1 rounded bg-[var(--border-subtle)]" />
                <div class="h-3 w-14 rounded bg-[var(--border-subtle)]" />
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!orders.length" class="flex flex-1 flex-col items-center justify-center gap-2 py-10">
            <UIcon name="i-lucide-shopping-bag" class="size-6 text-[var(--text-placeholder)]" />
            <p class="text-xs text-[var(--text-placeholder)]">Одоогоор захиалга байхгүй</p>
        </div>

        <!-- Order rows -->
        <div v-else class="flex flex-col divide-y divide-[var(--border-subtle)]">
            <NuxtLink
                v-for="order in orders"
                :key="order.id"
                :to="`/dashboard/orders/${order.id}`"
                class="flex items-center gap-3 px-5 py-3 hover:bg-[var(--surface-inset)] transition-colors"
            >
                <!-- Order number + source -->
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-[var(--text-heading)]">#{{ order.order_number }}</div>
                    <div class="text-xs text-[var(--text-placeholder)]">
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
                <div class="flex-shrink-0 text-right text-xs font-bold text-[var(--text-heading)]">
                    {{ formatPrice(order.total_amount) }}
                </div>
            </NuxtLink>
        </div>
    </div>
</template>
