<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Order, OrderStatus } from '~/composables/useOrders'

useSeoMeta({
    title: 'Захиалга - Instasell'
})

const { fetchOrders, updateOrderStatus, cancelOrder, getStatusLabel, getStatusColor, formatPrice } =
    useOrders()
const toast = useToast()
const router = useRouter()

const loading = ref(true)
const orders = ref<Order[]>([])
const total = ref(0)

// Selection state
const selectedRows = ref<Order[]>([])

const filter = reactive({
    keyword: '',
    status: 'all',
    page: 1,
    size: 10
})

const statusOptions = [
    { label: 'Бүх төлөв', value: 'all' },
    { label: 'Хүлээгдэж буй', value: 'pending' },
    { label: 'Төлөгдсөн', value: 'paid' },
    { label: 'Илгээгдсэн', value: 'shipped' },
    { label: 'Хүргэгдсэн', value: 'delivered' },
    { label: 'Цуцлагдсан', value: 'cancelled' }
]

const columns: TableColumn<Order>[] = [
    { accessorKey: 'select', header: '' },
    { accessorKey: 'order_number', header: 'Захиалгын дугаар' },
    { accessorKey: 'customer', header: 'Худалдан авагч' },
    { accessorKey: 'status', header: 'Төлөв' },
    { accessorKey: 'total_amount', header: 'Нийт дүн' },
    { accessorKey: 'created_at', header: 'Огноо' },
    { accessorKey: 'actions', header: '' }
]

const loadOrders = async () => {
    loading.value = true
    try {
        const apiFilter = {
            ...filter,
            status: filter.status === 'all' ? '' : filter.status
        }
        const res = await fetchOrders(apiFilter)
        orders.value = res.orders || []
        total.value = res.total || 0
        selectedRows.value = []
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Захиалга ачаалахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        loading.value = false
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

// Pagination helpers
const startItem = computed(() => (filter.page - 1) * filter.size + 1)
const endItem = computed(() => Math.min(filter.page * filter.size, total.value))
const totalPages = computed(() => Math.ceil(total.value / filter.size))

const prevPage = () => {
    if (filter.page > 1) filter.page--
}

const nextPage = () => {
    if (filter.page < totalPages.value) filter.page++
}

// Selection helpers
const isSelected = (order: Order) => {
    return selectedRows.value.some((o) => o.id === order.id)
}

const toggleSelect = (order: Order) => {
    const index = selectedRows.value.findIndex((o) => o.id === order.id)
    if (index === -1) {
        selectedRows.value.push(order)
    } else {
        selectedRows.value.splice(index, 1)
    }
}

const isAllSelected = computed(() => {
    return orders.value.length > 0 && selectedRows.value.length === orders.value.length
})

const isSomeSelected = computed(() => {
    return selectedRows.value.length > 0 && selectedRows.value.length < orders.value.length
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedRows.value = []
    } else {
        selectedRows.value = [...orders.value]
    }
}

const clearSelection = () => {
    selectedRows.value = []
}

// Cancel modal
const cancelModalOpen = ref(false)
const orderToCancel = ref<Order | null>(null)
const cancelling = ref(false)

const openCancelModal = (order: Order) => {
    orderToCancel.value = order
    cancelModalOpen.value = true
}

const confirmCancel = async () => {
    if (!orderToCancel.value) return

    cancelling.value = true
    try {
        await cancelOrder(orderToCancel.value.id)
        toast.add({
            title: 'Амжилттай',
            description: 'Захиалга цуцлагдлаа',
            color: 'success'
        })
        cancelModalOpen.value = false
        await loadOrders()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Цуцлахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        cancelling.value = false
    }
}

// Status update
const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    try {
        await updateOrderStatus(order.id, newStatus)
        toast.add({
            title: 'Амжилттай',
            description: `Төлөв ${getStatusLabel(newStatus)} болгож өөрчлөгдлөө`,
            color: 'success'
        })
        await loadOrders()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Төлөв өөрчлөхөд алдаа гарлаа',
            color: 'error'
        })
    }
}

// Bulk actions
const bulkActionLoading = ref(false)

const bulkSetStatus = async (status: OrderStatus) => {
    if (selectedRows.value.length === 0) return

    bulkActionLoading.value = true
    try {
        await Promise.all(selectedRows.value.map((order) => updateOrderStatus(order.id, status)))
        toast.add({
            title: 'Амжилттай',
            description: `${selectedRows.value.length} захиалгын төлөв ${getStatusLabel(status)} болгож өөрчлөгдлөө`,
            color: 'success'
        })
        await loadOrders()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Төлөв өөрчлөхөд алдаа гарлаа',
            color: 'error'
        })
    } finally {
        bulkActionLoading.value = false
    }
}

