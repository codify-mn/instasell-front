<script setup lang="ts">
import type { SubscriptionInvoice } from '~/types/billing'

const {
    invoices,
    invoicesTotal,
    currentInvoice,
    loading,
    checkingPayment,
    fetchInvoices,
    checkInvoicePayment
} = useSubscription()
const toast = useToast()

const showPaymentModal = ref(false)
const currentPage = ref(1)
const pageSize = 10

onMounted(async () => {
    await fetchInvoices(currentPage.value, pageSize)
})

async function handlePageChange(page: number) {
    currentPage.value = page
    await fetchInvoices(page, pageSize)
}

function handleViewInvoice(invoice: SubscriptionInvoice) {
    currentInvoice.value = invoice
    showPaymentModal.value = true
}

async function handleCheckPayment() {
    if (!currentInvoice.value) return
    try {
        const result = await checkInvoicePayment(currentInvoice.value.id)
        if (result.is_paid) {
            showPaymentModal.value = false
            toast.add({ title: 'Амжилттай!', description: 'Төлбөр баталгаажлаа.', color: 'primary' })
            await fetchInvoices(currentPage.value, pageSize)
        } else {
            toast.add({ title: 'Хүлээгдэж байна', description: 'Төлбөр хараахан ирээгүй.', color: 'warning' })
        }
    } catch { /* handled */ }
}
</script>

<template>
    <div class="flex w-full h-full flex-col overflow-hidden bg-[var(--surface-page)]">
        <!-- Header -->
        <div class="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--surface-card)] px-4 sm:px-7">
            <span class="text-base font-bold text-[var(--text-heading)]">Үйлчилгээний эрх</span>
        </div>

        <!-- Tabs -->
        <div class="border-b border-[var(--border-primary)] bg-[var(--surface-card)] px-4 sm:px-7">
            <nav class="flex gap-6 -mb-px">
                <NuxtLink to="/dashboard/billing" exact-active-class="border-primary-500 text-[var(--text-heading)]" class="py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                    Идэвхтэй багц
                </NuxtLink>
                <NuxtLink to="/dashboard/plans" exact-active-class="border-primary-500 text-[var(--text-heading)]" class="py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                    Багц сонгох
                </NuxtLink>
                <NuxtLink to="/dashboard/history" exact-active-class="border-primary-500 text-[var(--text-heading)]" class="py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                    Нэхэмжлэх
                </NuxtLink>
            </nav>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            <div class="max-w-4xl mx-auto px-4 sm:px-7 py-6">
                <!-- Loading skeleton -->
                <div v-if="loading" class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] overflow-hidden">
                    <div class="grid grid-cols-5 gap-4 px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--surface-inset)]/60">
                        <div v-for="i in 5" :key="i" class="h-3 rounded bg-[var(--surface-inset)] shimmer-bar" :class="i === 5 ? 'w-12' : 'w-16'" />
                    </div>
                    <div v-for="i in 5" :key="i" class="grid grid-cols-5 gap-4 px-4 py-3.5 border-b border-[var(--border-subtle)]">
                        <div class="h-3 w-20 rounded bg-[var(--surface-inset)] shimmer-bar" />
                        <div class="h-3 w-16 rounded bg-[var(--surface-inset)] shimmer-bar" />
                        <div class="h-3 w-12 rounded bg-[var(--surface-inset)] shimmer-bar" />
                        <div class="h-3 w-18 rounded bg-[var(--surface-inset)] shimmer-bar" />
                        <div class="h-5 w-16 rounded-full bg-[var(--surface-inset)] shimmer-bar" />
                    </div>
                </div>

                <!-- Empty -->
                <div v-else-if="!invoices.length" class="flex flex-col items-center justify-center py-16 text-center empty-state-enter">
                    <UIcon name="i-lucide-receipt" class="size-10 text-[var(--text-placeholder)] mb-3" />
                    <p class="text-sm text-[var(--text-muted)] mb-4">Нэхэмжлэх байхгүй байна</p>
                    <UButton label="Багц авах" color="primary" size="sm" to="/dashboard/plans" />
                </div>

                <!-- Table -->
                <div v-else class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] overflow-hidden">
                    <BillingHistoryTable
                        :invoices="invoices"
                        :loading="loading"
                        @view-invoice="handleViewInvoice"
                    />

                    <TablePagination :page="currentPage" :total="invoicesTotal" :page-size="pageSize" @update:page="handlePageChange" />
                </div>
            </div>
        </div>

        <!-- Payment Modal -->
        <BillingPaymentModal
            :open="showPaymentModal"
            :invoice="currentInvoice"
            :checking="checkingPayment"
            @update:open="showPaymentModal = $event"
            @check-payment="handleCheckPayment"
        />
    </div>
</template>
