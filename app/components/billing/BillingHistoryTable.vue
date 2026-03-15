<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SubscriptionInvoice } from '~/types/billing'

const props = defineProps<{
    invoices: SubscriptionInvoice[]
    loading?: boolean
}>()

const emit = defineEmits<{
    'view-invoice': [invoice: SubscriptionInvoice]
}>()

// uses auto-imported formatDateShort from composables/formatter.ts

function formatAmount(amount: number) {
    return amount.toLocaleString() + '₮'
}

function getStatusColor(status: string) {
    switch (status) {
        case 'paid':
            return 'success'
        case 'pending':
            return 'warning'
        case 'failed':
        case 'expired':
            return 'error'
        default:
            return 'neutral'
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'paid':
            return 'Төлсөн'
        case 'pending':
            return 'Хүлээгдэж буй'
        case 'failed':
            return 'Амжилтгүй'
        case 'expired':
            return 'Хугацаа дууссан'
        default:
            return status
    }
}

function getBillingCycleLabel(cycle: string) {
    return cycle === 'yearly' ? 'Жилээр' : 'Сараар'
}

const columns: TableColumn<SubscriptionInvoice>[] = [
    { accessorKey: 'created_at', header: 'Огноо' },
    { accessorKey: 'plan', header: 'Багц' },
    { accessorKey: 'billing_cycle', header: 'Төлбөрийн мөчлөг' },
    { accessorKey: 'amount', header: 'Дүн' },
    { accessorKey: 'status', header: 'Төлөв' },
    { accessorKey: 'actions', header: '' }
]
</script>

<template>
    <div>
        <div v-if="loading" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-(--text-muted)" />
        </div>

        <div v-else-if="invoices.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-receipt" class="size-10 text-(--text-placeholder) mx-auto mb-3" />
            <p class="text-sm text-(--text-muted)">Нэхэмжлэх байхгүй</p>
        </div>

        <UTable
            v-else
            :data="invoices"
            :columns="columns"
            :ui="{
                base: 'min-w-full border-separate border-spacing-0',
                thead: '[&>tr]:bg-[var(--surface-inset)]/60 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'first:rounded-l-lg last:rounded-r-lg border-y border-[var(--border-primary)] first:border-l last:border-r px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider',
                td: 'px-4 py-3 border-b border-[var(--border-primary)]',
                tr: 'hover:bg-[var(--surface-inset)]/40 transition-colors duration-150'
            }"
        >
            <template #created_at-cell="{ row }">
                <span class="text-(--text-muted)">
                    {{ formatDateShort(row.original.created_at) }}
                </span>
            </template>

            <template #plan-cell="{ row }">
                <span class="font-medium text-(--text-heading)">
                    {{ row.original.plan?.name || 'Тодорхойгүй' }}
                </span>
            </template>

            <template #billing_cycle-cell="{ row }">
                <span class="text-(--text-muted)">
                    {{ getBillingCycleLabel(row.original.billing_cycle) }}
                </span>
            </template>

            <template #amount-cell="{ row }">
                <span class="font-medium text-(--text-heading)">
                    {{ formatAmount(row.original.amount) }}
                </span>
            </template>

            <template #status-cell="{ row }">
                <UBadge
                    :color="getStatusColor(row.original.status)"
                    variant="subtle"
                    size="sm"
                >
                    {{ getStatusLabel(row.original.status) }}
                </UBadge>
            </template>

            <template #actions-cell="{ row }">
                <div class="flex justify-end">
                    <UButton
                        v-if="row.original.status === 'pending'"
                        size="xs"
                        variant="ghost"
                        icon="i-lucide-credit-card"
                        @click="emit('view-invoice', row.original)"
                    >
                        Төлөх
                    </UButton>
                    <UButton
                        v-else
                        size="xs"
                        variant="ghost"
                        icon="i-lucide-file-text"
                        disabled
                    >
                        Баримт
                    </UButton>
                </div>
            </template>
        </UTable>
    </div>
</template>
