<script setup lang="ts">
import type { Product } from '~/composables/useProducts'

interface Props {
    loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
    (e: 'select', product: Product): void
}>()

const { fetchProducts } = useProducts()
const { formatPrice } = useOrders()

const products = ref<Product[]>([])
const loadingProducts = ref(true)
const searchKeyword = ref('')
const total = ref(0)
const page = ref(1)
const size = 12

const loadProducts = async () => {
    loadingProducts.value = true
    try {
        const res = await fetchProducts({
            keyword: searchKeyword.value,
            status: 'active',
            page: page.value,
            size
        })
        products.value = res.products || []
        total.value = res.total || 0
    } catch (err) {
        console.error('Failed to load products', err)
        products.value = []
    } finally {
        loadingProducts.value = false
    }
}

const hasMorePages = computed(() => {
    return page.value * size < total.value
})

const loadMore = () => {
    if (hasMorePages.value) {
        page.value++
    }
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchKeyword, () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        page.value = 1
        loadProducts()
    }, 300)
})

const getProductImage = (product: Product): string | null => {
    return product.images?.[0] || null
}

const getProductPrice = (product: Product): number => {
    if (product.timed_sale_enabled && product.timed_sale_price) {
        return product.timed_sale_price
    }
    return product.sale_price || product.price || 0
}

const getOriginalPrice = (product: Product): number | null => {
    if (product.timed_sale_enabled && product.timed_sale_price) {
        return product.price
    }
    return product.sale_price ? product.price : null
}

const getTotalStock = (product: Product): number => {
    return product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0
}

const isOutOfStock = (product: Product): boolean => {
    return getTotalStock(product) <= 0
}

const handleSelect = (product: Product) => {
    if (!isOutOfStock(product)) {
        emit('select', product)
    }
}

onMounted(() => {
    loadProducts()
})
</script>

<template>
    <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
    >
        <div class="mb-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Бараа сонгох</h3>
            <UInput
                v-model="searchKeyword"
                placeholder="Бараа хайх..."
                icon="i-lucide-search"
                size="lg"
            />
        </div>

        <!-- Loading State -->
        <div
            v-if="loadingProducts && products.length === 0"
            class="flex items-center justify-center py-12"
        >
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
        </div>

        <!-- Empty State -->
        <div v-else-if="products.length === 0" class="text-center py-12">
            <div
                class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4"
            >
                <UIcon name="i-lucide-package-x" class="w-8 h-8 text-gray-400" />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Бараа олдсонгүй</p>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
                v-for="product in products"
                :key="product.id"
                class="group cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm"
                :class="{
                    'opacity-50 cursor-not-allowed': isOutOfStock(product)
                }"
                @click="handleSelect(product)"
            >
                <!-- Product Image -->
                <div class="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    <img
                        v-if="getProductImage(product)"
                        :src="getProductImage(product)!"
                        :alt="product.name"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    >
                    <div v-else class="w-full h-full flex items-center justify-center">
                        <UIcon
                            name="i-lucide-package"
                            class="w-10 h-10 text-gray-300 dark:text-gray-600"
                        />
                    </div>

                    <!-- Out of Stock Badge -->
                    <div
                        v-if="isOutOfStock(product)"
                        class="absolute inset-0 bg-black/50 flex items-center justify-center"
                    >
                        <span class="text-white text-xs font-medium px-2 py-1 bg-red-500 rounded">
                            Дууссан
                        </span>
                    </div>

                    <!-- Stock Badge -->
                    <div v-else-if="getTotalStock(product) <= 5" class="absolute top-2 right-2">
                        <span
                            class="text-xs font-medium px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded"
                        >
                            {{ getTotalStock(product) }}ш
                        </span>
                    </div>
                </div>

                <!-- Product Info -->
                <div class="p-2">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ product.name }}
                    </p>
                    <div class="flex items-center gap-1 mt-1">
                        <span
                            v-if="getOriginalPrice(product)"
                            class="text-xs text-gray-400 line-through"
                        >
                            {{ formatPrice(getOriginalPrice(product)!) }}
                        </span>
                        <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">
                            {{ formatPrice(getProductPrice(product)) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMorePages" class="mt-4 text-center">
            <UButton color="neutral" variant="outline" :loading="loadingProducts" @click="loadMore">
                Цааш үзэх
            </UButton>
        </div>
    </div>
</template>
