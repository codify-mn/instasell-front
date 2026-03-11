<script setup lang="ts">
import type { CartItem } from '~/composables/useOrders'

interface Props {
    items: CartItem[]
    shippingFee?: number
    discount?: number
}

const props = withDefaults(defineProps<Props>(), {
    shippingFee: 0,
    discount: 0
})

const emit = defineEmits<{
    (e: 'remove', index: number): void
    (e: 'updateQuantity', index: number, quantity: number): void
}>()

const { formatPrice } = useOrders()

const getEffectivePrice = (item: CartItem): number => {
    if (item.product.timed_sale_enabled && item.product.timed_sale_price) {
        return item.product.timed_sale_price
    }
    return item.product.sale_price || item.product.price || 0
}

const getItemTotal = (item: CartItem): number => {
    return getEffectivePrice(item) * item.quantity
}

const subtotal = computed(() => {
    return props.items.reduce((sum, item) => sum + getItemTotal(item), 0)
})

const total = computed(() => {
    return subtotal.value - props.discount + props.shippingFee
})

const getVariantImage = (item: CartItem): string | null => {
    return item.product.images?.[0] || null
}

const incrementQuantity = (index: number) => {
    const item = props.items[index]
    if (item && item.quantity < item.variant.stock_quantity) {
        emit('updateQuantity', index, item.quantity + 1)
    }
}

const decrementQuantity = (index: number) => {
    const item = props.items[index]
    if (item && item.quantity > 1) {
        emit('updateQuantity', index, item.quantity - 1)
    }
}
</script>

<template>
    <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
    >
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Сонгосон бараа
            <span v-if="items.length > 0" class="text-gray-500">({{ items.length }})</span>
        </h3>

        <!-- Empty State -->
        <div v-if="items.length === 0" class="text-center py-8">
            <div
                class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4"
            >
                <UIcon name="i-lucide-shopping-cart" class="w-8 h-8 text-gray-400" />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Бараа сонгоогүй байна</p>
        </div>

        <!-- Cart Items -->
        <div v-else class="space-y-3">
            <div
                v-for="(item, index) in items"
                :key="`${item.product.id}-${item.variant.id}`"
                class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
                <!-- Item Image -->
                <div
                    class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0"
                >
                    <img
                        v-if="getVariantImage(item)"
                        :src="getVariantImage(item)!"
                        :alt="item.product.name"
                        class="w-full h-full object-cover"
                    >
                    <UIcon v-else name="i-lucide-package" class="w-5 h-5 text-gray-400" />
                </div>

                <!-- Item Info -->
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {{ item.product.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ item.variant.name }}
                    </p>
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center gap-1">
                            <UButton
                                icon="i-lucide-minus"
                                color="neutral"
                                variant="ghost"
                                size="xs"
                                :disabled="item.quantity <= 1"
                                @click="decrementQuantity(index)"
                            />
                            <span class="w-6 text-center text-sm text-gray-900 dark:text-white">
                                {{ item.quantity }}
                            </span>
                            <UButton
                                icon="i-lucide-plus"
                                color="neutral"
                                variant="ghost"
                                size="xs"
                                :disabled="item.quantity >= item.variant.stock_quantity"
                                @click="incrementQuantity(index)"
                            />
                        </div>
                        <span class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ formatPrice(getItemTotal(item)) }}
                        </span>
                    </div>
                </div>

                <!-- Remove Button -->
                <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="emit('remove', index)"
                />
            </div>

            <!-- Price Summary -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-500 dark:text-gray-400">Дүн</span>
                    <span class="text-gray-900 dark:text-white">{{ formatPrice(subtotal) }}</span>
                </div>
                <div v-if="discount > 0" class="flex justify-between text-sm">
                    <span class="text-gray-500 dark:text-gray-400">Хөнгөлөлт</span>
                    <span class="text-primary-600">-{{ formatPrice(discount) }}</span>
                </div>
                <div v-if="shippingFee > 0" class="flex justify-between text-sm">
                    <span class="text-gray-500 dark:text-gray-400">Хүргэлт</span>
                    <span class="text-gray-900 dark:text-white">{{
                        formatPrice(shippingFee)
                    }}</span>
                </div>
                <div
                    class="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700"
                >
                    <span class="text-gray-900 dark:text-white">Нийт дүн</span>
                    <span class="text-primary-600 dark:text-primary-400">{{
                        formatPrice(total)
                    }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
