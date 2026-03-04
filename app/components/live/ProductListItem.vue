<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import type { LiveSale, LiveSaleProduct } from '~/types'

const props = defineProps<{
    product: Product
    isPresenting?: boolean
}>()

const emit = defineEmits<{
    (e: 'add', product: Product): void
    (e: 'select', product: Product): void
}>()

const addedProducts = useState<LiveSaleProduct[]>('addedProducts')

const items = computed(() => [
    [
        {
            label: 'Edit Product',
            icon: 'i-heroicons-pencil-square',
            to: `/dashboard/products/${props.product.id}`,
            target: '_blank'
        }
    ],
    [
        {
            label: 'Select on Live',
            icon: 'i-heroicons-cursor-arrow-rays',
            click: () => emit('select', props.product)
        }
    ]
])

const price = computed(() => {
    if (props.product.sale_price) {
        return props.product.sale_price
    }
    return props.product.price ?? 0
})

const formattedPrice = computed(() => {
    return new Intl.NumberFormat('mn-MN', {
        style: 'currency',
        currency: 'MNT'
    }).format(price.value)
})

const isAdded = computed(() => {
    return addedProducts.value.some((p) => p.product_id === props.product.id)
})
</script>

<template>
    <div
        class="group relative flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer border hover:shadow-sm"
        :class="isPresenting ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'"
    >
        <div
            class="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
        >
            <img
                v-if="product.variants?.[0]?.images?.length"
                :src="product.variants[0].images[0]"
                :alt="product.name"
                class="w-full h-full object-cover"
            />
            <ImagePlaceholder v-else :width="48" :height="48" class="h-full w-full" />
        </div>

        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ product.name }}
                </h4>
                <UBadge v-if="isPresenting" color="primary" size="xs" class="shrink-0">
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
                    Live
                </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formattedPrice }}
            </p>
        </div>

        <div
            class="md:opacity-0 md:group-hover:opacity-100 transition-opacity flex justify-center gap-2"
        >
            <UButton
                v-if="isAdded"
                color="success"
                icon="i-lucide-check"
                size="lg"
                class="rounded-lg cursor-pointer"
                @click="emit('select', props.product)"
            />
            <UButton
                v-else
                color="primary"
                icon="i-lucide-plus"
                size="lg"
                class="rounded-lg cursor-pointer"
                @click="emit('add', props.product)"
            />

            <UDropdownMenu :items="items" :popper="{ placement: 'bottom-end' }">
                <UButton
                    color="error"
                    variant="ghost"
                    icon="i-lucide-ellipsis-vertical"
                    size="md"
                />
            </UDropdownMenu>
        </div>
    </div>
</template>
