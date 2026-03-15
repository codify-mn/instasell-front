<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Order, PaymentMethod, OrderQPayData } from '~/composables/useOrders'
import type { Product, ProductVariant } from '~/composables/useProducts'

definePageMeta({
    layout: 'auth'
})

const route = useRoute()
const {
    fetchPublicOrder,
    completePublicCheckout,
    fetchUpsellProducts,
    checkPaymentStatus,
    formatPrice
} = useOrders()

const token = route.params.token as string
const order = ref<Order | null>(null)
const loading = ref(true)
const submitting = ref(false)
const completed = ref(false)

// Payment state
const showPayment = ref(false)
const qpayData = ref<OrderQPayData | null>(null)
const isPaid = ref(false)
const paymentPollInterval = ref<ReturnType<typeof setInterval>>()

// Mobile order summary toggle
const showMobileItems = ref(false)

// Upsell state
const upsellProducts = ref<Product[]>([])
const upsellCart = ref<{ product: Product; variant?: ProductVariant; quantity: number }[]>([])

const schema = z.object({
    name: z.string().min(1, 'Нэр оруулна уу'),
    phone_number: z.string().min(8, 'Утасны дугаар оруулна уу'),
    email: z.string().email('Имэйл хаяг буруу байна').optional().or(z.literal('')),
    city: z.string().min(1, 'Хот/Аймаг оруулна уу'),
    district: z.string().min(1, 'Дүүрэг/Сум оруулна уу'),
    address: z.string().min(1, 'Дэлгэрэнгүй хаяг оруулна уу'),
    apartment: z.string().optional(),
    description: z.string().optional(),
    payment_method: z.string().min(1, 'Төлбөрийн арга сонгоно уу')
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
    name: '',
    phone_number: '',
    email: '',
    city: '',
    district: '',
    address: '',
    apartment: '',
    description: '',
    payment_method: ''
})

const paymentMethodOptions = computed(() => {
    const paymentMethods = order.value?.shop?.settings?.payment_methods
    if (!paymentMethods) return []

    const options = [
        { label: 'QPay', value: 'qpay', icon: 'i-lucide-qr-code', desc: 'QR кодоор төлөх' }
    ]

    return options.filter((opt) => paymentMethods.includes(opt.value))
})

// Upsell computations
const upsellTotal = computed(() => {
    return upsellCart.value.reduce((sum, item) => {
        const price = getEffectivePrice(item.product)
        return sum + price * item.quantity
    }, 0)
})

const grandTotal = computed(() => {
    if (!order.value) return 0
    return order.value.total_amount + upsellTotal.value
})

const itemCount = computed(() => {
    const orderItems = order.value?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    const upsellItems = upsellCart.value.reduce((sum, item) => sum + item.quantity, 0)
    return orderItems + upsellItems
})

function getEffectivePrice(product: Product): number {
    return product.timed_sale_enabled && product.timed_sale_price
        ? product.timed_sale_price
        : product.price || 0
}

function addUpsellItem(product: Product) {
    const existing = upsellCart.value.find((item) => item.product.id === product.id)
    if (existing) {
        existing.quantity++
        return
    }

    const variant = product.variants?.find((v) => v.stock_quantity > 0) || undefined

    upsellCart.value.push({
        product,
        variant,
        quantity: 1
    })
}

function removeUpsellItem(productId: number) {
    upsellCart.value = upsellCart.value.filter((item) => item.product.id !== productId)
}

function isInUpsellCart(productId: number): boolean {
    return upsellCart.value.some((item) => item.product.id === productId)
}

onMounted(async () => {
    try {
        const fetchedOrder = await fetchPublicOrder(token)
        order.value = fetchedOrder

        if (fetchedOrder?.customer) {
            state.name = fetchedOrder.customer.name || ''
            state.phone_number = fetchedOrder.customer.phone_number || ''
            state.email = fetchedOrder.customer.email || ''
            state.city = fetchedOrder.customer.city || ''
            state.district = fetchedOrder.customer.district || ''
            state.address = fetchedOrder.customer.address || ''
            state.apartment = fetchedOrder.customer.apartment || ''
            state.description = fetchedOrder.customer.description || ''
        }

        // Auto-select first payment method
        const firstOption = paymentMethodOptions.value[0]
        if (firstOption) {
            state.payment_method = firstOption.value
        }

        // Fetch upsell products
        try {
            upsellProducts.value = await fetchUpsellProducts(token)
        } catch {
            // Non-critical
        }
    } catch (err) {
        console.error('Failed to fetch order:', err)
    } finally {
        loading.value = false
    }
})

