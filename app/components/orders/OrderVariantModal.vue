<script setup lang="ts">
import type { Product, ProductVariant } from '~/composables/useProducts'

interface Props {
    open: boolean
    product: Product | null
}

interface SelectedVariant {
    variant: ProductVariant
    quantity: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'select', items: SelectedVariant[]): void
}>()

const { formatPrice } = useOrders()

// Track quantities for each variant
const quantities = ref<Record<number, number>>({})

// Reset quantities when product changes
watch(
    () => props.product,
    () => {
        quantities.value = {}
    }
)

const getQuantity = (variantId: number): number => {
    return quantities.value[variantId] || 0
}

const incrementQuantity = (variantId: number) => {
    const variant = props.product?.variants.find((v) => v.id === variantId)
    if (!variant) return

    const current = getQuantity(variantId)
    if (current < variant.stock_quantity) {
        quantities.value[variantId] = current + 1
    }
}

const decrementQuantity = (variantId: number) => {
    const current = getQuantity(variantId)
    if (current > 0) {
        quantities.value[variantId] = current - 1
    }
}

const setQuantity = (variantId: number, value: number) => {
    const variant = props.product?.variants.find((v) => v.id === variantId)
    if (!variant) return

    const num = Math.max(0, Math.min(value, variant.stock_quantity))
    quantities.value[variantId] = num
}

const hasSelectedItems = computed(() => {
    return Object.values(quantities.value).some((q) => q > 0)
})

const selectedCount = computed(() => {
    return Object.values(quantities.value).reduce((sum, q) => sum + q, 0)
})

const handleConfirm = () => {
    if (!props.product) return

    const selected: SelectedVariant[] = []

    for (const [variantIdStr, quantity] of Object.entries(quantities.value)) {
        if (quantity > 0) {
            const variantId = Number(variantIdStr)
            const variant = props.product.variants.find((v) => v.id === variantId)
            if (variant) {
                selected.push({ variant, quantity })
            }
        }
    }

    emit('select', selected)
    emit('update:open', false)
    quantities.value = {}
}

const handleClose = () => {
    emit('update:open', false)
    quantities.value = {}
}

const getVariantImage = (_variant: ProductVariant): string | null => {
    return props.product?.images?.[0] || null
}

const getEffectivePrice = (): number => {
    if (!props.product) return 0
    return props.product.timed_sale_enabled && props.product.timed_sale_price
        ? props.product.timed_sale_price
        : props.product.price || 0
}

const isOutOfStock = (variant: ProductVariant): boolean => {
    return variant.stock_quantity <= 0
}
</script>

<template>
    <UModal :open="open" @update:open="handleClose">
        <template #content>
            <UCard class="w-full max-w-lg">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-[var(--text-heading)]">
                                {{ product?.name }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Төрөл сонгох
                            </p>
                        </div>
                        <UButton
                            icon="i-lucide-x"
                            color="neutral"
                            variant="ghost"
                            size="sm"
                            @click="handleClose"
                        />
                    </div>
                </template>

                <div class="space-y-3 max-h-96 overflow-y-auto">
                    <div
                        v-for="variant in product?.variants"
                        :key="variant.id"
                        class="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                        :class="{
                            'opacity-50': isOutOfStock(variant),
                            'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700':
                                getQuantity(variant.id) > 0
                        }"
                    >
                        <!-- Variant Image -->
                        <div
                            class="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0"
                        >
                            <img
                                v-if="getVariantImage(variant)"
                                :src="getVariantImage(variant)!"
                                :alt="variant.name"
                                class="w-full h-full object-cover"
                            >
                            <UIcon v-else name="i-lucide-package" class="w-6 h-6 text-gray-400" />
                        </div>

                        <!-- Variant Info -->
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-[var(--text-heading)] truncate">
                                {{ variant.name }}
                            </p>
                            <div class="flex items-center gap-2 mt-1">
                                <span
                                    v-if="product?.timed_sale_enabled && product?.timed_sale_price"
                                    class="text-sm text-gray-400 line-through"
                                >
                                    {{ formatPrice(product.price) }}
                                </span>
                                <span
                                    class="text-sm font-medium text-primary-600 dark:text-primary-400"
                                >
                                    {{ formatPrice(getEffectivePrice()) }}
                                </span>
                            </div>
                            <p
                                class="text-xs mt-1"
                                :class="
                                    isOutOfStock(variant)
                                        ? 'text-red-500'
                                        : 'text-gray-500 dark:text-gray-400'
                                "
                            >
                                {{
                                    isOutOfStock(variant)
                                        ? 'Дууссан'
                                        : `${variant.stock_quantity}ш үлдсэн`
                                }}
                            </p>
                        </div>

                        <!-- Quantity Controls -->
                        <div class="flex items-center gap-2 shrink-0">
                            <UButton
                                icon="i-lucide-minus"
                                color="neutral"
                                variant="outline"
                                size="xs"
                                :disabled="getQuantity(variant.id) <= 0"
                                @click="decrementQuantity(variant.id)"
                            />
                            <input
                                type="number"
                                :value="getQuantity(variant.id)"
                                min="0"
                                :max="variant.stock_quantity"
                                :disabled="isOutOfStock(variant)"
                                class="w-12 h-8 text-center text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-[var(--text-heading)]"
                                @input="
                                    setQuantity(
                                        variant.id,
                                        Number(($event.target as HTMLInputElement).value)
                                    )
                                "
                            >
                            <UButton
                                icon="i-lucide-plus"
                                color="neutral"
                                variant="outline"
                                size="xs"
                                :disabled="
                                    isOutOfStock(variant) ||
                                    getQuantity(variant.id) >= variant.stock_quantity
                                "
                                @click="incrementQuantity(variant.id)"
                            />
                        </div>
                    </div>

                    <div v-if="!product?.variants?.length" class="text-center py-8 text-gray-500">
                        Төрөл олдсонгүй
                    </div>
                </div>

                <template #footer>
                    <div class="flex items-center justify-between">
                        <span
                            v-if="hasSelectedItems"
                            class="text-sm text-gray-600 dark:text-gray-400"
                        >
                            {{ selectedCount }} ширхэг сонгогдсон
                        </span>
                        <span v-else />
                        <div class="flex gap-2">
                            <UButton color="neutral" variant="outline" @click="handleClose">
                                Болих
                            </UButton>
                            <UButton
                                color="primary"
                                :disabled="!hasSelectedItems"
                                @click="handleConfirm"
                            >
                                Бараа сонгох
                            </UButton>
                        </div>
                    </div>
                </template>
            </UCard>
        </template>
    </UModal>
</template>
