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
    return (amount?.toLocaleString() ?? '') + '₮'
}

const qrImageSrc = computed(() => {
    const qrImage = props.invoice?.qpay_data?.qr_image
    if (!qrImage) return ''
    if (qrImage.startsWith('data:') || qrImage.startsWith('http')) return qrImage
    return `data:image/png;base64,${qrImage}`
})
</script>

<template>
    <UModal v-model:open="isOpen">
        <template #content>
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <h3 class="text-base font-bold text-(--text-heading)">Төлбөр төлөх</h3>
                        <p v-if="invoice?.plan" class="text-sm text-(--text-muted)">{{ invoice.plan.name }}</p>
                    </div>
                    <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="sm" @click="isOpen = false" />
                </div>

                <div v-if="invoice?.qpay_data" class="space-y-5">
                    <!-- Amount -->
                    <div class="text-center py-4 bg-(--surface-inset) rounded-lg">
                        <p class="text-xs text-(--text-muted) mb-1">Нийт төлбөр</p>
                        <p class="text-2xl font-bold text-(--text-heading)">{{ formatAmount(invoice.amount) }}</p>
                        <p class="text-xs text-(--text-muted) mt-0.5">
                            {{ invoice.billing_cycle === 'yearly' ? 'Жилийн төлбөр' : 'Сарын төлбөр' }}
                        </p>
                    </div>

                    <!-- QR Code -->
                    <div class="flex flex-col items-center gap-3">
                        <div class="p-3 bg-white rounded-xl border border-(--border-primary)">
                            <img v-if="qrImageSrc" :src="qrImageSrc" alt="QPay QR" class="w-44 h-44" />
                            <div v-else class="w-44 h-44 flex items-center justify-center">
                                <UIcon name="i-lucide-qr-code" class="size-12 text-(--text-placeholder)" />
                            </div>
                        </div>
                        <p class="text-xs text-(--text-muted)">QR кодыг банкны апп-аар уншуулна уу</p>
                    </div>

                    <!-- Bank deep links -->
                    <div v-if="invoice.qpay_data.deep_links?.length">
                        <p class="text-xs font-semibold text-(--text-heading) mb-2">Банкны апп-аар нээх</p>
                        <div class="grid grid-cols-4 gap-2">
                            <a
                                v-for="link in invoice.qpay_data.deep_links"
                                :key="link.name"
                                :href="link.link"
                                target="_blank"
                                class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-(--surface-inset) transition-colors"
                            >
                                <img v-if="link.logo" :src="link.logo" :alt="link.name" class="w-9 h-9 rounded-lg object-cover" />
                                <span class="text-[10px] text-(--text-muted) text-center line-clamp-1">{{ link.name }}</span>
                            </a>
                        </div>
                    </div>

                    <!-- Status -->
                    <div
                        class="flex items-center justify-between p-3 rounded-lg"
                        :class="invoice.status === 'paid' ? 'bg-[var(--accent-green-light)]' : 'bg-[var(--accent-warn-light)]'"
                    >
                        <div class="flex items-center gap-2">
                            <UIcon
                                :name="invoice.status === 'paid' ? 'i-lucide-check-circle' : 'i-lucide-clock'"
                                class="size-4"
                                :class="invoice.status === 'paid' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-warn-dark)]'"
                            />
                            <span class="text-sm" :class="invoice.status === 'paid' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-warn-dark)]'">
                                {{ invoice.status === 'paid' ? 'Төлбөр баталгаажсан' : 'Төлбөр хүлээж байна...' }}
                            </span>
                        </div>
                        <UButton
                            v-if="invoice.status !== 'paid'"
                            size="xs"
                            variant="ghost"
                            :loading="checking"
                            icon="i-lucide-refresh-cw"
                            @click="emit('check-payment')"
                        >
                            Шалгах
                        </UButton>
                    </div>
                </div>

                <!-- Loading state -->
                <div v-else class="py-12 text-center">
                    <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-(--text-muted) mx-auto mb-2" />
                    <p class="text-sm text-(--text-muted)">Нэхэмжлэх үүсгэж байна...</p>
                </div>
            </div>
        </template>
    </UModal>
</template>
