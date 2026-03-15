<script setup lang="ts">
import type { Customer, Order } from '~/composables/useOrders'

useSeoMeta({
    title: 'Хэрэглэгчийн мэдээлэл - Instasell'
})

const route = useRoute()
const router = useRouter()
const { getCustomer, getCustomerOrders, deleteCustomer } = useCustomers()
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
const showDeleteModal = ref(false)
const deleting = ref(false)

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

const confirmDelete = async () => {
    deleting.value = true
    try {
        await deleteCustomer(customerId)
        toast.add({ title: 'Хэрэглэгч устгагдлаа', color: 'primary' })
        router.push('/dashboard/customers')
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Устгахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        deleting.value = false
        showDeleteModal.value = false
    }
}

const fullAddress = computed(() => {
    if (!customer.value) return ''
    const parts = [
        customer.value.city,
        customer.value.district,
        customer.value.apartment,
        customer.value.address
    ].filter(Boolean)
    return parts.join(', ')
})

onMounted(async () => {
    await loadCustomer()
    loadOrders()
})
</script>

<template>
    <div class="flex flex-col h-full w-full">
        <!-- Header -->
        <div class="px-4 sm:px-6 py-5 border-b border-(--border-primary)">
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <UButton
                        icon="i-lucide-arrow-left"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        @click="router.push('/dashboard/customers')"
                    />
                    <div>
                        <h1 class="text-2xl font-semibold text-(--text-heading)">
                            {{ customer?.name || 'Хэрэглэгч' }}
                        </h1>
                        <p class="mt-0.5 text-sm text-(--text-muted)">
                            Хэрэглэгчийн дэлгэрэнгүй мэдээлэл
                        </p>
                    </div>
                </div>
                <UButton
                    v-if="customer"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="showDeleteModal = true"
                />
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto p-4 sm:p-6">
            <!-- Loading -->
            <div v-if="loading" class="space-y-4 max-w-4xl">
                <div class="animate-pulse space-y-4">
                    <div class="h-48 bg-(--surface-inset) rounded-xl" />
                    <div class="h-64 bg-(--surface-inset) rounded-xl" />
                </div>
            </div>

            <div v-else-if="customer" class="space-y-6 max-w-4xl">
                <!-- Stats Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-(--surface-card) rounded-xl border border-(--border-primary) p-4">
                        <p class="text-xs font-medium text-(--text-muted) uppercase tracking-wider">Нийт захиалга</p>
                        <p class="mt-1 text-xl sm:text-2xl font-bold text-(--text-heading)">{{ orderCount }}</p>
                    </div>
                    <div class="bg-(--surface-card) rounded-xl border border-(--border-primary) p-4">
                        <p class="text-xs font-medium text-(--text-muted) uppercase tracking-wider">Нийт зарцуулсан</p>
                        <p class="mt-1 text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">{{ formatPrice(totalSpent) }}</p>
                    </div>
                    <div class="bg-(--surface-card) rounded-xl border border-(--border-primary) p-4">
                        <p class="text-xs font-medium text-(--text-muted) uppercase tracking-wider">Дундаж захиалга</p>
                        <p class="mt-1 text-xl sm:text-2xl font-bold text-(--text-heading)">{{ orderCount > 0 ? formatPrice(Math.round(totalSpent / orderCount)) : '-' }}</p>
                    </div>
                    <div class="bg-(--surface-card) rounded-xl border border-(--border-primary) p-4">
                        <p class="text-xs font-medium text-(--text-muted) uppercase tracking-wider">Бүртгүүлсэн</p>
                        <p class="mt-1 text-xl sm:text-2xl font-bold text-(--text-heading)">{{ formatDateShort(customer.created_at) }}</p>
                    </div>
                </div>

                <!-- Customer Info Card -->
                <div class="bg-(--surface-card) rounded-xl border border-(--border-primary) overflow-hidden">
                    <div class="px-5 py-4 border-b border-(--border-primary)">
                        <h3 class="font-semibold text-(--text-heading) flex items-center gap-2">
                            <UIcon name="i-lucide-user" class="w-4 h-4" />
                            Хэрэглэгчийн мэдээлэл
                        </h3>
                    </div>
                    <div class="p-5">
                        <div class="flex items-start gap-4">
                            <UAvatar :alt="customer.name" size="xl" />
                            <div class="flex-1 min-w-0">
                                <h2 class="text-lg font-bold text-(--text-heading)">
                                    {{ customer.name }}
                                </h2>
                                <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                                    <div class="flex items-center gap-2.5">
                                        <UIcon name="i-lucide-phone" class="w-4 h-4 text-(--text-placeholder) shrink-0" />
                                        <span class="text-sm text-(--text-body)">{{ customer.phone_number || '-' }}</span>
                                    </div>
                                    <div v-if="customer.email" class="flex items-center gap-2.5">
                                        <UIcon name="i-lucide-mail" class="w-4 h-4 text-(--text-placeholder) shrink-0" />
                                        <span class="text-sm text-(--text-body)">{{ customer.email }}</span>
                                    </div>
                                    <a
                                        v-if="customer.facebook_id"
                                        :href="`https://facebook.com/${customer.facebook_id}`"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="flex items-center gap-2.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        <UIcon name="i-lucide-facebook" class="w-4 h-4 shrink-0" />
                                        Facebook профайл
                                    </a>
                                    <div v-if="fullAddress" class="flex items-start gap-2.5 sm:col-span-2">
                                        <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-(--text-placeholder) shrink-0 mt-0.5" />
                                        <span class="text-sm text-(--text-body)">{{ fullAddress }}</span>
                                    </div>
                                    <div v-if="customer.notes" class="flex items-start gap-2.5 sm:col-span-2">
                                        <UIcon name="i-lucide-sticky-note" class="w-4 h-4 text-(--text-placeholder) shrink-0 mt-0.5" />
                                        <span class="text-sm text-(--text-muted)">{{ customer.notes }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Order History -->
                <div class="bg-(--surface-card) rounded-xl border border-(--border-primary) overflow-hidden">
                    <div class="px-5 py-4 border-b border-(--border-primary) flex items-center justify-between">
                        <h3 class="font-semibold text-(--text-heading) flex items-center gap-2">
                            <UIcon name="i-lucide-shopping-bag" class="w-4 h-4" />
                            Захиалгын түүх
                        </h3>
                        <span v-if="ordersTotal > 0" class="text-xs text-(--text-muted)">
                            Нийт {{ ordersTotal }}
                        </span>
                    </div>

                    <div v-if="loadingOrders" class="p-5 space-y-3">
                        <div
                            v-for="i in 3"
                            :key="i"
                            class="h-14 bg-(--surface-inset) rounded-lg animate-pulse"
                        />
                    </div>

                    <div v-else-if="orders.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                        <UIcon name="i-lucide-inbox" class="w-8 h-8 text-(--text-placeholder) mb-2" />
                        <p class="text-sm text-(--text-muted)">Захиалга байхгүй байна</p>
                    </div>

                    <div v-else class="divide-y divide-(--border-primary)">
                        <div
                            v-for="order in orders"
                            :key="order.id"
                            class="flex items-center justify-between px-5 py-3.5 hover:bg-(--surface-inset)/40 cursor-pointer transition-colors duration-150"
                            @click="router.push(`/dashboard/orders/${order.id}`)"
                        >
                            <div class="flex items-center gap-4">
                                <div>
                                    <p class="font-semibold text-sm text-(--text-heading)">
                                        #{{ order.order_number }}
                                    </p>
                                    <p class="text-xs text-(--text-muted) mt-0.5">
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
                                <span class="font-semibold text-sm text-(--text-heading) min-w-20 text-right">
                                    {{ formatPrice(order.total_amount) }}
                                </span>
                                <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-(--text-placeholder)" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Modal -->
        <UModal v-model:open="showDeleteModal">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-alert-triangle" class="text-red-500" />
                            <span class="font-semibold">Хэрэглэгч устгах</span>
                        </div>
                    </template>

                    <p>
                        <strong>{{ customer?.name }}</strong> хэрэглэгчийг устгахдаа итгэлтэй байна уу?
                    </p>
                    <p class="text-sm text-(--text-muted) mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton color="neutral" variant="outline" @click="showDeleteModal = false">
                                Болих
                            </UButton>
                            <UButton color="error" :loading="deleting" @click="confirmDelete">
                                Устгах
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
