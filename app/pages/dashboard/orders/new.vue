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
    selectedProduct.value = product
    variantModalOpen.value = true
}

const handleVariantSelect = (items: { variant: ProductVariant; quantity: number }[]) => {
    if (!selectedProduct.value) return

    for (const item of items) {
        const existingIndex = cartItems.value.findIndex(
            (ci) => ci.product.id === selectedProduct.value!.id && ci.variant.id === item.variant.id
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
        variant_id: item.variant.id,
        sku: item.product.keyword || '',
        name: item.product.name,
        options: item.variant.name,
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
        toast.add({ title: 'Амжилттай', description: 'Захиалга үүсгэгдлээ', color: 'success' })
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
        toast.add({ title: 'Амжилттай', description: 'Checkout линк үүсгэгдлээ', color: 'success' })
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
    toast.add({ title: 'Хуулагдлаа', description: 'Линк санах ойд хадгалагдлаа', color: 'success' })
}
</script>

<template>
    <div class="w-full h-full flex flex-col overflow-hidden">
        <UDashboardPanel id="new-order">
            <template #header>
                <UDashboardNavbar>
                    <template #leading>
                        <UButton
                            to="/dashboard/orders"
                            icon="i-lucide-arrow-left"
                            color="neutral"
                            variant="ghost"
                        />
                    </template>

                    <template #title>
                        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Захиалга нэмэх
                        </h1>
                    </template>

                    <template #right>
                        <div class="flex items-center gap-2">
                            <UButton
                                variant="outline"
                                color="neutral"
                                icon="i-lucide-link"
                                size="sm"
                                :loading="checkoutLoading"
                                :disabled="cartItems.length === 0"
                                @click="generateCheckoutLink"
                            >
                                <span class="hidden sm:inline">Checkout линк</span>
                            </UButton>
                            <UButton
                                type="submit"
                                form="order-form"
                                color="primary"
                                icon="i-lucide-check"
                                size="sm"
                                :loading="loading"
                                :disabled="!canSubmit"
                            >
                                <span class="hidden sm:inline">Захиалга үүсгэх</span>
                            </UButton>
                        </div>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UForm id="order-form" :schema="schema" :state="state" @submit="onSubmit">
                    <div class="flex flex-col lg:flex-row h-full">
                        <!-- Left: Product Grid (scrollable) -->
                        <div class="flex-1 overflow-y-auto p-4 lg:p-6">
                            <OrderProductGrid @select="handleProductSelect" />
                        </div>

                        <!-- Right: Sidebar (scrollable independently) -->
                        <div
                            class="w-full lg:w-[400px] xl:w-[440px] lg:border-l border-gray-200 dark:border-gray-800 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50"
                        >
                            <div class="p-4 lg:p-5 space-y-4">
                                <!-- Customer Lookup -->
                                <div
                                    class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                                >
                                    <!-- Phone Input -->
                                    <div class="p-4">
                                        <div class="flex items-center gap-2 mb-3">
                                            <UIcon
                                                name="i-lucide-user-search"
                                                class="w-4 h-4 text-primary"
                                            />
                                            <span
                                                class="text-sm font-medium text-gray-900 dark:text-white"
                                                >Харилцагч</span
                                            >
                                        </div>
                                        <UFormField name="customer_phone">
                                            <UInput
                                                v-model="state.customer_phone"
                                                placeholder="Утасны дугаар оруулна уу..."
                                                size="lg"
                                                icon="i-lucide-phone"
                                                :loading="phoneSearching"
                                            >
                                                <template v-if="foundCustomer" #trailing>
                                                    <UIcon
                                                        name="i-lucide-check-circle-2"
                                                        class="text-primary-500"
                                                    />
                                                </template>
                                            </UInput>
                                        </UFormField>
                                    </div>

                                    <!-- Found Customer Card -->
                                    <div
                                        v-if="foundCustomer && !showCustomerForm"
                                        class="border-t border-gray-100 dark:border-gray-800 bg-primary-50/50 dark:bg-primary-950/20 px-4 py-3"
                                    >
                                        <div class="flex items-start justify-between gap-2">
                                            <div class="min-w-0">
                                                <p
                                                    class="font-medium text-gray-900 dark:text-white text-sm"
                                                >
                                                    {{ foundCustomer.name }}
                                                </p>
                                                <p class="text-xs text-gray-500 mt-0.5 truncate">
                                                    {{ customerSummary }}
                                                </p>
                                                <p
                                                    v-if="foundCustomer.address"
                                                    class="text-xs text-gray-400 mt-0.5 truncate"
                                                >
                                                    {{ foundCustomer.address }}
                                                </p>
                                            </div>
                                            <UButton
                                                icon="i-lucide-pencil"
                                                color="neutral"
                                                variant="ghost"
                                                size="xs"
                                                @click="showCustomerForm = true"
                                            />
                                        </div>
                                    </div>

                                    <!-- Customer Form (shown for new customer or editing) -->
                                    <div
                                        v-if="
                                            showCustomerForm ||
                                            (!foundCustomer &&
                                                state.customer_phone.length >= 8 &&
                                                !phoneSearching)
                                        "
                                        class="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3"
                                    >
                                        <div class="flex items-center justify-between">
                                            <span
                                                class="text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {{
                                                    foundCustomer
                                                        ? 'Мэдээлэл засах'
                                                        : 'Шинэ харилцагч'
                                                }}
                                            </span>
                                            <UButton
                                                v-if="foundCustomer"
                                                size="xs"
                                                color="neutral"
                                                variant="ghost"
                                                @click="showCustomerForm = false"
                                            >
                                                Хаах
                                            </UButton>
                                        </div>

                                        <UFormField label="Нэр" name="customer_name" required>
                                            <UInput
                                                v-model="state.customer_name"
                                                placeholder="Нэр"
                                            />
                                        </UFormField>

                                        <div class="grid grid-cols-2 gap-3">
                                            <UFormField label="Хот/Аймаг" name="customer_city">
                                                <UInput
                                                    v-model="state.customer_city"
                                                    placeholder="УБ"
                                                />
                                            </UFormField>
                                            <UFormField label="Дүүрэг" name="customer_district">
                                                <UInput
                                                    v-model="state.customer_district"
                                                    placeholder="БЗД"
                                                />
                                            </UFormField>
                                        </div>

                                        <UFormField label="Хаяг" name="customer_address">
                                            <UInput
                                                v-model="state.customer_address"
                                                placeholder="Дэлгэрэнгүй хаяг"
                                            />
                                        </UFormField>

                                        <div class="grid grid-cols-2 gap-3">
                                            <UFormField label="Байр/Тоот" name="customer_apartment">
                                                <UInput
                                                    v-model="state.customer_apartment"
                                                    placeholder="45 тоот"
                                                />
                                            </UFormField>
                                            <UFormField label="Имэйл" name="customer_email">
                                                <UInput
                                                    v-model="state.customer_email"
                                                    type="email"
                                                    placeholder="Имэйл"
                                                />
                                            </UFormField>
                                        </div>
                                    </div>
                                </div>

                                <!-- Cart -->
                                <OrderCartCard
                                    :items="cartItems"
                                    :shipping-fee="shippingFee"
                                    :discount="discount"
                                    @remove="removeCartItem"
                                    @update-quantity="updateCartItemQuantity"
                                />

                                <!-- Shipping & Discount (compact) -->
                                <div
                                    class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                                >
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-xs text-gray-500 mb-1 block"
                                                >Хүргэлт</label
                                            >
                                            <UInput
                                                v-model.number="shippingFee"
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                            >
                                                <template #trailing>
                                                    <span class="text-gray-400 text-xs">₮</span>
                                                </template>
                                            </UInput>
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-500 mb-1 block"
                                                >Хөнгөлөлт</label
                                            >
                                            <UInput
                                                v-model.number="discount"
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                            >
                                                <template #trailing>
                                                    <span class="text-gray-400 text-xs">₮</span>
                                                </template>
                                            </UInput>
                                        </div>
                                    </div>
                                </div>

                                <!-- Payment Method (compact radio cards) -->
                                <div
                                    class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                                >
                                    <label class="text-xs text-gray-500 mb-2 block"
                                        >Төлбөрийн арга</label
                                    >
                                    <div class="grid grid-cols-2 gap-2">
                                        <button
                                            v-for="option in paymentMethodOptions"
                                            :key="option.value"
                                            type="button"
                                            class="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all"
                                            :class="
                                                state.payment_method === option.value
                                                    ? 'border-primary bg-primary/5 text-primary dark:border-primary dark:bg-primary/10'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                            "
                                            @click="state.payment_method = option.value"
                                        >
                                            <UIcon :name="option.icon" class="w-4 h-4" />
                                            {{ option.label }}
                                        </button>
                                    </div>
                                </div>

                                <!-- Action Buttons (mobile) -->
                                <div class="lg:hidden space-y-2 pb-4">
                                    <UButton
                                        type="submit"
                                        form="order-form"
                                        color="primary"
                                        :loading="loading"
                                        :disabled="!canSubmit"
                                        block
                                        size="lg"
                                    >
                                        Захиалга үүсгэх · {{ formatPrice(total) }}
                                    </UButton>
                                    <UButton
                                        variant="outline"
                                        color="neutral"
                                        icon="i-lucide-link"
                                        :loading="checkoutLoading"
                                        :disabled="cartItems.length === 0"
                                        block
                                        size="lg"
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
                                        <div
                                            class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
                                        >
                                            <UIcon
                                                name="i-lucide-link-2"
                                                class="w-5 h-5 text-primary-600 dark:text-primary-400"
                                            />
                                        </div>
                                        <div>
                                            <h3 class="text-base font-semibold">
                                                Линк бэлэн боллоо
                                            </h3>
                                            <p class="text-xs text-gray-500">
                                                Хэрэглэгч рүү илгээнэ үү
                                            </p>
                                        </div>
                                    </div>
                                    <UButton
                                        color="neutral"
                                        variant="ghost"
                                        icon="i-lucide-x"
                                        @click="checkoutModalOpen = false"
                                    />
                                </div>
                            </template>

                            <div
                                class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                                <span class="text-sm truncate flex-1 font-mono">{{
                                    checkoutLink
                                }}</span>
                                <UButton
                                    color="primary"
                                    variant="soft"
                                    icon="i-lucide-copy"
                                    size="sm"
                                    @click="copyCheckoutLink"
                                >
                                    Хуулах
                                </UButton>
                            </div>

                            <template #footer>
                                <div class="flex justify-end gap-3">
                                    <UButton
                                        color="neutral"
                                        variant="ghost"
                                        @click="checkoutModalOpen = false"
                                    >
                                        Хаах
                                    </UButton>
                                    <UButton
                                        color="primary"
                                        @click="router.push('/dashboard/orders')"
                                    >
                                        Захиалгын жагсаалт
                                    </UButton>
                                </div>
                            </template>
                        </UCard>
                    </template>
                </UModal>
            </template>
        </UDashboardPanel>
    </div>
</template>
