<script setup lang="ts">
import type { OrderQPayData } from '~/composables/useOrders'

interface Props {
    qpayData: OrderQPayData
    orderNumber: string
    totalAmount: number
    isPaid: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
    paid: []
}>()

const { formatPrice } = useOrders()

// Timer for remaining time (30 min from invoice creation)
const remainingTime = ref('')
const timerInterval = ref<ReturnType<typeof setInterval>>()

function updateTimer() {
    if (!props.qpayData.created_at) return
    const created = new Date(props.qpayData.created_at)
    const expires = new Date(created.getTime() + 30 * 60 * 1000) // 30 min
    const now = new Date()
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) {
        remainingTime.value = 'Хугацаа дууссан'
        if (timerInterval.value) clearInterval(timerInterval.value)
        return
    }

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    remainingTime.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
}

onMounted(() => {
    updateTimer()
    timerInterval.value = setInterval(updateTimer, 1000)
})

onUnmounted(() => {
    if (timerInterval.value) clearInterval(timerInterval.value)
})

watch(
    () => props.isPaid,
    (val) => {
        if (val && timerInterval.value) {
            clearInterval(timerInterval.value)
        }
    }
)
</script>

<template>
    <div class="space-y-6">
        <!-- Payment Success -->
        <div v-if="isPaid" class="text-center py-6">
            <div
                class="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-4"
            >
                <UIcon name="i-lucide-check" class="w-10 h-10 text-primary-500" />
            </div>
            <h3 class="text-xl font-bold text-[var(--text-heading)] mb-2">
                Төлбөр баталгаажлаа!
            </h3>
            <p class="text-gray-500">Захиалга {{ orderNumber }} амжилттай төлөгдлөө.</p>
        </div>

        <!-- Payment Pending -->
        <template v-else>
            <!-- Header -->
            <div class="text-center">
                <h3 class="text-lg font-bold text-[var(--text-heading)] mb-1">QPay-ээр төлөх</h3>
                <p class="text-2xl font-bold text-primary">
                    {{ formatPrice(totalAmount) }}
                </p>
                <div
                    v-if="remainingTime"
                    class="inline-flex items-center gap-1.5 mt-2 text-xs text-gray-400"
                >
                    <UIcon name="i-lucide-clock" class="w-3.5 h-3.5" />
                    {{ remainingTime }}
                </div>
            </div>

            <!-- QR Code -->
            <div v-if="qpayData.qr_image" class="flex justify-center">
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <img
                        :src="'data:image/png;base64,' + qpayData.qr_image"
                        alt="QPay QR Code"
                        class="w-48 h-48"
                    >
                </div>
            </div>

            <!-- Bank App Deep Links -->
            <div v-if="qpayData.deep_links?.length" class="space-y-2">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    Банкны аппаар төлөх
                </p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <a
                        v-for="link in qpayData.deep_links"
                        :key="link.name"
                        :href="link.link"
                        target="_blank"
                        class="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                        <img
                            v-if="link.logo"
                            :src="link.logo"
                            :alt="link.name"
                            class="w-8 h-8 rounded-lg object-contain"
                        >
                        <span class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {{ link.name }}
                        </span>
                    </a>
                </div>
            </div>

            <!-- Polling indicator -->
            <div class="flex items-center justify-center gap-2 text-sm text-gray-400">
                <div class="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Төлбөр хүлээж байна...
            </div>
        </template>
    </div>
</template>
