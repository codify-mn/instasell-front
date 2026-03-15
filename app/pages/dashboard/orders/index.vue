<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Order, OrderStatus } from '~/composables/useOrders'

useSeoMeta({
    title: 'Захиалга - Instasell'
})

const { fetchOrders, updateOrderStatus, cancelOrder, getStatusLabel, getStatusColor, formatPrice, exportOrdersCSV, downloadOrderImportTemplate, importOrdersCSV } =
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
    date_from: '',
    date_to: '',
    sort_by: '',
    sort_dir: '',
    page: 1,
    size: 10
})

const toggleSort = (col: string) => {
    if (filter.sort_by === col) {
        filter.sort_dir = filter.sort_dir === 'asc' ? 'desc' : filter.sort_dir === 'desc' ? '' : 'asc'
        if (!filter.sort_dir) filter.sort_by = ''
    } else {
        filter.sort_by = col
        filter.sort_dir = 'desc'
    }
}

const sortIcon = (col: string) => {
    if (filter.sort_by !== col) return 'i-lucide-arrow-up-down'
    return filter.sort_dir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
}

const statusOptions = [
    { label: 'Бүх төлөв', value: 'all' },
    { label: 'Хүлээгдэж буй', value: 'pending' },
    { label: 'Төлөгдсөн', value: 'paid' },
    { label: 'Илгээгдсэн', value: 'shipped' },
    { label: 'Хүргэгдсэн', value: 'delivered' },
    { label: 'Цуцлагдсан', value: 'cancelled' },
    { label: 'Буцаагдсан', value: 'refunded' }
]

const columns: TableColumn<Order>[] = [
    { accessorKey: 'select', header: '' },
    { accessorKey: 'order_number', header: 'Дугаар' },
    { accessorKey: 'customer', header: 'Худалдан авагч' },
    { accessorKey: 'products', header: 'Бараа' },
    { accessorKey: 'total_amount', header: 'Дүн' },
    { accessorKey: 'created_at', header: 'Огноо' },
    { accessorKey: 'status', header: 'Төлөв' },
    { accessorKey: 'actions', header: '' }
]

const getOrderImages = (order: Order) => {
    if (!order.items?.length) return []
    const seen = new Set<string>()
    return order.items
        .filter(item => {
            const img = item.product?.images?.[0]
            if (!img || seen.has(img)) return false
            seen.add(img)
            return true
        })
        .map(item => ({
            src: item.product!.images![0],
            alt: item.name
        }))
        .slice(0, 4)
}

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


const setPage = (p: number) => { filter.page = p }

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
            color: 'primary'
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
            color: 'primary'
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
            color: 'primary'
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
            color: 'primary'
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
    if (['paid', 'shipped', 'delivered'].includes(order.status)) {
        statusActions.push({
            label: 'Буцаагдсан',
            icon: 'i-lucide-rotate-ccw',
            onSelect: () => handleStatusChange(order, 'refunded')
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

// CSV Export
const exporting = ref(false)

const handleExportCSV = async (mode: 'filtered' | 'selected') => {
    exporting.value = true
    try {
        const params: { status?: string; keyword?: string; ids?: number[] } = {}
        if (mode === 'selected') {
            params.ids = selectedRows.value.map((o) => o.id)
        } else {
            if (filter.status !== 'all') params.status = filter.status
            if (filter.keyword) params.keyword = filter.keyword
        }
        await exportOrdersCSV(params)
        toast.add({
            title: 'Амжилттай',
            description: 'CSV файл татагдлаа',
            color: 'primary'
        })
    } catch {
        toast.add({
            title: 'Алдаа',
            description: 'CSV татахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        exporting.value = false
    }
}

// CSV Import
const importModalOpen = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)

const handleImportFile = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files?.length) {
        importFile.value = target.files[0] ?? null
    }
}

const handleImport = async () => {
    if (!importFile.value) return
    importing.value = true
    try {
        const result = await importOrdersCSV(importFile.value)
        toast.add({
            title: 'Амжилттай',
            description: `${result.created}/${result.total} захиалга импортлогдлоо`,
            color: 'primary'
        })
        if (result.errors?.length) {
            toast.add({
                title: 'Анхааруулга',
                description: `${result.errors.length} мөрөнд алдаа гарлаа`,
                color: 'warning'
            })
        }
        importModalOpen.value = false
        importFile.value = null
        await loadOrders()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Импортлоход алдаа гарлаа',
            color: 'error'
        })
    } finally {
        importing.value = false
    }
}

