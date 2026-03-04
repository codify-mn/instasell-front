<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Product, ImportResult } from '~/composables/useProducts'

useSeoMeta({
    title: 'Бүтээгдэхүүн - Instasell'
})

const { fetchProducts, deleteProduct, updateProduct, fetchCategories } = useProducts()
const toast = useToast()
const router = useRouter()

// Bulk import modal
const bulkImportModalOpen = ref(false)

// Post to Facebook modal
const postModalOpen = ref(false)
const postModalProductId = ref<number | undefined>(undefined)

const openPostModal = (product: Product) => {
    postModalProductId.value = product.id
    postModalOpen.value = true
}

const loading = ref(true)
const products = ref<Product[]>([])
const total = ref(0)
const categories = ref<string[]>([])

// Selection state
const selectedRows = ref<Product[]>([])

const filter = reactive({
    keyword: '',
    category: 'all',
    status: 'all',
    stock: 'all',
    page: 1,
    size: 10
})

const statusOptions = [
    { label: 'Бүх төлөв', value: 'all' },
    { label: 'Ноорог', value: 'draft' },
    { label: 'Идэвхтэй', value: 'active' },
    { label: 'Дууссан', value: 'out_of_stock' },
    { label: 'Архивлагдсан', value: 'archived' }
]

const stockOptions = [
    { label: 'Бүх үлдэгдэл', value: 'all' },
    { label: 'Байгаа', value: 'in_stock' },
    { label: 'Дуусаж байгаа', value: 'low_stock' },
    { label: 'Дууссан', value: 'out_of_stock' }
]

const columns: TableColumn<Product>[] = [
    { accessorKey: 'select', header: '' },
    { accessorKey: 'name', header: 'Бараа бүтээгдэхүүн' },
    { accessorKey: 'status', header: 'Төлөв' },
    { accessorKey: 'base_price', header: 'Үнийн дүн' },
    { accessorKey: 'stock', header: 'Үлдэгдэл' },
    { accessorKey: 'category', header: 'Ангилал' },
    { accessorKey: 'actions', header: '' }
]

const statusColors: Record<string, 'neutral' | 'success' | 'error' | 'warning'> = {
    draft: 'neutral',
    active: 'success',
    out_of_stock: 'error',
    archived: 'warning'
}

const statusLabels: Record<string, string> = {
    draft: 'Ноорог',
    active: 'Идэвхтэй',
    out_of_stock: 'Дууссан',
    archived: 'Архив'
}

