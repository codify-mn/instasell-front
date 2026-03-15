<script setup lang="ts">
import type { Order, OrderStatus } from '~/composables/useOrders'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const {
    fetchOrder,
    updateOrderStatus,
    cancelOrder,
    getStatusLabel,
    getStatusColor,
    getPaymentMethodLabel,
    formatPrice
} = useOrders()

const orderId = computed(() => Number(route.params.id))

const loading = ref(true)
const order = ref<Order | null>(null)

useSeoMeta({
    title: () =>
        order.value ? `Захиалга #${order.value.order_number} - Instasell` : 'Захиалга - Instasell'
})

const loadOrder = async () => {
    loading.value = true
    try {
        order.value = await fetchOrder(orderId.value)
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: 'Захиалга олдсонгүй',
            color: 'error'
        })
        console.error('Failed to load order', err)
        router.push('/dashboard/orders')
    } finally {
        loading.value = false
    }
}

const timeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Дөнгөж сая'
    if (diffMins < 60) return `${diffMins} мин өмнө`
    if (diffHours < 24) return `${diffHours} цаг өмнө`
    if (diffDays < 7) return `${diffDays} өдөр өмнө`
    return formatDateShort(dateStr)
}

// Status stepper
const statusSteps = [
    { key: 'pending' as OrderStatus, label: 'Хүлээгдэж буй', icon: 'i-lucide-clock' },
    { key: 'paid' as OrderStatus, label: 'Төлөгдсөн', icon: 'i-lucide-credit-card' },
    { key: 'shipped' as OrderStatus, label: 'Илгээгдсэн', icon: 'i-lucide-truck' },
    { key: 'delivered' as OrderStatus, label: 'Хүргэгдсэн', icon: 'i-lucide-package-check' }
]

const statusIcons: Record<string, string> = {
    pending: 'i-lucide-clock',
    paid: 'i-lucide-credit-card',
    shipped: 'i-lucide-truck',
    delivered: 'i-lucide-package-check',
    cancelled: 'i-lucide-x-circle',
    refunded: 'i-lucide-undo-2'
}

const paymentMethodIcons: Record<string, string> = {
    qpay: 'i-lucide-qr-code',
    cash: 'i-lucide-banknote',
    bank_transfer: 'i-lucide-landmark',
    card: 'i-lucide-credit-card'
}

const currentStepIndex = computed(() => {
    if (!order.value) return -1
    return statusSteps.findIndex((s) => s.key === order.value!.status)
})

const isCancelledOrRefunded = computed(() => {
    if (!order.value) return false
    return ['cancelled', 'refunded'].includes(order.value.status)
})

// Next action
const nextAction = computed(() => {
    if (!order.value) return null
    const map: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: string }>> =
        {
            pending: {
                status: 'paid',
                label: 'Төлөгдсөн гэж тэмдэглэх',
                icon: 'i-lucide-credit-card'
            },
            paid: { status: 'shipped', label: 'Илгээгдсэн гэж тэмдэглэх', icon: 'i-lucide-truck' },
            shipped: {
                status: 'delivered',
                label: 'Хүргэгдсэн гэж тэмдэглэх',
                icon: 'i-lucide-package-check'
            }
        }
    return map[order.value.status] || null
})

// Status update
const statusUpdating = ref(false)

const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order.value || order.value.status === newStatus) return

    statusUpdating.value = true
    try {
        await updateOrderStatus(order.value.id, newStatus)
        toast.add({
            title: 'Амжилттай',
            description: `Төлөв ${getStatusLabel(newStatus)} болгож өөрчлөгдлөө`,
            color: 'primary'
        })
        await loadOrder()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Төлөв өөрчлөхөд алдаа гарлаа',
            color: 'error'
        })
    } finally {
        statusUpdating.value = false
    }
}

// Cancel modal
const cancelModalOpen = ref(false)
const cancelling = ref(false)

const confirmCancel = async () => {
    if (!order.value) return

    cancelling.value = true
    try {
        await cancelOrder(order.value.id)
        toast.add({
            title: 'Амжилттай',
            description: 'Захиалга цуцлагдлаа',
            color: 'primary'
        })
        cancelModalOpen.value = false
        await loadOrder()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Цуцлахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        cancelling.value = false
    }
}

