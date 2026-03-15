<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Product } from '~/composables/useProducts'

useSeoMeta({
    title: 'Бүтээгдэхүүн - Instasell'
})

const { fetchProducts, deleteProduct, updateProduct, fetchCategories, exportProductsCSV, downloadImportTemplate, importProducts } = useProducts()
const toast = useToast()
const router = useRouter()

// Post to Facebook modal
const postModalOpen = ref(false)
const postModalProductId = ref<number | undefined>(undefined)

// Bulk post to Facebook modal
const bulkPostModalOpen = ref(false)

const openPostModal = (product: Product) => {
    postModalProductId.value = product.id
    postModalOpen.value = true
}

const openBulkPostModal = () => {
    if (selectedRows.value.length === 0) return
    bulkPostModalOpen.value = true
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
    { accessorKey: 'base_price', header: 'Үнийн дүн' },
    { accessorKey: 'stock', header: 'Үлдэгдэл' },
    { accessorKey: 'category', header: 'Ангилал' },
    { accessorKey: 'status', header: 'Төлөв' },
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

const setPage = (p: number) => { filter.page = p }

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
            color: 'primary'
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
            color: 'primary'
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
            color: 'primary'
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
            color: 'primary'
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
            color: 'primary'
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

// CSV Export
const exporting = ref(false)

const handleExportCSV = async (mode: 'filtered' | 'selected') => {
    exporting.value = true
    try {
        const params: { status?: string; keyword?: string; category?: string; stock?: string; ids?: number[] } = {}
        if (mode === 'selected') {
            params.ids = selectedRows.value.map((p) => p.id)
        } else {
            if (filter.status !== 'all') params.status = filter.status
            if (filter.keyword) params.keyword = filter.keyword
            if (filter.category !== 'all') params.category = filter.category
            if (filter.stock !== 'all') params.stock = filter.stock
        }
        await exportProductsCSV(params)
        toast.add({ title: 'Амжилттай', description: 'CSV файл татагдлаа', color: 'primary' })
    } catch {
        toast.add({ title: 'Алдаа', description: 'CSV татахад алдаа гарлаа', color: 'error' })
    } finally {
        exporting.value = false
    }
}

// CSV Import
const importModalOpen = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)
const selectedImportStatus = ref('draft')

