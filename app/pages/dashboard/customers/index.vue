<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CustomerWithStats } from '~/composables/useCustomers'

useSeoMeta({
    title: 'Хэрэглэгчид - Instasell'
})

const { listCustomers } = useCustomers()
const { formatPrice } = useOrders()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const customers = ref<CustomerWithStats[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const search = ref('')
const searchDebounce = ref<ReturnType<typeof setTimeout>>()

const columns: TableColumn<CustomerWithStats>[] = [
    { accessorKey: 'name', header: 'Нэр' },
    { accessorKey: 'phone_number', header: 'Утас' },
    { accessorKey: 'facebook_id', header: 'Facebook' },
    { accessorKey: 'order_count', header: 'Захиалга' },
    { accessorKey: 'total_spent', header: 'Нийт зарцуулсан' },
    { accessorKey: 'last_order_at', header: 'Сүүлийн захиалга' },
    { accessorKey: 'actions', header: '' }
]

const loadCustomers = async () => {
    loading.value = true
    try {
        const res = await listCustomers(page.value, search.value, size.value)
        customers.value = res.customers || []
        total.value = res.total || 0
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Хэрэглэгчид ачаалахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

const onSearch = () => {
    if (searchDebounce.value) clearTimeout(searchDebounce.value)
    searchDebounce.value = setTimeout(() => {
        page.value = 1
        loadCustomers()
    }, 300)
}

const setPage = (p: number) => {
    page.value = p
    loadCustomers()
}

const onRowClick = (customer: CustomerWithStats) => {
    router.push(`/dashboard/customers/${customer.id}`)
}

onMounted(() => {
    loadCustomers()
})
</script>

<template>
    <div class="flex flex-col h-full w-full">
        <!-- Header -->
        <div
            class="flex h-14 shrink-0 items-center justify-between border-b border-(--border-primary) bg-(--surface-card) px-4 sm:px-7"
        >
            <span class="text-base font-bold text-(--text-heading)">Хэрэглэгчид</span>
            <span class="text-sm text-(--text-muted)">Нийт {{ total }}</span>
        </div>

        <!-- Filters + Table Card -->
        <div class="flex-1 overflow-auto p-4 sm:p-6">
            <div
                class="bg-(--surface-card) rounded-xl border border-(--border-primary) overflow-hidden"
            >
                <!-- Search -->
                <div class="px-4 py-3 border-b border-(--border-primary)">
                    <div class="flex flex-wrap items-center gap-2">
                        <UInput
                            v-model="search"
                            placeholder="Нэр, утас, имэйлээр хайх..."
                            icon="i-lucide-search"
                            class="w-full sm:w-64"
                            size="sm"
                            @input="onSearch"
                        />
                    </div>
                </div>

                <!-- Table -->
                <UTable
                    :data="customers"
                    :columns="columns"
                    :loading="loading"
                    :ui="{
                        base: 'min-w-full border-separate border-spacing-0',
                        thead: '[&>tr]:bg-[var(--surface-inset)]/60 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0 stagger-rows',
                        th: 'border-b border-[var(--border-primary)] px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider',
                        td: 'px-4 py-3 border-b border-[var(--border-primary)]',
                        tr: 'group hover:bg-[var(--surface-inset)]/40 transition-colors duration-150 cursor-pointer'
                    }"
                >
                    <template #name-cell="{ row }">
                        <div class="flex items-center gap-3" @click="onRowClick(row.original)">
                            <UAvatar :alt="row.original.name" size="sm" />
                            <div>
                                <p class="font-medium text-(--text-heading)">
                                    {{ row.original.name }}
                                </p>
                                <p
                                    v-if="row.original.email"
                                    class="text-xs text-(--text-placeholder)"
                                >
                                    {{ row.original.email }}
                                </p>
                            </div>
                        </div>
                    </template>

                    <template #phone_number-cell="{ row }">
                        <span class="text-sm text-(--text-body)">
                            {{ row.original.phone_number || '-' }}
                        </span>
                    </template>

                    <template #facebook_id-cell="{ row }">
                        <a
                            v-if="row.original.facebook_id"
                            :href="`https://facebook.com/${row.original.facebook_id}`"
                            target="_blank"
                            rel="noopener noreferrer"
                            @click.stop
                        >
                            <UBadge
                                color="info"
                                variant="subtle"
                                size="xs"
                                class="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <UIcon name="i-lucide-facebook" class="w-3 h-3 mr-1" />
                                Профайл
                            </UBadge>
                        </a>
                        <span v-else class="text-xs text-(--text-placeholder)">-</span>
                    </template>

                    <template #order_count-cell="{ row }">
                        <span class="font-medium text-(--text-heading)">
                            {{ row.original.order_count }}
                        </span>
                    </template>

                    <template #total_spent-cell="{ row }">
                        <span class="font-medium text-(--text-heading)">
                            {{ formatPrice(row.original.total_spent) }}
                        </span>
                    </template>

                    <template #last_order_at-cell="{ row }">
                        <span class="text-sm text-(--text-muted)">
                            {{ formatDateShort(row.original.last_order_at) }}
                        </span>
                    </template>

                    <template #actions-cell="{ row }">
                        <UButton
                            icon="i-lucide-chevron-right"
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            @click="onRowClick(row.original)"
                        />
                    </template>

                    <template #empty>
                        <div
                            class="flex flex-col items-center justify-center py-20 text-center empty-state-enter"
                        >
                            <div
                                class="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-6"
                            >
                                <UIcon name="i-lucide-users" class="w-10 h-10 text-primary-500" />
                            </div>
                            <h3 class="text-lg font-semibold text-(--text-heading) mb-2">
                                Хэрэглэгч олдсонгүй
                            </h3>
                            <p class="text-(--text-muted) max-w-sm">
                                Одоогоор ямар ч хэрэглэгч байхгүй байна.
                            </p>
                        </div>
                    </template>
                </UTable>

                <TablePagination
                    :page="page"
                    :total="total"
                    :page-size="size"
                    @update:page="setPage"
                />
            </div>
        </div>
    </div>
</template>
