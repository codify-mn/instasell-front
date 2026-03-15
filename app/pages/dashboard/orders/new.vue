<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Product, ProductVariant } from '~/composables/useProducts'
import type { CartItem, Customer, PaymentMethod } from '~/composables/useOrders'
import { useDebounceFn } from '@vueuse/core'

useSeoMeta({
    title: 'Захиалга нэмэх - Instasell'
})

const { createOrder, formatPrice, searchCustomerByPhone } = useOrders()
const toast = useToast()
const router = useRouter()

const loading = ref(false)
const checkoutLoading = ref(false)
const checkoutModalOpen = ref(false)
const checkoutLink = ref('')

// Phone lookup state
const phoneSearching = ref(false)
const foundCustomer = ref<Customer | null>(null)
const showCustomerForm = ref(false)

// Cart state
const cartItems = ref<CartItem[]>([])
const shippingFee = ref(0)
const discount = ref(0)

// Product selection modal
const variantModalOpen = ref(false)
const selectedProduct = ref<Product | null>(null)

// Form schema
const schema = z.object({
    customer_name: z.string().min(1, 'Нэр оруулна уу'),
    customer_phone: z.string().min(8, 'Утасны дугаар оруулна уу'),
    customer_phone_secondary: z.string().optional(),
    customer_email: z.string().email('Имэйл хаяг буруу байна').optional().or(z.literal('')),
    customer_address: z.string().optional(),
    customer_city: z.string().optional(),
    customer_district: z.string().optional(),
    customer_apartment: z.string().optional(),
    payment_method: z.string().default('cash')
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
    customer_name: '',
    customer_phone: '',
    customer_phone_secondary: '',
    customer_email: '',
    customer_address: '',
    customer_city: '',
    customer_district: '',
    customer_apartment: '',
    payment_method: 'cash'
})

const paymentMethodOptions = [
    { label: 'Бэлнээр', value: 'cash', icon: 'i-lucide-banknote' },
    { label: 'QPay', value: 'qpay', icon: 'i-lucide-qr-code' },
    { label: 'Банк шилжүүлэг', value: 'bank_transfer', icon: 'i-lucide-building-2' },
    { label: 'Карт', value: 'card', icon: 'i-lucide-credit-card' }
]

// Debounced phone lookup
const doPhoneLookup = useDebounceFn(async (phone: string) => {
    if (phone.length < 8) {
        foundCustomer.value = null
        return
    }

    phoneSearching.value = true
    try {
        const customer = await searchCustomerByPhone(phone)
        foundCustomer.value = customer

        if (customer) {
            state.customer_name = customer.name || state.customer_name
            state.customer_email = customer.email || state.customer_email || ''
            state.customer_city = customer.city || state.customer_city || ''
            state.customer_district = customer.district || state.customer_district || ''
            state.customer_address = customer.address || state.customer_address || ''
            state.customer_apartment = customer.apartment || state.customer_apartment || ''
            showCustomerForm.value = false
        } else {
            // New customer - show form immediately
            showCustomerForm.value = true
        }
    } catch {
        // Silently fail
    } finally {
        phoneSearching.value = false
    }
}, 500)

// Watch phone input
watch(
    () => state.customer_phone,
    (newPhone) => {
        if (foundCustomer.value && newPhone !== foundCustomer.value.phone_number) {
            foundCustomer.value = null
        }
        const digits = newPhone.replace(/\D/g, '')
        if (digits.length >= 8) {
            doPhoneLookup(digits)
        }
    }
)

// Product/Cart handlers
const handleProductSelect = (product: Product) => {
    if (!product.variants?.length) {
        const existing = cartItems.value.findIndex((ci) => ci.product.id === product.id && !ci.variant)
        if (existing >= 0) {
            cartItems.value[existing]!.quantity += 1
        } else {
            cartItems.value.push({ product, quantity: 1 })
        }
        return
    }
    selectedProduct.value = product
    variantModalOpen.value = true
}

const handleVariantSelect = (items: { variant: ProductVariant; quantity: number }[]) => {
    if (!selectedProduct.value) return

    for (const item of items) {
        const existingIndex = cartItems.value.findIndex(
            (ci) => ci.product.id === selectedProduct.value!.id && ci.variant?.id === item.variant.id
        )

        if (existingIndex >= 0) {
            const existingItem = cartItems.value[existingIndex]
            if (existingItem) {
                existingItem.quantity += item.quantity
            }
        } else {
            cartItems.value.push({
                product: selectedProduct.value,
                variant: item.variant,
                quantity: item.quantity
            })
        }
    }

    selectedProduct.value = null
}