// Bulk cancel modal
const bulkCancelModalOpen = ref(false)

const confirmBulkCancel = async () => {
    if (selectedRows.value.length === 0) return

    bulkActionLoading.value = true
    try {
        await Promise.all(selectedRows.value.map((order) => cancelOrder(order.id)))
        toast.add({
            title: 'Амжилттай',
            description: `${selectedRows.value.length} захиалга цуцлагдлаа`,
            color: 'success'
        })
        bulkCancelModalOpen.value = false
        await loadOrders()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Цуцлахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        bulkActionLoading.value = false
    }
}

// Row click handler
const onRowClick = (order: Order) => {
    router.push(`/dashboard/orders/${order.id}`)
}

// Action menu items
const getActionItems = (order: Order) => {
    const statusActions = []

    // Add status transition options based on current status
    if (order.status === 'pending') {
        statusActions.push({
            label: 'Төлөгдсөн',
            icon: 'i-lucide-credit-card',
            onSelect: () => handleStatusChange(order, 'paid')
        })
    }
    if (order.status === 'paid') {
        statusActions.push({
            label: 'Илгээсэн',
            icon: 'i-lucide-truck',
            onSelect: () => handleStatusChange(order, 'shipped')
        })
    }
    if (order.status === 'shipped') {
        statusActions.push({
            label: 'Хүргэсэн',
            icon: 'i-lucide-package-check',
            onSelect: () => handleStatusChange(order, 'delivered')
        })
    }

    return [
        [
            {
                label: 'Дэлгэрэнгүй',
                icon: 'i-lucide-eye',
                onSelect: () => router.push(`/dashboard/orders/${order.id}`)
            },
            ...statusActions
        ],
        [
            {
                label: 'Цуцлах',
                icon: 'i-lucide-x-circle',
                color: 'error' as const,
                disabled: order.status === 'cancelled',
                onSelect: () => openCancelModal(order)
            }
        ]
    ]
}

// Watch filters
watch(
    [() => filter.keyword, () => filter.status],
    () => {
        filter.page = 1
        loadOrders()
    },
    { debounce: 300 } as any
)

watch(() => filter.page, loadOrders)

onMounted(() => {
    loadOrders()
})
</script>