const loadProducts = async () => {
    loading.value = true
    try {
        const apiFilter = {
            ...filter,
            status: filter.status === 'all' ? '' : filter.status,
            category: filter.category === 'all' ? '' : filter.category,
            stock: filter.stock === 'all' ? '' : filter.stock
        }
        const res = await fetchProducts(apiFilter)
        products.value = res.products || []
        total.value = res.total || 0
        // Clear selection when products reload
        selectedRows.value = []
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Бүтээгдэхүүн ачаалахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

const loadCategories = async () => {
    try {
        const result = await fetchCategories()
        categories.value = Array.isArray(result) ? result : []
    } catch {
        categories.value = []
    }
}

const getStock = (product: Product): number => {
    if (product.has_variants && product.variants?.length) {
        return product.variants.reduce((sum, v) => sum + v.stock_quantity, 0)
    }
    return product.stock_quantity ?? 0
}

const getStockLabel = (product: Product): string => {
    const stock = getStock(product)
    if (stock === 0) return 'Дууссан'
    if (stock <= 5) return `${stock}ш үлдсэн`
    return `${stock}ш үлдсэн`
}

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('mn-MN').format(price) + '₮'
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
const isSelected = (product: Product) => {
    return selectedRows.value.some((p) => p.id === product.id)
}

const toggleSelect = (product: Product) => {
    const index = selectedRows.value.findIndex((p) => p.id === product.id)
    if (index === -1) {
        selectedRows.value.push(product)
    } else {
        selectedRows.value.splice(index, 1)
    }
}

const isAllSelected = computed(() => {
    return products.value.length > 0 && selectedRows.value.length === products.value.length
})

const isSomeSelected = computed(() => {
    return selectedRows.value.length > 0 && selectedRows.value.length < products.value.length
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedRows.value = []
    } else {
        selectedRows.value = [...products.value]
    }
}

const clearSelection = () => {
    selectedRows.value = []
}

// Delete modal
const deleteModalOpen = ref(false)
const productToDelete = ref<Product | null>(null)
const deleting = ref(false)

const openDeleteModal = (product: Product) => {
    productToDelete.value = product
    deleteModalOpen.value = true
}

const confirmDelete = async () => {
    if (!productToDelete.value) return

    deleting.value = true
    try {
        await deleteProduct(productToDelete.value.id)
        toast.add({
            title: 'Амжилттай',
            description: 'Бүтээгдэхүүн устгагдлаа',
            color: 'success'
        })
        deleteModalOpen.value = false
        await loadProducts()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Устгахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        deleting.value = false
    }
}

// Toggle status
const toggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'draft' : 'active'
    try {
        await updateProduct(product.id, {
            name: product.name,
            category: product.category,
            status: newStatus
        })
        toast.add({
            title: 'Амжилттай',
            description: `Төлөв ${statusLabels[newStatus]} болгож өөрчлөгдлөө`,
            color: 'success'
        })
        await loadProducts()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Төлөв өөрчлөхөд алдаа гарлаа',
            color: 'error'
        })
    }
}

// Toggle featured
const toggleFeatured = async (product: Product) => {
    const newFeatured = !product.is_featured
    try {
        await updateProduct(product.id, { is_featured: newFeatured } as any)
        product.is_featured = newFeatured
        toast.add({
            title: 'Амжилттай',
            description: newFeatured
                ? 'Checkout-д санал болгох бараанд нэмэгдлээ'
                : 'Санал болгох бараанаас хасагдлаа',
            color: 'success'
        })
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Өөрчлөхөд алдаа гарлаа',
            color: 'error'
        })
    }
}

// Bulk actions
const bulkActionLoading = ref(false)