const removeCartItem = (index: number) => {
    cartItems.value.splice(index, 1)
}

const updateCartItemQuantity = (index: number, quantity: number) => {
    if (cartItems.value[index]) {
        cartItems.value[index].quantity = quantity
    }
}

// Totals
const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => {
        const price =
            item.product.timed_sale_enabled && item.product.timed_sale_price
                ? item.product.timed_sale_price
                : item.product.price || 0
        return sum + price * item.quantity
    }, 0)
})

const total = computed(() => {
    return subtotal.value - discount.value + shippingFee.value
})

const canSubmit = computed(() => {
    return cartItems.value.length > 0 && state.customer_name && state.customer_phone
})

// Customer summary text
const customerSummary = computed(() => {
    if (!foundCustomer.value) return ''
    const parts = [foundCustomer.value.name]
    if (foundCustomer.value.city) parts.push(foundCustomer.value.city)
    if (foundCustomer.value.district) parts.push(foundCustomer.value.district)
    return parts.join(' · ')
})

const buildOrderItems = () => {
    return cartItems.value.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant?.id,
        sku: item.product.keyword || '',
        name: item.product.name,
        options: item.variant?.name ?? '',
        price:
            item.product.timed_sale_enabled && item.product.timed_sale_price
                ? item.product.timed_sale_price
                : item.product.price || 0,
        quantity: item.quantity
    }))
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
    if (cartItems.value.length === 0) {
        toast.add({ title: 'Алдаа', description: 'Бараа сонгоно уу', color: 'error' })
        return
    }

    loading.value = true
    try {
        const orderData = {
            customer_id: foundCustomer.value?.id || undefined,
            customer_name: event.data.customer_name,
            customer_phone: event.data.customer_phone,
            customer_email: event.data.customer_email || undefined,
            customer_address: event.data.customer_address || undefined,
            customer_city: event.data.customer_city || undefined,
            customer_district: event.data.customer_district || undefined,
            customer_apartment: event.data.customer_apartment || undefined,
            items: buildOrderItems(),
            shipping_fee: shippingFee.value,
            discount: discount.value,
            payment_method: event.data.payment_method as PaymentMethod,
            metadata: { source: 'manual' }
        }

        const order = await createOrder(orderData)
        toast.add({ title: 'Амжилттай', description: 'Захиалга үүсгэгдлээ', color: 'primary' })
        router.push(`/dashboard/orders/${order.id}`)
    } finally {
        loading.value = false
    }
}

const generateCheckoutLink = async () => {
    if (cartItems.value.length === 0) {
        toast.add({ title: 'Алдаа', description: 'Бараа сонгоно уу', color: 'error' })
        return
    }

    checkoutLoading.value = true
    try {
        const orderData = {
            customer_id: foundCustomer.value?.id || undefined,
            customer_name: state.customer_name || 'Шинэ хэрэглэгч',
            customer_phone: state.customer_phone || '00000000',
            customer_email: state.customer_email || undefined,
            customer_address: state.customer_address || undefined,
            customer_city: state.customer_city || undefined,
            customer_district: state.customer_district || undefined,
            customer_apartment: state.customer_apartment || undefined,
            items: buildOrderItems(),
            shipping_fee: shippingFee.value,
            discount: discount.value,
            payment_method: state.payment_method as PaymentMethod,
            metadata: { source: 'checkout_link' }
        }

        const order = await createOrder(orderData)
        const host = window.location.origin
        checkoutLink.value = `${host}/checkout/${order.checkout_token}`
        checkoutModalOpen.value = true
        toast.add({ title: 'Амжилттай', description: 'Checkout линк үүсгэгдлээ', color: 'primary' })
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Линк үүсгэхэд алдаа гарлаа',
            color: 'error'
        })
    } finally {
        checkoutLoading.value = false
    }
}

const copyCheckoutLink = () => {
    navigator.clipboard.writeText(checkoutLink.value)
    toast.add({ title: 'Хуулагдлаа', description: 'Линк санах ойд хадгалагдлаа', color: 'primary' })
}
</script>

