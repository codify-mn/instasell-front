<script setup lang="ts">
import type { Product, CreateProductInput } from '~/composables/useProducts'
import type { LiveSaleProduct } from '~/types'

const { fetchProducts, fetchCategories, createProduct } = useProducts()
const toast = useToast()
const route = useRoute()
const config = useRuntimeConfig()

const props = defineProps<{
    shopId?: number
}>()

const addedProducts = useState<LiveSaleProduct[]>('addedProducts')
const activeProductId = inject<Ref<number | null>>('activeProductId', ref(null))
const onProductSelect = inject<(product: Product) => void>('onProductSelect')

const search = ref('')
const loading = ref(false)
const products = ref<Product[]>([])
const page = ref(1)
const hasMore = ref(true)

// Filters
const showOnlyAdded = ref(false)
const selectedCategory = ref<string>('')
const categories = ref<string[]>([])

// Quick create
const quickCreateOpen = ref(false)
const quickCreateLoading = ref(false)
const quickCreateForm = reactive({
    name: '',
    price: 0,
    keyword: '',
    category: '',
    stock_quantity: 0
})

// Debounce search
const debouncedSearch = refDebounced(search, 300)

const categoryOptions = computed(() => {
    return [
        { label: 'Бүх ангилал', value: 'all' },
        ...categories.value.map((c) => ({ label: c, value: c }))
    ]
})

const filteredProducts = computed(() => {
    if (!showOnlyAdded.value) return products.value
    const addedIds = new Set(addedProducts.value.map((p) => p.product_id))
    return products.value.filter((p) => addedIds.has(p.id))
})