const bulkSetStatus = async (status: 'active' | 'draft' | 'archived') => {
    if (selectedRows.value.length === 0) return

    bulkActionLoading.value = true
    try {
        await Promise.all(
            selectedRows.value.map((product) =>
                updateProduct(product.id, {
                    name: product.name,
                    category: product.category,
                    status
                })
            )
        )
        toast.add({
            title: 'Амжилттай',
            description: `${selectedRows.value.length} бүтээгдэхүүний төлөв ${statusLabels[status]} болгож өөрчлөгдлөө`,
            color: 'success'
        })
        await loadProducts()
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

// Bulk delete modal
const bulkDeleteModalOpen = ref(false)

const confirmBulkDelete = async () => {
    if (selectedRows.value.length === 0) return

    bulkActionLoading.value = true
    try {
        await Promise.all(selectedRows.value.map((product) => deleteProduct(product.id)))
        toast.add({
            title: 'Амжилттай',
            description: `${selectedRows.value.length} бүтээгдэхүүн устгагдлаа`,
            color: 'success'
        })
        bulkDeleteModalOpen.value = false
        await loadProducts()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Устгахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        bulkActionLoading.value = false
    }
}

// Bulk import handlers
const onImportSuccess = (_result: ImportResult) => {
    bulkImportModalOpen.value = false
    loadProducts()
}

// Row click handler
const onRowClick = (product: Product) => {
    router.push(`/dashboard/products/${product.id}`)
}

// Action menu items
const getActionItems = (product: Product) => [
    [
        {
            label: 'Facebook-д нийтлэх',
            icon: 'i-lucide-share-2',
            onSelect: () => openPostModal(product)
        },
        {
            label: 'Засах',
            icon: 'i-lucide-pencil',
            onSelect: () => router.push(`/dashboard/products/${product.id}`)
        },
        {
            label: product.status === 'active' ? 'Ноорог болгох' : 'Идэвхжүүлэх',
            icon: product.status === 'active' ? 'i-lucide-archive' : 'i-lucide-check-circle',
            onSelect: () => toggleStatus(product)
        }
    ],
    [
        {
            label: 'Устгах',
            icon: 'i-lucide-trash-2',
            color: 'error' as const,
            onSelect: () => openDeleteModal(product)
        }
    ]
]

// Watch filters
watch(
    [() => filter.keyword, () => filter.category, () => filter.status, () => filter.stock],
    () => {
        filter.page = 1
        loadProducts()
    },
    { debounce: 300 } as any
)

watch(() => filter.page, loadProducts)

onMounted(() => {
    loadProducts()
    loadCategories()
})
</script>

<template>
    <div class="flex flex-col h-full w-full">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div class="flex items-start justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Бараа бүтээгдэхүүн
                    </h1>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Бараа бүтээгдэхүүний нийт жагсаалт
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <UButton
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-file-spreadsheet"
                        @click="bulkImportModalOpen = true"
                    >
                        Excel-с оруулах
                    </UButton>
                    <UButton to="/dashboard/products/new" color="primary" icon="i-lucide-plus">
                        Бараа нэмэх
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
                        {{ selectedRows.length }} бүтээгдэхүүн сонгогдсон
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
                        icon="i-lucide-check-circle"
                        :loading="bulkActionLoading"
                        @click="bulkSetStatus('active')"
                    >
                        Идэвхжүүлэх
                    </UButton>
                    <UButton
                        size="sm"
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-archive"
                        :loading="bulkActionLoading"
                        @click="bulkSetStatus('draft')"
                    >
                        Ноорог болгох
                    </UButton>
                    <UButton
                        size="sm"
                        color="error"
                        variant="outline"
                        icon="i-lucide-trash-2"
                        :loading="bulkActionLoading"
                        @click="bulkDeleteModalOpen = true"
                    >
                        Устгах
                    </UButton>
                </div>
            </div>
        </Transition>

        <!-- Filters -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div class="flex items-center justify-between gap-4">
                <UInput
                    v-model="filter.keyword"
                    placeholder="Бараа нэрээр хайх..."
                    icon="i-lucide-search"
                    class="w-80"
                />

                <div class="flex items-center gap-2">
                    <USelect v-model="filter.stock" :items="stockOptions" class="w-36" />
                    <USelect v-model="filter.status" :items="statusOptions" class="w-32" />
                    <USelect
                        v-model="filter.category"
                        :items="[
                            { label: 'Бүх ангилал', value: 'all' },
                            ...categories.map((c) => ({ label: c, value: c }))
                        ]"
                        class="w-36"
                    />
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto">
            <UTable
                :data="products"
                :columns="columns"
                :loading="loading"
                class="w-full"
                :ui="{
                    thead: 'bg-gray-50 dark:bg-gray-900/50',
                    th: 'text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    td: 'px-4 py-3',
                    tbody: 'divide-y divide-gray-100 dark:divide-gray-800',
                    tr: 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }"
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

                <template #name-cell="{ row }">
                    <div
                        class="flex items-center gap-3 cursor-pointer"
                        @click="onRowClick(row.original)"
                    >
                        <div
                            class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0"
                        >
                            <img
                                v-if="row.original.images?.length"
                                :src="row.original.images[0]"
                                :alt="row.original.name"
                                class="w-full h-full object-cover"
                            >
                            <UIcon v-else name="i-lucide-package" class="w-5 h-5 text-gray-400" />
                        </div>
                        <span class="font-medium text-gray-900 dark:text-white">
                            {{ row.original.name }}
                        </span>
                        <button
                            type="button"
                            class="shrink-0 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            :title="
                                row.original.is_featured
                                    ? 'Санал болгохоос хасах'
                                    : 'Checkout-д санал болгох'
                            "
                            @click.stop="toggleFeatured(row.original)"
                        >
                            <UIcon
                                name="i-lucide-star"
                                class="w-4 h-4"
                                :style="
                                    row.original.is_featured ? 'color: #f59e0b; fill: #f59e0b;' : ''
                                "
                                :class="
                                    !row.original.is_featured
                                        ? 'text-gray-300 dark:text-gray-600'
                                        : ''
                                "
                            />
                        </button>
                    </div>
                </template>

                <template #status-cell="{ row }">
                    <UBadge
                        :color="statusColors[row.original.status] || 'neutral'"
                        variant="subtle"
                        class="font-medium"
                    >
                        {{ statusLabels[row.original.status] || row.original.status }}
                    </UBadge>
                </template>

                <template #base_price-cell="{ row }">
                    <span class="text-gray-900 dark:text-white">
                        {{
                            formatPrice(
                                row.original.timed_sale_enabled && row.original.timed_sale_price
                                    ? row.original.timed_sale_price
                                    : row.original.price || 0
                            )
                        }}
                    </span>
                </template>

                <template #stock-cell="{ row }">
                    <span
                        :class="
                            getStock(row.original) <= 5
                                ? 'text-orange-500'
                                : 'text-gray-600 dark:text-gray-400'
                        "
                    >
                        {{ getStockLabel(row.original) }}
                    </span>
                </template>

                <template #category-cell="{ row }">
                    <span class="text-gray-600 dark:text-gray-400">
                        {{ row.original.category || '-' }}
                    </span>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex items-center justify-end gap-1" @click.stop>
                        <UButton
                            icon="i-lucide-share-2"
                            color="neutral"
                            variant="ghost"
                            size="md"
                            title="Facebook-д нийтлэх"
                            @click.stop="openPostModal(row.original)"
                        />
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
                            <UIcon name="i-lucide-package" class="w-10 h-10 text-primary-500" />
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Бүтээгдэхүүн олдсонгүй
                        </h3>
                        <p class="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                            Одоогоор ямар ч бүтээгдэхүүн байхгүй байна. Шинэ бүтээгдэхүүн нэмж
                            эхлээрэй.
                        </p>
                        <UButton to="/dashboard/products/new" color="primary" icon="i-lucide-plus">
                            Бүтээгдэхүүн нэмэх
                        </UButton>
                    </div>
                </template>
            </UTable>
        </div>

        <!-- Pagination -->
        <div
            v-if="total > 0"
            class="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between"
        >
            <p class="text-sm text-gray-500 dark:text-gray-400">
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

        <!-- Delete Modal -->
        <UModal v-model:open="deleteModalOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-alert-triangle" class="text-red-500" />
                            <span class="font-semibold">Устгах</span>
                        </div>
                    </template>

                    <p>
                        <strong>{{ productToDelete?.name }}</strong> бүтээгдэхүүнийг устгахдаа
                        итгэлтэй байна уу?
                    </p>
                    <p class="text-sm text-gray-500 mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="deleteModalOpen = false"
                            >
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

        <!-- Bulk Delete Modal -->
        <UModal v-model:open="bulkDeleteModalOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-alert-triangle" class="text-red-500" />
                            <span class="font-semibold">Олноор устгах</span>
                        </div>
                    </template>

                    <p>
                        <strong>{{ selectedRows.length }}</strong> бүтээгдэхүүнийг устгахдаа
                        итгэлтэй байна уу?
                    </p>
                    <p class="text-sm text-gray-500 mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="bulkDeleteModalOpen = false"
                            >
                                Болих
                            </UButton>
                            <UButton
                                color="error"
                                :loading="bulkActionLoading"
                                @click="confirmBulkDelete"
                            >
                                Устгах
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

        <!-- Bulk Import Modal -->
        <ProductBulkImportModal v-model:open="bulkImportModalOpen" @success="onImportSuccess" />

        <!-- Post to Facebook Modal -->
        <ProductPostModal v-model:open="postModalOpen" :product-id="postModalProductId" />
    </div>
</template>