const importStatusOptions = [
    { label: 'Ноорог - Хэрэглэгчид харагдахгүй', value: 'draft' },
    { label: 'Идэвхтэй - Шууд борлуулалтад орно', value: 'active' }
]

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
        const result = await importProducts(importFile.value, selectedImportStatus.value)
        if (result.created > 0 || result.updated > 0) {
            toast.add({
                title: 'Амжилттай',
                description: `${result.created} бараа нэмэгдлээ, ${result.updated} бараа шинэчлэгдлээ`,
                color: 'primary'
            })
        }
        if (result.errors?.length) {
            toast.add({
                title: 'Анхааруулга',
                description: `${result.errors.length} мөрөнд алдаа гарлаа`,
                color: 'warning'
            })
        }
        importModalOpen.value = false
        importFile.value = null
        await loadProducts()
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
    [() => filter.keyword, () => filter.category, () => filter.status, () => filter.stock, () => filter.sort_by, () => filter.sort_dir],
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
        <div class="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--surface-card)] px-4 sm:px-7">
            <span class="text-base font-bold text-[var(--text-heading)]">Бараа бүтээгдэхүүн</span>
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
                                    label: 'Бүх бараа (шүүлтүүрээр)',
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
                    <UButton to="/dashboard/products/new" color="primary" size="sm" icon="i-lucide-plus">
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
                        {{ selectedRows.length }} бүтээгдэхүүн сонгогдсон
                    </span>
                    <UButton size="xs" variant="ghost" color="primary" @click="clearSelection">
                        Цуцлах
                    </UButton>
                </div>
                <div class="flex items-center gap-2">
                    <UButton
                        size="sm"
                        color="primary"
                        variant="soft"
                        icon="i-lucide-share-2"
                        @click="openBulkPostModal"
                    >
                        Facebook-д нийтлэх
                    </UButton>
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

        <MobileActionBar :count="selectedRows.length" @clear="clearSelection">
            <UButton size="sm" color="primary" variant="soft" icon="i-lucide-share-2" @click="openBulkPostModal">Facebook</UButton>
            <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-check-circle" :loading="bulkActionLoading" @click="bulkSetStatus('active')">Идэвхжүүлэх</UButton>
            <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-archive" :loading="bulkActionLoading" @click="bulkSetStatus('draft')">Ноорог</UButton>
            <UButton size="sm" color="error" variant="outline" icon="i-lucide-trash-2" :loading="bulkActionLoading" @click="bulkDeleteModalOpen = true">Устгах</UButton>
        </MobileActionBar>

        <!-- Filters + Table Card -->
        <div class="flex-1 overflow-auto p-4 sm:p-6">
            <div class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
                <!-- Filters -->
                <div class="px-4 py-3 border-b border-[var(--border-primary)]">
                    <div class="flex flex-wrap items-center gap-2">
                        <UInput
                            v-model="filter.keyword"
                            placeholder="Нэр, SKU-гаар хайх..."
                            icon="i-lucide-search"
                            class="w-full sm:w-64"
                            size="sm"
                        />
                        <USelect v-model="filter.status" :items="statusOptions" class="w-full sm:w-32" size="sm" />
                        <USelect v-model="filter.stock" :items="stockOptions" class="w-full sm:w-32" size="sm" />
                        <USelect
                            v-model="filter.category"
                            :items="[
                                { label: 'Бүх ангилал', value: 'all' },
                                ...categories.map((c) => ({ label: c, value: c }))
                            ]"
                            class="w-full sm:w-32"
                            size="sm"
                        />
                    </div>
                </div>

                <!-- Table -->
            <UTable
                :data="products"
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
                <template #base_price-header>
                    <button class="flex items-center gap-1 cursor-pointer hover:text-[var(--text-heading)] transition-colors" @click="toggleSort('price')">
                        Үнийн дүн
                        <UIcon :name="sortIcon('price')" class="size-3" :class="filter.sort_by === 'price' ? 'text-primary-500' : 'opacity-40'" />
                    </button>
                </template>

                <template #name-header>
                    <button class="flex items-center gap-1 cursor-pointer hover:text-[var(--text-heading)] transition-colors" @click="toggleSort('name')">
                        Бараа бүтээгдэхүүн
                        <UIcon :name="sortIcon('name')" class="size-3" :class="filter.sort_by === 'name' ? 'text-primary-500' : 'opacity-40'" />
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

                <template #name-cell="{ row }">
                    <div
                        class="flex items-center gap-3 cursor-pointer"
                        @click="onRowClick(row.original)"
                    >
                        <div
                            class="w-10 h-10 rounded-lg bg-[var(--surface-inset)] flex items-center justify-center overflow-hidden shrink-0"
                        >
                            <img
                                v-if="row.original.images?.length"
                                :src="row.original.images[0]"
                                :alt="row.original.name"
                                class="w-full h-full object-cover"
                            />
                            <UIcon v-else name="i-lucide-package" class="w-5 h-5 text-[var(--text-placeholder)]" />
                        </div>
                        <span class="font-medium text-[var(--text-heading)]">
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
                    <span class="text-[var(--text-heading)]">
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
                                : 'text-[var(--text-muted)]'
                        "
                    >
                        {{ getStockLabel(row.original) }}
                    </span>
                </template>

                <template #category-cell="{ row }">
                    <span class="text-[var(--text-muted)]">
                        {{ row.original.category || '-' }}
                    </span>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex items-center justify-end gap-1" @click.stop>
                        <div
                            class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <UButton
                                label="Нийтлэх"
                                icon="i-lucide-share-2"
                                color="neutral"
                                variant="subtle"
                                size="md"
                                title="Facebook-д нийтлэх"
                                @click.stop="openPostModal(row.original)"
                            />
                            <UButton
                                label="Засах"
                                icon="i-lucide-pencil"
                                color="neutral"
                                variant="ghost"
                                size="md"
                                title="Засах"
                                @click.stop="
                                    router.push(`/dashboard/products/${row.original.id}/edit`)
                                "
                            />
                        </div>
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
                        <h3 class="text-lg font-semibold text-[var(--text-heading)] mb-2">
                            Бүтээгдэхүүн олдсонгүй
                        </h3>
                        <p class="text-[var(--text-muted)] max-w-sm mb-6">
                            Одоогоор ямар ч бүтээгдэхүүн байхгүй байна. Шинэ бүтээгдэхүүн нэмж
                            эхлээрэй.
                        </p>
                        <UButton to="/dashboard/products/new" color="primary" icon="i-lucide-plus">
                            Бүтээгдэхүүн нэмэх
                        </UButton>
                    </div>
                </template>
            </UTable>

                <TablePagination :page="filter.page" :total="total" :page-size="filter.size" @update:page="setPage" />
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
                    <p class="text-sm text-[var(--text-muted)] mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

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
                    <p class="text-sm text-[var(--text-muted)] mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

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
        <!-- CSV Import Modal -->
        <UModal v-model:open="importModalOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-upload" class="text-primary-500" />
                            <span class="font-semibold">CSV-с бараа оруулах</span>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <p class="text-sm text-[var(--text-muted)]">
                            CSV файлаар бараа бөөнөөр оруулах. Загвар файлыг татаж форматыг харна уу.
                        </p>

                        <UButton
                            variant="link"
                            color="primary"
                            icon="i-lucide-file-down"
                            size="sm"
                            @click="downloadImportTemplate"
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

                        <div>
                            <label class="block text-sm font-medium text-[var(--text-heading)] mb-2">
                                Импортлосон бараануудын эхний төлөв
                            </label>
                            <USelect v-model="selectedImportStatus" :items="importStatusOptions" class="w-full" />
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

        <!-- Post to Facebook Modal -->
        <ProductPostModal v-model:open="postModalOpen" :product-id="postModalProductId" />

        <!-- Bulk Post to Facebook Modal -->
        <ProductBulkPostModal
            v-model:open="bulkPostModalOpen"
            :products="selectedRows"
            @success="loadProducts"
        />
    </div>
</template>