// Watch filters
watch(
    [() => filter.keyword, () => filter.status, () => filter.date_from, () => filter.date_to, () => filter.sort_by, () => filter.sort_dir],
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
        <div class="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--surface-card)] px-4 sm:px-7">
            <span class="text-base font-bold text-[var(--text-heading)]">Захиалга</span>
            <div class="flex items-center gap-1.5">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-upload"
                        size="sm"
                        @click="importModalOpen = true"
                    >
                        Импорт
                    </UButton>
                    <UDropdownMenu
                        :items="[
                            [
                                {
                                    label: 'Бүх захиалга (шүүлтүүрээр)',
                                    icon: 'i-lucide-filter',
                                    onSelect: () => handleExportCSV('filtered')
                                },
                                {
                                    label: `Сонгосон (${selectedRows.length})`,
                                    icon: 'i-lucide-check-square',
                                    disabled: selectedRows.length === 0,
                                    onSelect: () => handleExportCSV('selected')
                                }
                            ]
                        ]"
                    >
                        <UButton
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-download"
                            size="sm"
                            :loading="exporting"
                        >
                            Экспорт
                        </UButton>
                    </UDropdownMenu>
                    <UButton to="/dashboard/orders/new" color="primary" size="sm" icon="i-lucide-plus">
                        Нэмэх
                    </UButton>
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
                class="px-4 sm:px-6 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 hidden sm:flex items-center justify-between"
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
                        icon="i-lucide-download"
                        :loading="exporting"
                        @click="handleExportCSV('selected')"
                    >
                        Экспорт
                    </UButton>
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

        <MobileActionBar :count="selectedRows.length" @clear="clearSelection">
            <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-download" :loading="exporting" @click="handleExportCSV('selected')">Экспорт</UButton>
            <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-credit-card" :loading="bulkActionLoading" @click="bulkSetStatus('paid')">Төлөгдсөн</UButton>
            <UButton size="sm" color="error" variant="outline" icon="i-lucide-x-circle" :loading="bulkActionLoading" @click="bulkCancelModalOpen = true">Цуцлах</UButton>
        </MobileActionBar>

        <!-- Filters + Table Card -->
        <div class="flex-1 overflow-auto p-4 sm:p-6">
            <div class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
                <!-- Filters -->
                <div class="px-4 py-3 border-b border-[var(--border-primary)]">
                    <div class="flex flex-wrap items-center gap-2">
                        <UInput
                            v-model="filter.keyword"
                            placeholder="Дугаар, нэрээр хайх..."
                            icon="i-lucide-search"
                            class="w-full sm:w-64"
                            size="sm"
                        />
                        <USelect v-model="filter.status" :items="statusOptions" class="w-full sm:w-32" size="sm" />
                        <div class="flex items-center gap-1.5">
                            <input
                                v-model="filter.date_from"
                                type="date"
                                class="h-8 rounded-md border border-[var(--border-primary)] bg-[var(--surface-inset)] px-2.5 text-xs text-[var(--text-body)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <span class="text-xs text-[var(--text-placeholder)]">–</span>
                            <input
                                v-model="filter.date_to"
                                type="date"
                                class="h-8 rounded-md border border-[var(--border-primary)] bg-[var(--surface-inset)] px-2.5 text-xs text-[var(--text-body)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>
            <UTable
                :data="orders"
                :columns="columns"
                :loading="loading"
                class="w-full"
                :ui="{
                    base: 'min-w-full border-separate border-spacing-0',
                    thead: '[&>tr]:bg-[var(--surface-inset)]/60 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'first:rounded-l-lg last:rounded-r-lg border-y border-[var(--border-primary)] first:border-l last:border-r px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider',
                    td: 'px-4 py-3 border-b border-[var(--border-primary)]',
                    tr: 'group hover:bg-[var(--surface-inset)]/40 transition-colors duration-150'
                }"
            >
                <template #total_amount-header>
                    <button class="flex items-center gap-1 cursor-pointer hover:text-[var(--text-heading)] transition-colors" @click="toggleSort('total_amount')">
                        Дүн
                        <UIcon :name="sortIcon('total_amount')" class="size-3" :class="filter.sort_by === 'total_amount' ? 'text-primary-500' : 'opacity-40'" />
                    </button>
                </template>

                <template #created_at-header>
                    <button class="flex items-center gap-1 cursor-pointer hover:text-[var(--text-heading)] transition-colors" @click="toggleSort('created_at')">
                        Огноо
                        <UIcon :name="sortIcon('created_at')" class="size-3" :class="filter.sort_by === 'created_at' ? 'text-primary-500' : 'opacity-40'" />
                    </button>
                </template>

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
                        <span class="font-semibold text-[var(--text-heading)] hover:text-primary-600 transition-colors">
                            #{{ row.original.order_number }}
                        </span>
                    </div>
                </template>

                <template #customer-cell="{ row }">
                    <div class="cursor-pointer" @click="onRowClick(row.original)">
                        <div class="font-medium text-[var(--text-heading)]">
                            {{ row.original.customer?.name || '-' }}
                        </div>
                        <div class="text-sm text-[var(--text-muted)]">
                            {{ row.original.customer?.phone_number || '' }}
                        </div>
                    </div>
                </template>

                <template #products-cell="{ row }">
                    <UAvatarGroup v-if="getOrderImages(row.original).length" size="xs">
                        <UAvatar
                            v-for="(img, i) in getOrderImages(row.original)"
                            :key="i"
                            :src="img.src"
                            :alt="img.alt"
                        />
                        <UAvatar
                            v-if="row.original.items.length > 4"
                            :label="`+${row.original.items.length - 4}`"
                        />
                    </UAvatarGroup>
                    <span v-else class="text-xs text-[var(--text-placeholder)]">{{ row.original.items?.length || 0 }} бараа</span>
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
                    <span class="font-medium text-[var(--text-heading)]">
                        {{ formatPrice(row.original.total_amount) }}
                    </span>
                </template>

                <template #created_at-cell="{ row }">
                    <span class="text-[var(--text-muted)]">
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
                        <h3 class="text-lg font-semibold text-[var(--text-heading)] mb-2">
                            Захиалга олдсонгүй
                        </h3>
                        <p class="text-[var(--text-muted)] max-w-sm mb-6">
                            Одоогоор ямар ч захиалга байхгүй байна. Шинэ захиалга нэмж эхлээрэй.
                        </p>
                        <UButton to="/dashboard/orders/new" color="primary" icon="i-lucide-plus">
                            Захиалга нэмэх
                        </UButton>
                    </div>
                </template>
            </UTable>

                <TablePagination :page="filter.page" :total="total" :page-size="filter.size" @update:page="setPage" />
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
                    <p class="text-sm text-[var(--text-muted)] mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

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
                    <p class="text-sm text-[var(--text-muted)] mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

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

        <!-- CSV Import Modal -->
        <UModal v-model:open="importModalOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-upload" class="text-primary-500" />
                            <span class="font-semibold">CSV-с захиалга оруулах</span>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <p class="text-sm text-[var(--text-muted)]">
                            CSV файлаар захиалга бөөнөөр оруулах. Загвар файлыг татаж форматыг харна уу.
                        </p>

                        <UButton
                            variant="link"
                            color="primary"
                            icon="i-lucide-file-down"
                            size="sm"
                            @click="downloadOrderImportTemplate"
                        >
                            Загвар файл татах
                        </UButton>

                        <div>
                            <label class="block text-sm font-medium text-[var(--text-heading)] mb-2">
                                CSV файл сонгох
                            </label>
                            <input
                                type="file"
                                accept=".csv"
                                class="block w-full text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-300 cursor-pointer"
                                @change="handleImportFile"
                            />
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="importModalOpen = false"
                            >
                                Болих
                            </UButton>
                            <UButton
                                color="primary"
                                :loading="importing"
                                :disabled="!importFile"
                                @click="handleImport"
                            >
                                Оруулах
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
