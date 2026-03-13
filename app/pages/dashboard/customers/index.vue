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

const totalPages = computed(() => Math.ceil(total.value / size.value))

const goToPage = (p: number) => {
    page.value = p
    loadCustomers()
}

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

onMounted(() => {
    loadCustomers()
})
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="customers">
            <UDashboardNavbar>
                <template #title>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-users" class="w-5 h-5" />
                        <span>Хэрэглэгчид</span>
                    </div>
                </template>
                <template #right>
                    <UInput
                        v-model="search"
                        placeholder="Нэр, утас, имэйлээр хайх..."
                        icon="i-lucide-search"
                        size="sm"
                        class="w-64"
                        @input="onSearch"
                    />
                </template>
            </UDashboardNavbar>

            <div class="p-4 space-y-4">
                <!-- Stats -->
                <div class="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                    <span>Нийт {{ total }} хэрэглэгч</span>
                </div>

                <!-- Table -->
                <div
                    class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] overflow-hidden"
                >
                    <UTable :data="customers" :columns="columns" :loading="loading">
                        <template #name-cell="{ row }">
                            <div class="flex items-center gap-2">
                                <UAvatar :alt="row.original.name" size="sm" />
                                <div>
                                    <p class="font-medium text-[var(--text-heading)]">
                                        {{ row.original.name }}
                                    </p>
                                    <p v-if="row.original.email" class="text-xs text-[var(--text-placeholder)]">
                                        {{ row.original.email }}
                                    </p>
                                </div>
                            </div>
                        </template>

                        <template #phone_number-cell="{ row }">
                            <span class="text-sm text-[var(--text-muted)]">
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
                                <UBadge color="info" variant="subtle" size="xs" class="cursor-pointer hover:opacity-80 transition-opacity">
                                    <UIcon name="i-lucide-facebook" class="w-3 h-3 mr-1" />
                                    Профайл
                                </UBadge>
                            </a>
                            <span v-else class="text-xs text-[var(--text-placeholder)]">-</span>
                        </template>

                        <template #order_count-cell="{ row }">
                            <span class="font-medium text-[var(--text-heading)]">
                                {{ row.original.order_count }}
                            </span>
                        </template>

                        <template #total_spent-cell="{ row }">
                            <span class="font-medium text-[var(--text-heading)]">
                                {{ formatPrice(row.original.total_spent) }}
                            </span>
                        </template>

                        <template #last_order_at-cell="{ row }">
                            <span class="text-sm text-[var(--text-muted)]">
                                {{ formatDate(row.original.last_order_at) }}
                            </span>
                        </template>

                        <template #actions-cell="{ row }">
                            <UButton
                                icon="i-lucide-eye"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                                @click="router.push(`/dashboard/customers/${row.original.id}`)"
                            />
                        </template>
                    </UTable>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="flex justify-center">
                    <UPagination
                        v-model="page"
                        :total="total"
                        :items-per-page="size"
                        @update:model-value="goToPage"
                    />
                </div>
            </div>
        </UDashboardPanel>
    </div>
</template>