<template>
    <div class="w-full h-full flex flex-col overflow-hidden">
        <UDashboardPanel id="new-order">
            <template #header>
                <UDashboardNavbar class="border-b border-[var(--border-primary)]">
                    <template #leading>
                        <div class="flex items-center gap-3">
                            <UButton
                                to="/dashboard/orders"
                                icon="i-lucide-arrow-left"
                                color="neutral"
                                variant="ghost"
                                size="sm"
                            />
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Захиалга</p>
                                <h1 class="text-sm font-semibold text-[var(--text-heading)] leading-tight">Шинэ захиалга</h1>
                            </div>
                        </div>
                    </template>
                    <template #right>
                        <div class="flex items-center gap-2">
                            <UButton
                                variant="ghost"
                                color="neutral"
                                size="sm"
                                :loading="checkoutLoading"
                                :disabled="cartItems.length === 0"
                                @click="generateCheckoutLink"
                            >
                                Checkout линк
                            </UButton>
                            <UButton
                                type="submit"
                                form="order-form"
                                color="primary"
                                size="sm"
                                :loading="loading"
                                :disabled="!canSubmit"
                            >
                                Захиалга үүсгэх
                            </UButton>
                        </div>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UForm id="order-form" :schema="schema" :state="state" @submit="onSubmit">
                    <div class="flex flex-col lg:flex-row h-full">

                        <!-- Left: Products -->
                        <div class="flex-1 overflow-y-auto p-5 lg:p-7 space-y-2">
                            <div class="flex items-center justify-between mb-1">
                                <h2 class="text-sm font-semibold text-[var(--text-heading)]">Бараа</h2>
                                <span v-if="cartItems.length" class="text-xs text-primary font-medium">{{ cartItems.length }} нэмэгдсэн</span>
                            </div>
                            <OrderProductGrid @select="handleProductSelect" />
                        </div>

                        <!-- Right: Sidebar -->
                        <div class="w-full lg:w-[380px] xl:w-[400px] shrink-0 lg:border-l border-[var(--border-primary)] overflow-y-auto">
                            <div class="divide-y divide-gray-200 dark:divide-gray-800">

                                <!-- Customer -->
                                <div class="p-5">
                                    <h2 class="text-sm font-semibold text-[var(--text-heading)] mb-4">Харилцагч</h2>
                                    <UFormField name="customer_phone">
                                        <UInput
                                            v-model="state.customer_phone"
                                            placeholder="Утасны дугаар..."
                                            icon="i-lucide-phone"
                                            :loading="phoneSearching"
                                        >
                                            <template v-if="foundCustomer" #trailing>
                                                <UIcon name="i-lucide-check-circle-2" class="text-primary-500 w-4 h-4" />
                                            </template>
                                        </UInput>
                                    </UFormField>

                                    <!-- Found customer -->
                                    <div v-if="foundCustomer && !showCustomerForm" class="mt-3 flex items-start justify-between gap-2 p-3 rounded-lg bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900">
                                        <div class="min-w-0">
                                            <p class="text-sm font-medium text-[var(--text-heading)]">{{ foundCustomer.name }}</p>
                                            <p class="text-xs text-gray-500 mt-0.5 truncate">{{ customerSummary }}</p>
                                        </div>
                                        <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="showCustomerForm = true" />
                                    </div>

                                    <!-- New / edit form -->
                                    <div
                                        v-if="showCustomerForm || (!foundCustomer && state.customer_phone.length >= 8 && !phoneSearching)"
                                        class="mt-4 space-y-3"
                                    >
                                        <div class="flex items-center justify-between">
                                            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {{ foundCustomer ? 'Мэдээлэл засах' : 'Шинэ харилцагч' }}
                                            </p>
                                            <UButton v-if="foundCustomer" size="xs" color="neutral" variant="ghost" @click="showCustomerForm = false">Хаах</UButton>
                                        </div>

                                        <UFormField label="Нэр" name="customer_name" required>
                                            <UInput v-model="state.customer_name" placeholder="Нэр" />
                                        </UFormField>

                                        <div class="grid grid-cols-2 gap-2">
                                            <UFormField label="Хот/Аймаг" name="customer_city">
                                                <UInput v-model="state.customer_city" placeholder="УБ" />
                                            </UFormField>
                                            <UFormField label="Дүүрэг" name="customer_district">
                                                <UInput v-model="state.customer_district" placeholder="БЗД" />
                                            </UFormField>
                                        </div>

                                        <UFormField label="Хаяг" name="customer_address">
                                            <UInput v-model="state.customer_address" placeholder="Дэлгэрэнгүй хаяг" />
                                        </UFormField>

                                        <div class="grid grid-cols-2 gap-2">
                                            <UFormField label="Байр/Тоот" name="customer_apartment">
                                                <UInput v-model="state.customer_apartment" placeholder="45 тоот" />
                                            </UFormField>
                                            <UFormField label="Имэйл" name="customer_email">
                                                <UInput v-model="state.customer_email" type="email" placeholder="Имэйл" />
                                            </UFormField>
                                        </div>
                                    </div>
                                </div>

                                <!-- Cart -->
                                <div class="p-5">
                                    <h2 class="text-sm font-semibold text-[var(--text-heading)] mb-4">Захиалга</h2>
                                    <OrderCartCard
                                        :items="cartItems"
                                        :shipping-fee="shippingFee"
                                        :discount="discount"
                                        @remove="removeCartItem"
                                        @update-quantity="updateCartItemQuantity"
                                    />
                                </div>

                                <!-- Shipping & Discount -->
                                <div class="p-5">
                                    <h2 class="text-sm font-semibold text-[var(--text-heading)] mb-4">Нэмэлт</h2>
                                    <div class="grid grid-cols-2 gap-3">
                                        <UFormField label="Хүргэлтийн төлбөр">
                                            <UInput v-model.number="shippingFee" type="number" min="0" placeholder="0">
                                                <template #trailing><span class="text-gray-400 text-xs">₮</span></template>
                                            </UInput>
                                        </UFormField>
                                        <UFormField label="Хөнгөлөлт">
                                            <UInput v-model.number="discount" type="number" min="0" placeholder="0">
                                                <template #trailing><span class="text-gray-400 text-xs">₮</span></template>
                                            </UInput>
                                        </UFormField>
                                    </div>
                                </div>

                                <!-- Payment Method -->
                                <div class="p-5">
                                    <h2 class="text-sm font-semibold text-[var(--text-heading)] mb-4">Төлбөрийн арга</h2>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button
                                            v-for="option in paymentMethodOptions"
                                            :key="option.value"
                                            type="button"
                                            class="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all"
                                            :class="state.payment_method === option.value
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-medium'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'"
                                            @click="state.payment_method = option.value"
                                        >
                                            <UIcon :name="option.icon" class="w-4 h-4 shrink-0" />
                                            {{ option.label }}
                                        </button>
                                    </div>
                                </div>

                                <!-- Submit (sidebar bottom) -->
                                <div class="p-5 space-y-2">
                                    <UButton
                                        type="submit"
                                        form="order-form"
                                        color="primary"
                                        :loading="loading"
                                        :disabled="!canSubmit"
                                        block
                                    >
                                        Захиалга үүсгэх
                                        <span v-if="total > 0" class="opacity-70 ml-1">· {{ formatPrice(total) }}</span>
                                    </UButton>
                                    <UButton
                                        variant="ghost"
                                        color="neutral"
                                        icon="i-lucide-link"
                                        :loading="checkoutLoading"
                                        :disabled="cartItems.length === 0"
                                        block
                                        @click="generateCheckoutLink"
                                    >
                                        Checkout линк үүсгэх
                                    </UButton>
                                </div>

                            </div>
                        </div>
                    </div>
                </UForm>

                <!-- Variant Selection Modal -->
                <OrderVariantModal
                    v-model:open="variantModalOpen"
                    :product="selectedProduct"
                    @select="handleVariantSelect"
                />

                <!-- Checkout Link Modal -->
                <UModal v-model:open="checkoutModalOpen">
                    <template #content>
                        <UCard>
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                            <UIcon name="i-lucide-link-2" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div>
                                            <h3 class="text-sm font-semibold">Линк бэлэн боллоо</h3>
                                            <p class="text-xs text-gray-500">Хэрэглэгч рүү илгээнэ үү</p>
                                        </div>
                                    </div>
                                    <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" @click="checkoutModalOpen = false" />
                                </div>
                            </template>

                            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <span class="text-sm truncate flex-1 font-mono text-gray-700 dark:text-gray-300">{{ checkoutLink }}</span>
                                <UButton color="primary" variant="soft" icon="i-lucide-copy" size="sm" @click="copyCheckoutLink">Хуулах</UButton>
                            </div>

                            <template #footer>
                                <div class="flex justify-end gap-2">
                                    <UButton color="neutral" variant="ghost" @click="checkoutModalOpen = false">Хаах</UButton>
                                    <UButton color="primary" @click="router.push('/dashboard/orders')">Захиалгын жагсаалт</UButton>
                                </div>
                            </template>
                        </UCard>
                    </template>
                </UModal>
            </template>
        </UDashboardPanel>
    </div>
</template>
