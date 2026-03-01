<script setup lang="ts">
import type { Customer, Order } from '~/composables/useOrders'

useSeoMeta({
    title: 'Хэрэглэгчийн мэдээлэл - Instasell'
})

const route = useRoute()
const router = useRouter()
const { getCustomer, getCustomerOrders } = useCustomers()
const { formatPrice, getStatusLabel, getStatusColor } = useOrders()
const toast = useToast()

const customerId = Number(route.params.id)
const customer = ref<Customer | null>(null)
const orderCount = ref(0)
const totalSpent = ref(0)
const orders = ref<Order[]>([])
const ordersTotal = ref(0)
const ordersPage = ref(1)
const loading = ref(true)
const loadingOrders = ref(false)

const loadCustomer = async () => {
    loading.value = true
    try {
        const data = await getCustomer(customerId)
        customer.value = data.customer
        orderCount.value = data.order_count
        totalSpent.value = data.total_spent
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: 'Хэрэглэгч олдсонгүй',
            color: 'error'
        })
        router.push('/dashboard/customers')
    } finally {
        loading.value = false
    }
}

const loadOrders = async () => {
    loadingOrders.value = true
    try {
        const data = await getCustomerOrders(customerId, ordersPage.value)
        orders.value = data.orders || []
        ordersTotal.value = data.total || 0
    } catch {
        // Non-critical
    } finally {
        loadingOrders.value = false
    }
}

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

onMounted(async () => {
    await loadCustomer()
    loadOrders()
})
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="customer-detail">
            <UDashboardNavbar>
                <template #title>
                    <div class="flex items-center gap-2">
                        <UButton
                            icon="i-lucide-arrow-left"
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            @click="router.push('/dashboard/customers')"
                        />
                        <UIcon name="i-lucide-user" class="w-5 h-5" />
                        <span>{{ customer?.name || 'Хэрэглэгч' }}</span>
                    </div>
                </template>
            </UDashboardNavbar>

            <!-- Loading -->
            <div v-if="loading" class="p-6 space-y-4">
                <div class="animate-pulse space-y-4">
                    <div class="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div class="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                </div>
            </div>

            <div v-else-if="customer" class="p-4 space-y-6 max-w-4xl">
                <!-- Customer Info Card -->
                <div
                    class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
                >
                    <div class="flex items-start gap-4">
                        <UAvatar :alt="customer.name" size="xl" />
                        <div class="flex-1 min-w-0">
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                {{ customer.name }}
                            </h2>
                            <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div class="flex items-center gap-2 text-gray-500">
                                    <UIcon name="i-lucide-phone" class="w-4 h-4" />
                                    {{ customer.phone_number || '-' }}
                                </div>
                                <div
                                    v-if="customer.email"
                                    class="flex items-center gap-2 text-gray-500"
                                >
                                    <UIcon name="i-lucide-mail" class="w-4 h-4" />
                                    {{ customer.email }}
                                </div>
                                <div
                                    v-if="customer.facebook_id"
                                    class="flex items-center gap-2 text-gray-500"
                                >
                                    <UIcon name="i-lucide-facebook" class="w-4 h-4" />
                                    Facebook холбогдсон
                                </div>
                                <div
                                    v-if="customer.city"
                                    class="flex items-center gap-2 text-gray-500"
                                >
                                    <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
                                    {{ customer.city
                                    }}{{ customer.district ? `, ${customer.district}` : '' }}
                                </div>
                                <div
                                    v-if="customer.address"
                                    class="flex items-center gap-2 text-gray-500 sm:col-span-2"
                                >
                                    <UIcon name="i-lucide-home" class="w-4 h-4" />
                                    {{ customer.address
                                    }}{{ customer.apartment ? `, ${customer.apartment}` : '' }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div
                        class="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 dark:border-gray-800"
                    >
                        <div>
                            <p class="text-sm text-gray-500">Нийт захиалга</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">
                                {{ orderCount }}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Нийт зарцуулсан</p>
                            <p class="text-2xl font-bold text-primary">
                                {{ formatPrice(totalSpent) }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Order History -->
                <div
                    class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
                >
                    <h3
                        class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
                    >
                        <UIcon name="i-lucide-shopping-bag" class="w-4 h-4" />
                        Захиалгын түүх
                    </h3>

                    <div v-if="loadingOrders" class="animate-pulse space-y-3">
                        <div
                            v-for="i in 3"
                            :key="i"
                            class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"
                        />
                    </div>

                    <div v-else-if="orders.length === 0" class="text-center py-8 text-gray-400">
                        <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2" />
                        <p>Захиалга байхгүй байна</p>
                    </div>

                    <div v-else class="space-y-3">
                        <div
                            v-for="order in orders"
                            :key="order.id"
                            class="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                            @click="router.push(`/dashboard/orders/${order.id}`)"
                        >
                            <div class="flex items-center gap-3">
                                <div>
                                    <p class="font-medium text-sm text-gray-900 dark:text-white">
                                        {{ order.order_number }}
                                    </p>
                                    <p class="text-xs text-gray-400">
                                        {{ formatDate(order.created_at) }}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <UBadge
                                    :color="getStatusColor(order.status)"
                                    variant="subtle"
                                    size="xs"
                                >
                                    {{ getStatusLabel(order.status) }}
                                </UBadge>
                                <span class="font-medium text-sm text-gray-900 dark:text-white">
                                    {{ formatPrice(order.total_amount) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UDashboardPanel>
    </div>
</template>
