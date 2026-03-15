<script setup lang="ts">
import type { QPayInvoice } from '~/composables/useQPay'

const props = defineProps<{
    modelValue: boolean
    invoice: QPayInvoice | null
    orderId?: number
    orderNumber?: string
    totalAmount?: number
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    paymentConfirmed: []
}>()

const { checkPayment, isCheckingPayment } = useQPay()

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Auto-refresh payment status
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)
const lastChecked = ref<Date | null>(null)

watch(isOpen, (open) => {
    if (open && props.orderId) {
        startPolling()
    } else {
        stopPolling()
    }
})

onUnmounted(() => {
    stopPolling()
})

function startPolling() {
    // Check immediately
    checkPaymentStatus()
    // Then every 10 seconds
    pollingInterval.value = setInterval(checkPaymentStatus, 10000)
}

function stopPolling() {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
        pollingInterval.value = null
    }
}

async function checkPaymentStatus() {
    if (!props.orderId || isCheckingPayment.value) return

    try {
        const result = await checkPayment(props.orderId)
        lastChecked.value = new Date()

        if (result.is_paid) {
            stopPolling()
            emit('paymentConfirmed')
        }
    } catch {
        // Error handled in composable
    }
}

function formatAmount(amount?: number) {
    return amount?.toLocaleString() + '₮' || ''
}
</script>

<template>
    <UModal v-model:open="isOpen">
        <template #content>
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center"
                            >
                                <UIcon
                                    name="i-lucide-qr-code"
                                    class="w-5 h-5 text-primary-500"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-(--text-heading)">
                                    QPay төлбөр
                                </h3>
                                <p v-if="orderNumber" class="text-sm text-(--text-muted)">
                                    Захиалга #{{ orderNumber }}
                                </p>
                            </div>
                        </div>
                        <UButton
                            icon="i-lucide-x"
                            variant="ghost"
                            color="neutral"
                            size="sm"
                            @click="isOpen = false"
                        />
                    </div>
                </template>

                <div v-if="invoice" class="space-y-6">
                    <!-- Amount -->
                    <div class="text-center py-4 bg-(--surface-inset) rounded-lg">
                        <p class="text-sm text-(--text-muted) mb-1">Нийт төлбөр</p>
                        <p class="text-3xl font-bold text-primary-500">
                            {{ formatAmount(totalAmount) }}
                        </p>
                    </div>

                    <!-- QR Code -->
                    <div class="flex flex-col items-center gap-4">
                        <div class="p-4 bg-white rounded-xl shadow-sm border">
                            <img
                                v-if="invoice.qr_image"
                                :src="invoice.qr_image"
                                alt="QPay QR Code"
                                class="w-48 h-48"
                            >
                            <div
                                v-else
                                class="w-48 h-48 flex items-center justify-center bg-(--surface-inset) rounded"
                            >
                                <UIcon name="i-lucide-qr-code" class="w-16 h-16 text-(--text-placeholder)" />
                            </div>
                        </div>
                        <p class="text-sm text-(--text-muted) text-center">
                            QR кодыг банкны апп-аар уншуулна уу
                        </p>
                    </div>

                    <!-- Bank Apps -->
                    <div v-if="invoice.deep_links?.length" class="space-y-3">
                        <p class="text-sm font-medium text-(--text-body)">
                            Банкны апп-аар нээх
                        </p>
                        <div class="grid grid-cols-4 gap-2">
                            <a
                                v-for="link in invoice.deep_links"
                                :key="link.name"
                                :href="link.link"
                                target="_blank"
                                class="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-(--surface-inset) transition-colors"
                            >
                                <img
                                    v-if="link.logo"
                                    :src="link.logo"
                                    :alt="link.name"
                                    class="w-10 h-10 rounded-lg object-cover"
                                >
                                <span class="text-[10px] text-(--text-muted) text-center line-clamp-1">{{
                                    link.name
                                }}</span>
                            </a>
                        </div>
                    </div>

                    <!-- Status -->
                    <div
                        class="flex items-center justify-between p-3 bg-(--accent-warn-light) rounded-lg"
                    >
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-clock" class="w-4 h-4 text-amber-600" />
                            <span class="text-sm text-(--accent-warn-dark)"
                                >Төлбөр хүлээж байна...</span
                            >
                        </div>
                        <UButton
                            size="xs"
                            variant="ghost"
                            :loading="isCheckingPayment"
                            icon="i-lucide-refresh-cw"
                            @click="checkPaymentStatus"
                        >
                            Шалгах
                        </UButton>
                    </div>

                    <p v-if="lastChecked" class="text-xs text-(--text-placeholder) text-center">
                        Сүүлд шалгасан: {{ lastChecked.toLocaleTimeString() }}
                    </p>
                </div>

                <div v-else class="py-12 text-center">
                    <UIcon
                        name="i-lucide-loader-2"
                        class="w-8 h-8 animate-spin text-(--text-placeholder) mx-auto mb-3"
                    />
                    <p class="text-sm text-(--text-muted)">Нэхэмжлэх ачаалж байна...</p>
                </div>
            </UCard>
        </template>
    </UModal>
</template>