<template>
    <div class="flex flex-col h-full w-full">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-[#E1E8E5] dark:border-gray-800 bg-white dark:bg-gray-900">
            <div class="flex items-start justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-[#102A32] dark:text-white">Захиалга</h1>
                    <p class="mt-1 text-sm text-[#5A7178] dark:text-gray-400">
                        Захиалгуудын нийт жагсаалт
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <UButton to="/dashboard/orders/new" color="primary" icon="i-lucide-plus">
                        Захиалга нэмэх
                    </UButton>
                </div>
            </div>
        </div>

        <!-- Bulk Actions Bar -->
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
        >
            <div
                v-if="selectedRows.length > 0"
                class="px-6 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 flex items-center justify-between"
            >
                <div class="flex items-center gap-3">
                    <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {{ selectedRows.length }} захиалга сонгогдсон
                    </span>
                    <UButton size="xs" variant="ghost" color="primary" @click="clearSelection">
                        Цуцлах
                    </UButton>
                </div>
                <div class="flex items-center gap-2">
                    <UButton
                        size="sm"
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-credit-card"
                        :loading="bulkActionLoading"
                        @click="bulkSetStatus('paid')"
                    >
                        Төлөгдсөн
                    </UButton>
                    <UButton
                        size="sm"
                        color="error"
                        variant="outline"
                        icon="i-lucide-x-circle"
                        :loading="bulkActionLoading"
                        @click="bulkCancelModalOpen = true"
                    >
                        Цуцлах
                    </UButton>
                </div>
            </div>
        </Transition>

        <!-- Filters -->
        <div class="px-6 py-4 border-b border-[#E1E8E5] dark:border-gray-800 bg-white dark:bg-gray-900">
            <div class="flex items-center justify-between gap-4">
                <UInput
                    v-model="filter.keyword"
                    placeholder="Захиалгын дугаар, нэрээр хайх..."
                    icon="i-lucide-search"
                    class="w-80"
                />

                <div class="flex items-center gap-2">
                    <USelect v-model="filter.status" :items="statusOptions" class="w-40" />
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto bg-white dark:bg-gray-900">
            <UTable
                :data="orders"
                :columns="columns"
                :loading="loading"
                class="w-full"
            >
                <template #select-header>
                    <UCheckbox
                        :model-value="isAllSelected"
                        :indeterminate="isSomeSelected"
                        @update:model-value="toggleSelectAll"
                    />
                </template>

                <template #select-cell="{ row }">
                    <div @click.stop>
                        <UCheckbox
                            :model-value="isSelected(row.original)"
                            @update:model-value="toggleSelect(row.original)"
                        />
                    </div>
                </template>

                <template #order_number-cell="{ row }">
                    <div class="cursor-pointer" @click="onRowClick(row.original)">
                        <span class="font-semibold text-[#102A32] dark:text-white hover:text-primary-600 transition-colors">
                            #{{ row.original.order_number }}
                        </span>
                    </div>
                </template>

                <template #customer-cell="{ row }">
                    <div class="cursor-pointer" @click="onRowClick(row.original)">
                        <div class="font-medium text-gray-900 dark:text-white">
                            {{ row.original.customer?.name || '-' }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ row.original.customer?.phone_number || '' }}
                        </div>
                    </div>
                </template>

                <template #status-cell="{ row }">
                    <UBadge
                        :color="getStatusColor(row.original.status)"
                        variant="subtle"
                        class="font-medium"
                    >
                        {{ getStatusLabel(row.original.status) }}
                    </UBadge>
                </template>

                <template #total_amount-cell="{ row }">
                    <span class="font-medium text-gray-900 dark:text-white">
                        {{ formatPrice(row.original.total_amount) }}
                    </span>
                </template>

                <template #created_at-cell="{ row }">
                    <span class="text-gray-600 dark:text-gray-400">
                        {{ formatDate(row.original.created_at) }}
                    </span>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex items-center justify-end gap-1" @click.stop>
                        <UDropdownMenu :items="getActionItems(row.original)">
                            <UButton
                                icon="i-lucide-more-horizontal"
                                color="neutral"
                                variant="ghost"
                                size="md"
                            />
                        </UDropdownMenu>
                    </div>
                </template>

                <template #empty>
                    <div class="flex flex-col items-center justify-center py-20 text-center">
                        <div
                            class="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-6"
                        >
                            <UIcon
                                name="i-lucide-shopping-cart"
                                class="w-10 h-10 text-primary-500"
                            />
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Захиалга олдсонгүй
                        </h3>
                        <p class="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                            Одоогоор ямар ч захиалга байхгүй байна. Шинэ захиалга нэмж эхлээрэй.
                        </p>
                        <UButton to="/dashboard/orders/new" color="primary" icon="i-lucide-plus">
                            Захиалга нэмэх
                        </UButton>
                    </div>
                </template>
            </UTable>
        </div>

        <!-- Pagination -->
        <div
            v-if="total > 0"
            class="px-6 py-4 border-t border-[#E1E8E5] dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between"
        >
            <p class="text-sm text-[#5A7178] dark:text-gray-400">
                {{ startItem }}-с {{ endItem }} хүртэл. Нийт: {{ total }}
            </p>
            <div class="flex items-center gap-2">
                <UButton
                    color="neutral"
                    variant="outline"
                    :disabled="filter.page <= 1"
                    @click="prevPage"
                >
                    Өмнөх
                </UButton>
                <UButton
                    color="neutral"
                    variant="outline"
                    :disabled="filter.page >= totalPages"
                    @click="nextPage"
                >
                    Дараах
                </UButton>
            </div>
        </div>

        <!-- Cancel Modal -->
        <UModal v-model:open="cancelModalOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-alert-triangle" class="text-red-500" />
                            <span class="font-semibold">Захиалга цуцлах</span>
                        </div>
                    </template>

                    <p>
                        <strong>#{{ orderToCancel?.order_number }}</strong> захиалгыг цуцлахдаа
                        итгэлтэй байна уу?
                    </p>
                    <p class="text-sm text-gray-500 mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="cancelModalOpen = false"
                            >
                                Болих
                            </UButton>
                            <UButton color="error" :loading="cancelling" @click="confirmCancel">
                                Цуцлах
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

        <!-- Bulk Cancel Modal -->
        <UModal v-model:open="bulkCancelModalOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-alert-triangle" class="text-red-500" />
                            <span class="font-semibold">Олноор цуцлах</span>
                        </div>
                    </template>

                    <p>
                        <strong>{{ selectedRows.length }}</strong> захиалгыг цуцлахдаа итгэлтэй
                        байна уу?
                    </p>
                    <p class="text-sm text-gray-500 mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="bulkCancelModalOpen = false"
                            >
                                Болих
                            </UButton>
                            <UButton
                                color="error"
                                :loading="bulkActionLoading"
                                @click="confirmBulkCancel"
                            >
                                Цуцлах
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