const canCancel = computed(() => {
    if (!order.value) return false
    return !['cancelled', 'refunded'].includes(order.value.status)
})

// Copy helpers
const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.add({
        title: `${label} хуулагдлаа`,
        color: 'primary'
    })
}

const checkoutUrl = computed(() => {
    if (!order.value?.checkout_token) return null
    const host = window?.location?.origin || ''
    return `${host}/checkout/${order.value.checkout_token}`
})

// Customer initials
const customerInitials = computed(() => {
    const name = order.value?.customer?.name
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
    return name[0]!.toUpperCase()
})

// Notes & tracking visibility
const hasNotesOrTracking = computed(() => {
    if (!order.value) return false
    return !!(order.value.metadata?.tracking_number || order.value.metadata?.seller_notes)
})

onMounted(async () => {
    await loadOrder()
})
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="order-detail">
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
                        <div v-if="order">
                            <h1 class="text-lg font-semibold text-[var(--text-heading)]">
                                Захиалга #{{ order.order_number }}
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                {{ timeAgo(order.created_at) }}
                            </p>
                        </div>
                        <div v-else>
                            <h1 class="text-lg font-semibold text-[var(--text-heading)]">
                                Захиалга
                            </h1>
                        </div>
                    </template>

                    <template #right>
                        <div class="flex items-center gap-2">
                            <UButton
                                v-if="checkoutUrl"
                                icon="i-lucide-link"
                                color="neutral"
                                variant="ghost"
                                @click="copyToClipboard(checkoutUrl, 'Checkout линк')"
                            >
                                <span class="hidden sm:inline">Линк хуулах</span>
                            </UButton>
                            <UButton
                                v-if="canCancel"
                                icon="i-lucide-x-circle"
                                color="error"
                                variant="ghost"
                                @click="cancelModalOpen = true"
                            >
                                <span class="hidden sm:inline">Цуцлах</span>
                            </UButton>
                        </div>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <div v-if="loading" class="flex items-center justify-center p-20">
                    <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
                </div>

                <div v-else-if="order" class="p-6 overflow-y-auto">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Left Column -->
                        <div class="lg:col-span-2 space-y-6">
                            <!-- Status Progress Stepper -->
                            <div
                                v-if="!isCancelledOrRefunded"
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5"
                            >
                                <div class="flex items-center justify-between">
                                    <div
                                        v-for="(step, index) in statusSteps"
                                        :key="step.key"
                                        class="flex items-center"
                                        :class="index < statusSteps.length - 1 ? 'flex-1' : ''"
                                    >
                                        <!-- Step circle -->
                                        <div class="flex flex-col items-center">
                                            <div
                                                class="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                                                :class="
                                                    index < currentStepIndex
                                                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                                        : index === currentStepIndex
                                                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/30'
                                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                                "
                                            >
                                                <UIcon
                                                    v-if="index < currentStepIndex"
                                                    name="i-lucide-check"
                                                    class="w-4.5 h-4.5"
                                                />
                                                <UIcon
                                                    v-else
                                                    :name="step.icon"
                                                    class="w-4.5 h-4.5"
                                                />
                                            </div>
                                            <span
                                                class="text-xs mt-1.5 font-medium whitespace-nowrap"
                                                :class="
                                                    index <= currentStepIndex
                                                        ? 'text-[var(--text-heading)]'
                                                        : 'text-gray-400 dark:text-gray-500'
                                                "
                                            >
                                                {{ step.label }}
                                            </span>
                                        </div>

                                        <!-- Connector line -->
                                        <div
                                            v-if="index < statusSteps.length - 1"
                                            class="flex-1 h-0.5 mx-2 mt-[-1.25rem] rounded-full transition-all"
                                            :class="
                                                index < currentStepIndex
                                                    ? 'bg-primary-400 dark:bg-primary-500'
                                                    : 'bg-gray-200 dark:bg-gray-700'
                                            "
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Cancelled/Refunded Banner -->
                            <div
                                v-if="isCancelledOrRefunded"
                                class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl p-5"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                                    >
                                        <UIcon
                                            :name="statusIcons[order.status]"
                                            class="w-5 h-5 text-red-500"
                                        />
                                    </div>
                                    <div>
                                        <p class="font-medium text-red-700 dark:text-red-400">
                                            {{ getStatusLabel(order.status) }} захиалга
                                        </p>
                                        <p class="text-sm text-red-600/70 dark:text-red-400/60">
                                            Энэ захиалга дээр үйлдэл хийх боломжгүй
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Next Action Card -->
                            <div
                                v-if="nextAction"
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] overflow-hidden"
                            >
                                <div
                                    class="border-l-4 border-primary-500 p-4 flex items-center justify-between gap-4"
                                >
                                    <div class="flex items-center gap-3">
                                        <UIcon
                                            :name="statusIcons[order.status]"
                                            class="w-5 h-5 text-gray-400"
                                        />
                                        <div>
                                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                                Дараагийн алхам
                                            </p>
                                            <p class="font-medium text-[var(--text-heading)]">
                                                {{ nextAction.label }}
                                            </p>
                                        </div>
                                    </div>
                                    <UButton
                                        :icon="nextAction.icon"
                                        color="primary"
                                        :loading="statusUpdating"
                                        @click="handleStatusChange(nextAction.status)"
                                    >
                                        {{ nextAction.label }}
                                    </UButton>
                                </div>
                            </div>

                            <!-- Delivered Success -->
                            <div
                                v-else-if="order.status === 'delivered'"
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] overflow-hidden"
                            >
                                <div
                                    class="border-l-4 border-primary-500 p-4 flex items-center gap-3"
                                >
                                    <div
                                        class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
                                    >
                                        <UIcon
                                            name="i-lucide-check"
                                            class="w-5 h-5 text-primary-600 dark:text-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <p class="font-medium text-primary-700 dark:text-primary-400">
                                            Захиалга амжилттай хүргэгдсэн
                                        </p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            Бүх алхам дууссан
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Order Items Card -->
                            <div
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5"
                            >
                                <h3 class="text-sm font-medium text-[var(--text-heading)] mb-4">
                                    Захиалсан бараа
                                </h3>

                                <div class="divide-y divide-gray-100 dark:divide-gray-800">
                                    <div
                                        v-for="item in order.items"
                                        :key="item.id"
                                        class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"
                                            >
                                                <UIcon
                                                    name="i-lucide-package"
                                                    class="w-5 h-5 text-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <p
                                                    class="font-medium text-[var(--text-heading)] text-sm"
                                                >
                                                    {{ item.name }}
                                                </p>
                                                <p
                                                    v-if="item.options"
                                                    class="text-xs text-gray-500 dark:text-gray-400"
                                                >
                                                    {{ item.options }}
                                                </p>
                                                <p class="text-xs text-gray-400 dark:text-gray-500">
                                                    {{ formatPrice(item.price) }} &times;
                                                    {{ item.quantity }}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="text-right flex-shrink-0">
                                            <p
                                                class="font-medium text-[var(--text-heading)] text-sm"
                                            >
                                                {{ formatPrice(item.subtotal) }}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Price Summary -->
                                <div
                                    class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2"
                                >
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-500 dark:text-gray-400">Дүн</span>
                                        <span class="text-[var(--text-heading)]">{{
                                            formatPrice(order.subtotal)
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="order.shipping_fee > 0"
                                        class="flex justify-between text-sm"
                                    >
                                        <span class="text-gray-500 dark:text-gray-400"
                                            >Хүргэлт</span
                                        >
                                        <span class="text-[var(--text-heading)]">{{
                                            formatPrice(order.shipping_fee)
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="order.discount > 0"
                                        class="flex justify-between text-sm"
                                    >
                                        <span class="text-gray-500 dark:text-gray-400"
                                            >Хөнгөлөлт</span
                                        >
                                        <span class="text-primary-600"
                                            >-{{ formatPrice(order.discount) }}</span
                                        >
                                    </div>
                                    <div
                                        class="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700"
                                    >
                                        <span class="text-[var(--text-heading)]">Нийт дүн</span>
                                        <span class="text-primary-600 dark:text-primary-400">{{
                                            formatPrice(order.total_amount)
                                        }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column - Sidebar -->
                        <div class="space-y-6">
                            <!-- Order Info Card -->
                            <div
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5"
                            >
                                <h3 class="text-sm font-medium text-[var(--text-heading)] mb-4">
                                    Захиалгын мэдээлэл
                                </h3>

                                <div class="space-y-3">
                                    <!-- Order number -->
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-500 dark:text-gray-400"
                                            >Дугаар</span
                                        >
                                        <div class="flex items-center gap-1.5">
                                            <span
                                                class="text-sm font-medium text-[var(--text-heading)]"
                                                >#{{ order.order_number }}</span
                                            >
                                            <UButton
                                                icon="i-lucide-copy"
                                                color="neutral"
                                                variant="ghost"
                                                size="xs"
                                                @click="
                                                    copyToClipboard(
                                                        order.order_number,
                                                        'Захиалгын дугаар'
                                                    )
                                                "
                                            />
                                        </div>
                                    </div>

                                    <!-- Date -->
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-500 dark:text-gray-400"
                                            >Огноо</span
                                        >
                                        <UTooltip :text="formatDate(order.created_at)">
                                            <span
                                                class="text-sm font-medium text-[var(--text-heading)]"
                                            >
                                                {{ timeAgo(order.created_at) }}
                                            </span>
                                        </UTooltip>
                                    </div>

                                    <!-- Payment method -->
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-500 dark:text-gray-400"
                                            >Төлбөр</span
                                        >
                                        <div class="flex items-center gap-1.5">
                                            <UIcon
                                                :name="
                                                    paymentMethodIcons[order.payment_method] ||
                                                    'i-lucide-wallet'
                                                "
                                                class="w-4 h-4 text-gray-400"
                                            />
                                            <span
                                                class="text-sm font-medium text-[var(--text-heading)]"
                                            >
                                                {{ getPaymentMethodLabel(order.payment_method) }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Source -->
                                    <div
                                        v-if="order.metadata?.source"
                                        class="flex items-center justify-between"
                                    >
                                        <span class="text-sm text-gray-500 dark:text-gray-400"
                                            >Эх сурвалж</span
                                        >
                                        <UBadge color="neutral" variant="subtle" size="sm">
                                            {{ order.metadata.source }}
                                        </UBadge>
                                    </div>

                                    <!-- Status -->
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-500 dark:text-gray-400"
                                            >Төлөв</span
                                        >
                                        <UBadge
                                            :color="getStatusColor(order.status)"
                                            variant="subtle"
                                            class="font-medium"
                                        >
                                            {{ getStatusLabel(order.status) }}
                                        </UBadge>
                                    </div>
                                </div>
                            </div>

                            <!-- Customer Card -->
                            <div
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5"
                            >
                                <h3 class="text-sm font-medium text-[var(--text-heading)] mb-4">
                                    Худалдан авагч
                                </h3>

                                <div class="space-y-3">
                                    <!-- Name with avatar -->
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0"
                                        >
                                            <span
                                                class="text-sm font-semibold text-primary-600 dark:text-primary-400"
                                            >
                                                {{ customerInitials }}
                                            </span>
                                        </div>
                                        <p class="font-medium text-[var(--text-heading)]">
                                            {{ order.customer?.name || '-' }}
                                        </p>
                                    </div>

                                    <!-- Phone -->
                                    <div
                                        v-if="order.customer?.phone_number"
                                        class="flex items-center justify-between"
                                    >
                                        <div class="flex items-center gap-2">
                                            <UIcon
                                                name="i-lucide-phone"
                                                class="w-4 h-4 text-gray-400"
                                            />
                                            <span class="text-sm text-[var(--text-heading)]">
                                                {{ order.customer.phone_number }}
                                            </span>
                                        </div>
                                        <UButton
                                            icon="i-lucide-copy"
                                            color="neutral"
                                            variant="ghost"
                                            size="xs"
                                            @click="
                                                copyToClipboard(
                                                    order.customer.phone_number,
                                                    'Утасны дугаар'
                                                )
                                            "
                                        />
                                    </div>

                                    <!-- Email -->
                                    <div
                                        v-if="order.customer?.email"
                                        class="flex items-center gap-2"
                                    >
                                        <UIcon name="i-lucide-mail" class="w-4 h-4 text-gray-400" />
                                        <span class="text-sm text-[var(--text-heading)]">
                                            {{ order.customer.email }}
                                        </span>
                                    </div>

                                    <!-- Facebook -->
                                    <a
                                        v-if="order.customer?.facebook_id"
                                        :href="`https://facebook.com/${order.customer.facebook_id}`"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                                    >
                                        <UIcon name="i-lucide-facebook" class="w-4 h-4" />
                                        <span class="text-sm">Facebook профайл</span>
                                    </a>

                                    <!-- Address block -->
                                    <div
                                        v-if="
                                            order.customer?.address ||
                                            order.customer?.city ||
                                            order.customer?.district
                                        "
                                        class="pt-2 border-t border-[var(--border-primary)]"
                                    >
                                        <div class="flex items-start gap-2">
                                            <UIcon
                                                name="i-lucide-map-pin"
                                                class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                                            />
                                            <div
                                                class="text-sm text-[var(--text-heading)] space-y-0.5"
                                            >
                                                <p
                                                    v-if="
                                                        order.customer.city ||
                                                        order.customer.district
                                                    "
                                                >
                                                    {{
                                                        [
                                                            order.customer.city,
                                                            order.customer.district
                                                        ]
                                                            .filter(Boolean)
                                                            .join(', ')
                                                    }}
                                                </p>
                                                <p v-if="order.customer.address">
                                                    {{ order.customer.address }}
                                                </p>
                                                <p
                                                    v-if="order.customer.apartment"
                                                    class="text-gray-500 dark:text-gray-400"
                                                >
                                                    {{ order.customer.apartment }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Customer description/notes -->
                                    <div
                                        v-if="order.customer?.description"
                                        class="pt-2 border-t border-[var(--border-primary)]"
                                    >
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            {{ order.customer.description }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Notes & Tracking Card -->
                            <div
                                v-if="hasNotesOrTracking"
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5"
                            >
                                <h3 class="text-sm font-medium text-[var(--text-heading)] mb-4">
                                    Тэмдэглэл & Хүргэлт
                                </h3>

                                <div class="space-y-3">
                                    <!-- Tracking number -->
                                    <div
                                        v-if="order.metadata?.tracking_number"
                                        class="flex items-center justify-between"
                                    >
                                        <div class="flex items-center gap-2">
                                            <UIcon
                                                name="i-lucide-truck"
                                                class="w-4 h-4 text-gray-400"
                                            />
                                            <span class="text-sm text-[var(--text-heading)]">
                                                {{ order.metadata.tracking_number }}
                                            </span>
                                        </div>
                                        <UButton
                                            icon="i-lucide-copy"
                                            color="neutral"
                                            variant="ghost"
                                            size="xs"
                                            @click="
                                                copyToClipboard(
                                                    order.metadata.tracking_number,
                                                    'Tracking дугаар'
                                                )
                                            "
                                        />
                                    </div>

                                    <!-- Seller notes -->
                                    <div v-if="order.metadata?.seller_notes">
                                        <div class="flex items-center gap-2 mb-1.5">
                                            <UIcon
                                                name="i-lucide-sticky-note"
                                                class="w-4 h-4 text-gray-400"
                                            />
                                            <span
                                                class="text-xs font-medium text-gray-500 dark:text-gray-400"
                                                >Тэмдэглэл</span
                                            >
                                        </div>
                                        <p class="text-sm text-gray-600 dark:text-gray-400 pl-6">
                                            {{ order.metadata.seller_notes }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cancel Modal -->
                <UModal v-model:open="cancelModalOpen">
                    <template #content>
                        <UCard>
                            <template #header>
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-alert-triangle" class="text-red-500" />
                                    <span class="font-semibold">Захиалга цуцлах</span>
                                </div>
                            </template>

                            <p>
                                <strong>#{{ order?.order_number }}</strong> захиалгыг цуцлахдаа
                                итгэлтэй байна уу?
                            </p>
                            <p class="text-sm text-gray-500 mt-2">Энэ үйлдлийг буцаах боломжгүй.</p>

                            <template #footer>
                                <div class="flex justify-end gap-2">
                                    <UButton
                                        color="neutral"
                                        variant="outline"
                                        @click="cancelModalOpen = false"
                                    >
                                        Болих
                                    </UButton>
                                    <UButton
                                        color="error"
                                        :loading="cancelling"
                                        @click="confirmCancel"
                                    >
                                        Цуцлах
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