const startPaymentPolling = () => {
    paymentPollInterval.value = setInterval(async () => {
        try {
            const status = await checkPaymentStatus(token)
            if (status.status === 'paid') {
                isPaid.value = true
                if (paymentPollInterval.value) clearInterval(paymentPollInterval.value)
                // Show success after a brief delay
                setTimeout(() => {
                    showPayment.value = false
                    completed.value = true
                }, 2000)
            }
            if (status.qpay) {
                qpayData.value = status.qpay
            }
        } catch {
            // Silently retry
        }
    }, 3000)
}

onUnmounted(() => {
    if (paymentPollInterval.value) clearInterval(paymentPollInterval.value)
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
    submitting.value = true
    try {
        const submitData: Record<string, any> = { ...event.data }

        if (upsellCart.value.length > 0) {
            submitData.upsell_items = upsellCart.value.map((item) => ({
                product_id: item.product.id,
                variant_id: item.variant?.id || undefined,
                quantity: item.quantity
            }))
        }

        const result = await completePublicCheckout(token, submitData)

        // If QPay data returned, show payment UI
        if (result.qpay) {
            qpayData.value = result.qpay
            order.value = result.order
            showPayment.value = true
            startPaymentPolling()
        } else {
            completed.value = true
        }
    } catch (err) {
        console.error('Failed to complete checkout:', err)
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-black">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center min-h-screen">
            <div
                class="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4"
            />
            <p class="text-gray-500 text-sm">Уншиж байна...</p>
        </div>

        <!-- Not Found -->
        <div v-else-if="!order" class="flex flex-col items-center justify-center min-h-screen px-4">
            <div
                class="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-6"
            >
                <UIcon name="i-lucide-search-x" class="w-10 h-10 text-red-400" />
            </div>
            <h2 class="text-xl font-bold text-[var(--text-heading)] mb-2">Захиалга олдсонгүй</h2>
            <p class="text-gray-500 text-center max-w-sm">
                Линкийн хугацаа дууссан эсвэл буруу байж магадгүй. Дэлгүүрээс шинэ линк авна уу.
            </p>
        </div>

        <!-- Payment -->
        <div v-else-if="showPayment && qpayData" class="flex items-center justify-center min-h-screen px-4">
            <div class="max-w-md w-full">
                <div
                    class="bg-[var(--surface-card)] rounded-2xl shadow-lg border border-[var(--border-primary)] p-6 sm:p-8"
                >
                    <CheckoutPayment
                        :qpay-data="qpayData"
                        :order-number="order?.order_number || ''"
                        :total-amount="order?.total_amount || 0"
                        :is-paid="isPaid"
                    />
                </div>
            </div>
        </div>

        <!-- Success -->
        <div v-else-if="completed" class="flex items-center justify-center min-h-screen px-4">
            <div class="max-w-md w-full text-center">
                <div
                    class="bg-[var(--surface-card)] rounded-2xl shadow-lg border border-[var(--border-primary)] p-8 sm:p-10"
                >
                    <div
                        class="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-6"
                    >
                        <UIcon name="i-lucide-check" class="w-10 h-10 text-primary-500" />
                    </div>
                    <h2 class="text-2xl sm:text-3xl font-bold text-[var(--text-heading)] mb-3">
                        Баярлалаа!
                    </h2>
                    <p class="text-gray-500 mb-8 leading-relaxed">
                        Таны захиалга амжилттай баталгаажлаа. Бид тантай удахгүй холбогдох болно.
                    </p>
                    <div
                        class="inline-flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                        <UIcon name="i-lucide-hash" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm text-gray-500">Захиалгын дугаар</span>
                        <span class="font-mono font-bold text-[var(--text-heading)]">{{
                            order.order_number
                        }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Checkout Form -->
        <div v-else>
            <!-- Shop Header -->
            <div class="bg-[var(--surface-card)] border-b border-[var(--border-primary)]">
                <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <UAvatar :src="order.shop?.picture" :alt="order.shop?.name" size="lg" />
                            <div>
                                <h1 class="text-lg font-bold text-[var(--text-heading)]">
                                    {{ order.shop?.name }}
                                </h1>
                                <p class="text-xs text-gray-500">Захиалга баталгаажуулах</p>
                            </div>
                        </div>
                        <div class="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                            <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5" />
                            Аюулгүй холболт
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Order Summary Bar -->
            <div
                class="lg:hidden bg-[var(--surface-card)] border-b border-[var(--border-primary)]"
            >
                <button
                    class="w-full px-4 py-3 flex items-center justify-between"
                    @click="showMobileItems = !showMobileItems"
                >
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-shopping-bag" class="w-4 h-4 text-primary" />
                        <span class="text-sm font-medium text-[var(--text-heading)]">
                            {{ itemCount }} бараа
                        </span>
                        <UIcon
                            name="i-lucide-chevron-down"
                            class="w-4 h-4 text-gray-400 transition-transform"
                            :class="showMobileItems ? 'rotate-180' : ''"
                        />
                    </div>
                    <span class="text-sm font-bold text-[var(--text-heading)]">
                        {{ formatPrice(grandTotal) }}
                    </span>
                </button>
                <div
                    v-if="showMobileItems"
                    class="px-4 pb-4 border-t border-[var(--border-primary)] pt-3 space-y-2"
                >
                    <div
                        v-for="item in order.items"
                        :key="item.id"
                        class="flex justify-between text-sm"
                    >
                        <span class="text-gray-600 dark:text-gray-400 truncate mr-2">
                            {{ item.quantity }}x {{ item.name }}
                        </span>
                        <span class="text-[var(--text-heading)] shrink-0">{{
                            formatPrice(item.subtotal)
                        }}</span>
                    </div>
                    <div
                        v-for="item in upsellCart"
                        :key="'u-' + item.product.id"
                        class="flex justify-between text-sm"
                    >
                        <span class="text-primary truncate mr-2">
                            + {{ item.quantity }}x {{ item.product.name }}
                        </span>
                        <span class="text-[var(--text-heading)] shrink-0">{{
                            formatPrice(getEffectivePrice(item.product) * item.quantity)
                        }}</span>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div class="flex flex-col-reverse lg:flex-row gap-8">
                    <!-- Left: Form -->
                    <div class="flex-1 min-w-0">
                        <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
                            <!-- Section 1: Contact -->
                            <section
                                class="bg-[var(--surface-card)] rounded-2xl p-5 sm:p-6 shadow-sm border border-[var(--border-primary)]"
                            >
                                <div class="flex items-center gap-3 mb-5">
                                    <div
                                        class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
                                    >
                                        1
                                    </div>
                                    <h3 class="font-semibold text-[var(--text-heading)]">
                                        Холбоо барих
                                    </h3>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <UFormField label="Нэр" name="name" required>
                                        <UInput
                                            v-model="state.name"
                                            placeholder="Таны нэр"
                                            size="lg"
                                        />
                                    </UFormField>
                                    <UFormField label="Утас" name="phone_number" required>
                                        <UInput
                                            v-model="state.phone_number"
                                            placeholder="99001122"
                                            size="lg"
                                        />
                                    </UFormField>
                                    <UFormField
                                        label="Имэйл (заавал биш)"
                                        name="email"
                                        class="sm:col-span-2"
                                    >
                                        <UInput
                                            v-model="state.email"
                                            type="email"
                                            placeholder="example@mail.com"
                                            size="lg"
                                        />
                                    </UFormField>
                                </div>
                            </section>

                            <!-- Section 2: Delivery -->
                            <section
                                class="bg-[var(--surface-card)] rounded-2xl p-5 sm:p-6 shadow-sm border border-[var(--border-primary)]"
                            >
                                <div class="flex items-center gap-3 mb-5">
                                    <div
                                        class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
                                    >
                                        2
                                    </div>
                                    <h3 class="font-semibold text-[var(--text-heading)]">
                                        Хүргэлтийн хаяг
                                    </h3>
                                </div>

                                <!-- Delivery note -->
                                <div
                                    v-if="order.shop?.settings?.delivery_note"
                                    class="flex gap-2 p-3 mb-5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30"
                                >
                                    <UIcon
                                        name="i-lucide-info"
                                        class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                                    />
                                    <p
                                        class="text-sm text-amber-700 dark:text-amber-400 leading-relaxed"
                                    >
                                        {{ order.shop.settings.delivery_note }}
                                    </p>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <UFormField label="Хот/Аймаг" name="city" required>
                                        <UInput
                                            v-model="state.city"
                                            placeholder="Улаанбаатар"
                                            size="lg"
                                        />
                                    </UFormField>
                                    <UFormField label="Дүүрэг/Сум" name="district" required>
                                        <UInput
                                            v-model="state.district"
                                            placeholder="Баянзүрх"
                                            size="lg"
                                        />
                                    </UFormField>
                                    <UFormField
                                        label="Дэлгэрэнгүй хаяг"
                                        name="address"
                                        required
                                        class="sm:col-span-2"
                                    >
                                        <UInput
                                            v-model="state.address"
                                            placeholder="Хороо, гудамж, байшин"
                                            size="lg"
                                        />
                                    </UFormField>
                                    <UFormField label="Байр/Тоот" name="apartment">
                                        <UInput
                                            v-model="state.apartment"
                                            placeholder="12-р байр, 45 тоот"
                                            size="lg"
                                        />
                                    </UFormField>
                                    <UFormField label="Тэмдэглэл" name="description">
                                        <UInput
                                            v-model="state.description"
                                            placeholder="Нэмэлт мэдээлэл..."
                                            size="lg"
                                        />
                                    </UFormField>
                                </div>
                            </section>

                            <!-- Section 3: Payment -->
                            <section
                                v-if="paymentMethodOptions.length > 0"
                                class="bg-[var(--surface-card)] rounded-2xl p-5 sm:p-6 shadow-sm border border-[var(--border-primary)]"
                            >
                                <div class="flex items-center gap-3 mb-5">
                                    <div
                                        class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
                                    >
                                        3
                                    </div>
                                    <h3 class="font-semibold text-[var(--text-heading)]">
                                        Төлбөрийн арга
                                    </h3>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        v-for="option in paymentMethodOptions"
                                        :key="option.value"
                                        type="button"
                                        class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left"
                                        :class="
                                            state.payment_method === option.value
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        "
                                        @click="state.payment_method = option.value"
                                    >
                                        <div
                                            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                            :class="
                                                state.payment_method === option.value
                                                    ? 'bg-primary/10'
                                                    : 'bg-gray-100 dark:bg-gray-800'
                                            "
                                        >
                                            <UIcon
                                                :name="option.icon"
                                                class="w-5 h-5"
                                                :class="
                                                    state.payment_method === option.value
                                                        ? 'text-primary'
                                                        : 'text-gray-500'
                                                "
                                            />
                                        </div>
                                        <div>
                                            <p
                                                class="font-medium text-sm"
                                                :class="
                                                    state.payment_method === option.value
                                                        ? 'text-primary'
                                                        : 'text-[var(--text-heading)]'
                                                "
                                            >
                                                {{ option.label }}
                                            </p>
                                            <p class="text-xs text-gray-500">
                                                {{ option.desc }}
                                            </p>
                                        </div>
                                        <div
                                            v-if="state.payment_method === option.value"
                                            class="ml-auto"
                                        >
                                            <UIcon
                                                name="i-lucide-check-circle-2"
                                                class="w-5 h-5 text-primary"
                                            />
                                        </div>
                                    </button>
                                </div>
                            </section>

                            <!-- Submit Button -->
                            <UButton
                                type="submit"
                                color="primary"
                                size="xl"
                                block
                                :loading="submitting"
                                class="rounded-xl h-14 text-base font-bold shadow-lg shadow-primary/20"
                            >
                                <UIcon name="i-lucide-lock" class="w-4 h-4 mr-1" />
                                Захиалга баталгаажуулах · {{ formatPrice(grandTotal) }}
                            </UButton>

                            <p class="text-center text-xs text-gray-400">
                                Баталгаажуулснаар та үйлчилгээний нөхцлийг зөвшөөрч байна
                            </p>
                        </UForm>

                        <!-- Featured Products Section (below checkout) -->
                        <section
                            v-if="upsellProducts.length > 0"
                            class="mt-8 bg-[var(--surface-card)] rounded-2xl p-5 sm:p-6 shadow-sm border border-[var(--border-primary)]"
                        >
                            <div class="flex items-center gap-3 mb-2">
                                <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-amber-500" />
                                <h3 class="font-semibold text-[var(--text-heading)]">
                                    Танд санал болгох
                                </h3>
                            </div>
                            <p class="text-sm text-gray-500 mb-5">
                                Захиалгадаа нэмэлт бараа нэмэх бол сонгоно уу
                            </p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div
                                    v-for="product in upsellProducts"
                                    :key="product.id"
                                    class="flex items-center gap-3 p-3 rounded-xl border transition-all"
                                    :class="
                                        isInUpsellCart(product.id)
                                            ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                                            : 'border-gray-200 dark:border-gray-700'
                                    "
                                >
                                    <div
                                        class="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0"
                                    >
                                        <img
                                            v-if="product.images?.[0]"
                                            :src="product.images[0]"
                                            :alt="product.name"
                                            class="w-full h-full object-cover"
                                        >
                                        <div
                                            v-else
                                            class="w-full h-full flex items-center justify-center"
                                        >
                                            <UIcon
                                                name="i-lucide-package"
                                                class="w-6 h-6 text-gray-400"
                                            />
                                        </div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p
                                            class="text-sm font-medium text-[var(--text-heading)] truncate"
                                        >
                                            {{ product.name }}
                                        </p>
                                        <p class="text-sm font-bold text-primary mt-0.5">
                                            {{ formatPrice(getEffectivePrice(product)) }}
                                        </p>
                                    </div>
                                    <UButton
                                        v-if="!isInUpsellCart(product.id)"
                                        size="sm"
                                        color="primary"
                                        variant="soft"
                                        icon="i-lucide-plus"
                                        @click="addUpsellItem(product)"
                                    >
                                        Нэмэх
                                    </UButton>
                                    <UButton
                                        v-else
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        icon="i-lucide-trash-2"
                                        @click="removeUpsellItem(product.id)"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <!-- Right: Order Summary (desktop sticky) -->
                    <div class="hidden lg:block w-[340px] xl:w-[380px] shrink-0">
                        <div class="sticky top-8 space-y-5">
                            <div
                                class="bg-[var(--surface-card)] rounded-2xl p-5 shadow-sm border border-[var(--border-primary)]"
                            >
                                <h3
                                    class="font-semibold text-[var(--text-heading)] mb-4 flex items-center gap-2"
                                >
                                    <UIcon
                                        name="i-lucide-shopping-bag"
                                        class="w-4 h-4 text-primary"
                                    />
                                    Захиалга
                                </h3>

                                <!-- Order Items -->
                                <div class="space-y-3 mb-4">
                                    <div
                                        v-for="item in order.items"
                                        :key="item.id"
                                        class="flex gap-3"
                                    >
                                        <div
                                            class="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5"
                                        >
                                            <span class="text-xs font-medium text-gray-500">{{
                                                item.quantity
                                            }}</span>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p
                                                class="text-sm text-[var(--text-heading)] truncate"
                                            >
                                                {{ item.name }}
                                            </p>
                                            <p v-if="item.options" class="text-xs text-gray-400">
                                                {{ item.options }}
                                            </p>
                                        </div>
                                        <span
                                            class="text-sm text-gray-600 dark:text-gray-400 shrink-0"
                                        >
                                            {{ formatPrice(item.subtotal) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Upsell items in summary -->
                                <template v-if="upsellCart.length > 0">
                                    <div
                                        class="border-t border-dashed border-[var(--border-primary)] my-3"
                                    />
                                    <div class="space-y-3 mb-4">
                                        <div
                                            v-for="item in upsellCart"
                                            :key="'us-' + item.product.id"
                                            class="flex gap-3"
                                        >
                                            <div
                                                class="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"
                                            >
                                                <span class="text-xs font-medium text-primary">{{
                                                    item.quantity
                                                }}</span>
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p
                                                    class="text-sm text-[var(--text-heading)] truncate"
                                                >
                                                    {{ item.product.name }}
                                                </p>
                                                <p class="text-xs text-primary">Нэмэлт</p>
                                            </div>
                                            <span
                                                class="text-sm text-gray-600 dark:text-gray-400 shrink-0"
                                            >
                                                {{
                                                    formatPrice(
                                                        getEffectivePrice(item.product) *
                                                            item.quantity
                                                    )
                                                }}
                                            </span>
                                        </div>
                                    </div>
                                </template>

                                <!-- Totals -->
                                <div
                                    class="border-t border-[var(--border-primary)] pt-3 space-y-2"
                                >
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-500">Барааны дүн</span>
                                        <span class="text-gray-700 dark:text-gray-300">{{
                                            formatPrice(order.subtotal)
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="upsellTotal > 0"
                                        class="flex justify-between text-sm"
                                    >
                                        <span class="text-gray-500">Нэмэлт бараа</span>
                                        <span class="text-gray-700 dark:text-gray-300"
                                            >+{{ formatPrice(upsellTotal) }}</span
                                        >
                                    </div>
                                    <div
                                        v-if="order.shipping_fee > 0"
                                        class="flex justify-between text-sm"
                                    >
                                        <span class="text-gray-500">Хүргэлт</span>
                                        <span class="text-gray-700 dark:text-gray-300"
                                            >+{{ formatPrice(order.shipping_fee) }}</span
                                        >
                                    </div>
                                    <div
                                        v-if="order.discount > 0"
                                        class="flex justify-between text-sm text-primary-600"
                                    >
                                        <span>Хөнгөлөлт</span>
                                        <span>-{{ formatPrice(order.discount) }}</span>
                                    </div>
                                    <div
                                        class="flex justify-between pt-3 border-t border-[var(--border-primary)]"
                                    >
                                        <span class="font-semibold text-[var(--text-heading)]"
                                            >Нийт</span
                                        >
                                        <span class="text-lg font-bold text-primary">{{
                                            formatPrice(grandTotal)
                                        }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