const loadProducts = async (reset = false) => {
    if (loading.value || (!hasMore.value && !reset)) return

    loading.value = true
    try {
        if (reset) {
            page.value = 1
            products.value = []
            hasMore.value = true
        }

        const response = await fetchProducts({
            keyword: debouncedSearch.value,
            category: selectedCategory.value === 'all' ? '' : selectedCategory.value,
            sale_id: showOnlyAdded.value ? Number(route.params.liveID) : undefined,
            page: page.value,
            size: 20
        })

        if (response.products.length < 20) {
            hasMore.value = false
        }

        if (reset) {
            products.value = response.products
        } else {
            products.value.push(...response.products)
        }

        page.value++
    } catch (error) {
        toast.add({
            title: 'Error loading products',
            description: 'Failed to fetch products list',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

const loadCategories = async () => {
    try {
        categories.value = await fetchCategories()
    } catch {
        categories.value = []
    }
}

watch(debouncedSearch, () => {
    loadProducts(true)
})

watch(selectedCategory, () => {
    loadProducts(true)
})

onMounted(() => {
    loadProducts(true)
    loadCategories()
})

const handleAdd = async (product: Product) => {
    console.log('Added product on live:', product)
    try {
        await $fetch(`${config.public.apiUrl}/api/live-sales/${route.params.liveID}/products`, {
            method: 'POST',
            body: {
                product_id: product.id,
                keyword: product.variants?.[0]?.keyword || product.search_keywords || ''
            },
            credentials: 'include'
        })

        addedProducts?.value.push({
            id: 0,
            product_id: product.id,
            live_sale_id: 1,
            product: product,
            keyword: ''
        })

        toast.add({
            title: 'Product Added',
            description: `Added ${product.name} for live stream`,
            icon: 'i-heroicons-check-circle',
            color: 'success'
        })
    } catch (error) {
        toast.add({
            title: 'Error adding product',
            description: 'Failed to add product',
            color: 'error'
        })
    }
}

const handleSelect = async (product: Product) => {
    // Update canvas overlay with product info
    onProductSelect?.(product)

    // Call API to set active product
    try {
        await $fetch(`${config.public.apiUrl}/api/live-sales/${route.params.liveID}/active-product`, {
            method: 'PATCH',
            body: { product_id: product.id },
            credentials: 'include'
        })
        activeProductId.value = product.id
    } catch {
        // Non-critical — overlay still works even if API fails
    }

    toast.add({
        title: 'Бараа сонгогдлоо',
        description: `${product.name} live дээр харагдаж байна`,
        icon: 'i-heroicons-check-circle',
        color: 'success'
    })
}

const resetQuickCreateForm = () => {
    quickCreateForm.name = ''
    quickCreateForm.price = 0
    quickCreateForm.keyword = ''
    quickCreateForm.category = ''
    quickCreateForm.stock_quantity = 0
}

const handleQuickCreate = async () => {
    if (!quickCreateForm.name || !quickCreateForm.keyword || quickCreateForm.price <= 0) {
        toast.add({
            title: 'Validation Error',
            description: 'Name, keyword, and price are required',
            color: 'error'
        })
        return
    }

    quickCreateLoading.value = true
    try {
        const data: CreateProductInput = {
            name: quickCreateForm.name,
            price: quickCreateForm.price,
            category: quickCreateForm.category || undefined,
            status: 'active',
            track_inventory: quickCreateForm.stock_quantity > 0,
            variants: [
                {
                    name: 'Default',
                    keyword: quickCreateForm.keyword,
                    stock_quantity: quickCreateForm.stock_quantity,
                    is_main: true
                }
            ]
        }

        await createProduct(data)

        toast.add({
            title: 'Product Created',
            description: `${quickCreateForm.name} created successfully`,
            icon: 'i-heroicons-check-circle',
            color: 'success'
        })

        resetQuickCreateForm()
        quickCreateOpen.value = false
        loadProducts(true)
    } catch (error) {
        toast.add({
            title: 'Error creating product',
            description: 'Failed to create product',
            color: 'error'
        })
    } finally {
        quickCreateLoading.value = false
    }
}
</script>

<template>
    <div
        class="flex flex-col h-full rounded-lg bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800"
    >
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-lg mb-3">Бараанууд</h3>
            <UInput
                v-model="search"
                icon="i-heroicons-magnifying-glass"
                placeholder="Search products..."
                :ui="{ trailing: 'pe-1' }"
                :loading="loading"
                loading-icon="i-lucide-loader"
            >
                <template v-if="search?.length" #trailing>
                    <UButton
                        color="neutral"
                        variant="link"
                        size="sm"
                        icon="i-lucide-x"
                        aria-label="Clear input"
                        @click="search = ''"
                    />
                </template>
            </UInput>

            <div class="flex items-center gap-2 mt-3">
                <UCheckbox v-model="showOnlyAdded" label="Added only" />
                <USelect
                    v-model="selectedCategory"
                    :items="categoryOptions"
                    value-key="value"
                    placeholder="Ангилал"
                    class="flex-1"
                />
            </div>
        </div>

        <div
            class="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700"
        >
            <div v-if="loading" class="flex justify-center p-8">
                <UIcon name="i-lucide-loader" class="animate-spin text-xl text-gray-400" />
            </div>

            <template v-else>
                <ProductListItem
                    v-for="product in filteredProducts"
                    :key="product.id"
                    :product="product"
                    :is-presenting="activeProductId === product.id"
                    @add="handleAdd"
                    @select="handleSelect"
                />

                <div v-if="filteredProducts.length === 0" class="text-center text-gray-400 py-8">
                    <p>No products found</p>
                </div>

                <div v-if="hasMore && !showOnlyAdded" class="p-2 text-center">
                    <UButton size="xs" variant="ghost" @click="() => loadProducts(false)">
                        Load more
                    </UButton>
                </div>
            </template>
        </div>

        <div class="p-2 border-t border-gray-200 dark:border-gray-800">
            <UButton block icon="i-lucide-plus" @click="quickCreateOpen = true">
                Quick Add Product
            </UButton>
        </div>

        <UModal v-model:open="quickCreateOpen">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold">Quick Add Product</h3>
                            <UButton
                                color="neutral"
                                variant="ghost"
                                icon="i-lucide-x"
                                @click="quickCreateOpen = false"
                            />
                        </div>
                    </template>

                    <div class="space-y-4">
                        <UFormField label="Product Name" required>
                            <UInput v-model="quickCreateForm.name" placeholder="Product name" />
                        </UFormField>

                        <UFormField label="Price" required>
                            <UInput
                                v-model.number="quickCreateForm.price"
                                type="number"
                                placeholder="0"
                            />
                        </UFormField>

                        <UFormField label="Keyword" required>
                            <UInput
                                v-model="quickCreateForm.keyword"
                                placeholder="Comment keyword"
                            />
                        </UFormField>

                        <UFormField label="Category">
                            <USelect
                                v-model="quickCreateForm.category"
                                :items="categories.map((c) => ({ label: c, value: c }))"
                                value-key="value"
                                placeholder="Select category"
                            />
                        </UFormField>

                        <UFormField label="Stock Quantity">
                            <UInput
                                v-model.number="quickCreateForm.stock_quantity"
                                type="number"
                                placeholder="0"
                            />
                        </UFormField>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton
                                color="neutral"
                                variant="outline"
                                @click="quickCreateOpen = false"
                            >
                                Cancel
                            </UButton>
                            <UButton
                                color="primary"
                                :loading="quickCreateLoading"
                                @click="handleQuickCreate"
                            >
                                Create Product
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
