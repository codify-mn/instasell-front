<script setup lang="ts">
import type { Order } from '~/composables/useOrders'

const { fetchOrders, getStatusLabel, getStatusColor, formatPrice } = useOrders()

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

const timeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Дөнгөж сая'
    if (diffMins < 60) return `${diffMins} мин өмнө`
    if (diffHours < 24) return `${diffHours} цаг өмнө`
    if (diffDays < 7) return `${diffDays} өдөр өмнө`
    return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })
}

const statusIcons: Record<string, string> = {
    pending: 'i-lucide-clock',
    paid: 'i-lucide-credit-card',
    shipped: 'i-lucide-truck',
    delivered: 'i-lucide-package-check',
    cancelled: 'i-lucide-x-circle',
    refunded: 'i-lucide-undo-2'
}

const openCheckout = (token: string) => {
    window.open(`/checkout/${token}`, '_blank')
}

onMounted(() => {
    loadOrders()
})
</script>

<template>
    <DashboardCard padding="none">
        <div class="p-4 border-b border-gray-100 dark:border-gray-800/50">
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900 dark:text-white">Сүүлийн захиалга</h3>
                <NuxtLink
                    to="/dashboard/orders"
                    class="text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
                >
                    Бүгдийг харах
                </NuxtLink>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="p-4 space-y-3">
            <div v-for="i in 5" :key="i" class="animate-pulse flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                    <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="orders.length === 0" class="p-8 text-center">
            <div
                class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3"
            >
                <UIcon name="i-lucide-shopping-cart" class="w-7 h-7 text-gray-400" />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Захиалга байхгүй байна</p>
        </div>

        <!-- Orders List -->
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800/50">
            <NuxtLink
                v-for="order in orders"
                :key="order.id"
                :to="`/dashboard/orders/${order.id}`"
                class="flex items-center gap-3 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
                <!-- Status Icon -->
                <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    :class="{
                        'bg-amber-100/80 dark:bg-amber-900/20 text-amber-500':
                            order.status === 'pending',
                        'bg-primary-100/80 dark:bg-primary-900/20 text-primary-500':
                            order.status === 'paid' || order.status === 'delivered',
                        'bg-blue-100/80 dark:bg-blue-900/20 text-blue-500':
                            order.status === 'shipped',
                        'bg-red-100/80 dark:bg-red-900/20 text-red-500':
                            order.status === 'cancelled',
                        'bg-gray-100/80 dark:bg-gray-800/50 text-gray-500':
                            order.status === 'refunded'
                    }"
                >
                    <UIcon
                        :name="statusIcons[order.status] || 'i-lucide-package'"
                        class="w-5 h-5"
                    />
                </div>

                <!-- Order Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 dark:text-white text-sm">
                            #{{ order.order_number }}
                        </span>
                        <UBadge :color="getStatusColor(order.status)" variant="subtle" size="xs">
                            {{ getStatusLabel(order.status) }}
                        </UBadge>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {{ order.customer?.name || 'Хэрэглэгч' }}
                    </p>
                </div>

                <!-- Amount & Time -->
                <div class="text-right flex-shrink-0 flex items-center gap-3">
                    <div class="text-right">
                        <p class="font-semibold text-gray-900 dark:text-white text-sm">
                            {{ formatPrice(order.total_amount) }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {{ timeAgo(order.created_at) }}
                        </p>
                    </div>
                    <UTooltip text="Checkout нээх">
                        <UButton
                            v-if="order.checkout_token"
                            icon="i-lucide-shopping-bag"
                            variant="ghost"
                            color="primary"
                            size="sm"
                            class="rounded-lg"
                            @click.stop.prevent="openCheckout(order.checkout_token)"
                        />
                    </UTooltip>
                </div>
            </NuxtLink>
        </div>
    </DashboardCard>
</template>
