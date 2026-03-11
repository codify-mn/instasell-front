<script setup lang="ts">
import type { SubscriptionInvoice } from '~/types/billing'

const props = defineProps<{
    open: boolean
    invoice: SubscriptionInvoice | null
    checking: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    'check-payment': []
}>()

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

function formatAmount(amount?: number) {
    return amount?.toLocaleString() + '₮' || ''
}

const qrImageSrc = computed(() => {
    const qrImage = props.invoice?.qpay_data?.qr_image
    if (!qrImage) return ''
    // If already a data URL or URL, return as-is
    if (qrImage.startsWith('data:') || qrImage.startsWith('http')) {
        return qrImage
    }
    // Otherwise, assume it's base64 and add the prefix
    return `data:image/png;base64,${qrImage}`
})

function handleCheckPayment() {
    emit('check-payment')
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
                                class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
                            >
                                <UIcon
                                    name="i-lucide-credit-card"
                                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 dark:text-white">
                                    Багц худалдан авах
                                </h3>
                                <p v-if="invoice?.plan" class="text-sm text-gray-500">
                                    {{ invoice.plan.name }}
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

                <div v-if="invoice?.qpay_data" class="space-y-6">
                    <!-- Amount -->
                    <div class="text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p class="text-sm text-gray-500 mb-1">Нийт төлбөр</p>
                        <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                            {{ formatAmount(invoice.amount) }}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            {{
                                invoice.billing_cycle === 'yearly'
                                    ? 'Жилийн төлбөр'
                                    : 'Сарын төлбөр'
                            }}
                        </p>
                    </div>

                    <!-- QR Code -->
                    <div class="flex flex-col items-center gap-4">
                        <div class="p-4 bg-white rounded-xl shadow-sm border">
                            <img
                                v-if="qrImageSrc"
                                :src="qrImageSrc"
                                alt="QPay QR Code"
                                class="w-48 h-48"
                            >
                            <div
                                v-else
                                class="w-48 h-48 flex items-center justify-center bg-gray-100 rounded"
                            >
                                <UIcon name="i-lucide-qr-code" class="w-16 h-16 text-gray-300" />
                            </div>
                        </div>
                        <p class="text-sm text-gray-500 text-center">
                            QR кодыг банкны апп-аар уншуулна уу
                        </p>
                    </div>

                    <!-- Bank Apps -->
                    <div v-if="invoice.qpay_data.deep_links?.length" class="space-y-3">
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Банкны апп-аар нээх
                        </p>
                        <div class="grid grid-cols-4 gap-2">
                            <a
                                v-for="link in invoice.qpay_data.deep_links"
                                :key="link.name"
                                :href="link.link"
                                target="_blank"
                                class="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <img
                                    v-if="link.logo"
                                    :src="link.logo"
                                    :alt="link.name"
                                    class="w-10 h-10 rounded-lg object-cover"
                                >
                                <span class="text-[10px] text-gray-500 text-center line-clamp-1">{{
                                    link.name
                                }}</span>
                            </a>
                        </div>
                    </div>

                    <!-- Status -->
                    <div
                        class="flex items-center justify-between p-3 rounded-lg"
                        :class="
                            invoice.status === 'paid'
                                ? 'bg-primary-50 dark:bg-primary-900/20'
                                : 'bg-amber-50 dark:bg-amber-900/20'
                        "
                    >
                        <div class="flex items-center gap-2">
                            <UIcon
                                :name="
                                    invoice.status === 'paid'
                                        ? 'i-lucide-check-circle'
                                        : 'i-lucide-clock'
                                "
                                class="w-4 h-4"
                                :class="
                                    invoice.status === 'paid' ? 'text-primary-600' : 'text-amber-600'
                                "
                            />
                            <span
                                class="text-sm"
                                :class="
                                    invoice.status === 'paid'
                                        ? 'text-primary-700 dark:text-primary-400'
                                        : 'text-amber-700 dark:text-amber-400'
                                "
                            >
                                {{
                                    invoice.status === 'paid'
                                        ? 'Төлбөр баталгаажсан'
                                        : 'Төлбөр хүлээж байна...'
                                }}
                            </span>
                        </div>
                        <UButton
                            v-if="invoice.status !== 'paid'"
                            size="xs"
                            variant="ghost"
                            :loading="checking"
                            icon="i-lucide-refresh-cw"
                            @click="handleCheckPayment"
                        >
                            Шалгах
                        </UButton>
                    </div>
                </div>

                <div v-else class="py-12 text-center">
                    <UIcon
                        name="i-lucide-loader-2"
                        class="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3"
                    />
                    <p class="text-sm text-gray-500">Нэхэмжлэх үүсгэж байна...</p>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <UButton color="neutral" variant="outline" @click="isOpen = false">
                            Хаах
                        </UButton>
                    </div>
                </template>
            </UCard>
        </template>
    </UModal>
</template>
