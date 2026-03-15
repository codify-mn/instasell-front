<script setup lang="ts">
const {
    subscription,
    usage,
    loading,
    daysRemaining,
    isTrialing,
    isActive,
    formatLimit,
    formatStorage,
    fetchSubscription,
    fetchUsage,
    cancelSubscription
} = useSubscription()
const toast = useToast()

const showCancelModal = ref(false)
const canceling = ref(false)

onMounted(async () => {
    await Promise.all([fetchSubscription(), fetchUsage()])
})

const statusLabel = computed(() => {
    const map: Record<string, string> = {
        active: 'Идэвхтэй',
        trialing: 'Туршилт',
        past_due: 'Хугацаа хэтэрсэн',
        canceled: 'Цуцлагдсан',
        expired: 'Дууссан'
    }
    return map[subscription.value?.status ?? ''] ?? 'Тодорхойгүй'
})

const statusColor = computed(() => {
    const map: Record<string, string> = {
        active: 'success',
        trialing: 'info',
        past_due: 'warning',
        canceled: 'error',
        expired: 'error'
    }
    return map[subscription.value?.status ?? ''] ?? 'neutral'
})

const price = computed(() => {
    if (!subscription.value?.plan) return ''
    const p = subscription.value.billing_cycle === 'monthly'
        ? subscription.value.plan.monthly_price
        : subscription.value.plan.yearly_price
    return p?.toLocaleString() + '₮'
})

const cycle = computed(() =>
    subscription.value?.billing_cycle === 'monthly' ? 'сар' : 'жил'
)

const usageItems = computed(() => {
    if (!usage.value || !subscription.value?.plan) return []
    const plan = subscription.value.plan
    const pct = (c: number, m: number) => m === -1 ? 0 : Math.min(100, (c / m) * 100)

    return [
        { label: 'Бүтээгдэхүүн', current: usage.value.product_count, max: plan.limits.max_products, percent: pct(usage.value.product_count, plan.limits.max_products) },
        { label: 'Захиалга /сар/', current: usage.value.order_count_month, max: plan.limits.max_orders_per_month, percent: pct(usage.value.order_count_month, plan.limits.max_orders_per_month) },
        { label: 'Хадгалах зай', current: usage.value.storage_used_mb, max: plan.limits.max_storage_mb, isStorage: true, percent: pct(usage.value.storage_used_mb, plan.limits.max_storage_mb) },
        { label: 'Дэлгүүр', current: usage.value.shop_count, max: plan.limits.max_shops, percent: pct(usage.value.shop_count, plan.limits.max_shops) }
    ]
})

const featureItems = computed(() => {
    if (!subscription.value?.plan) return []
    const f = subscription.value.plan.features
    return [
        { label: 'Facebook Live', on: f.facebook_live },
        { label: 'Дэвшилтэт тайлан', on: f.advanced_analytics },
        { label: 'Брэнд тохиргоо', on: f.custom_branding },
        { label: 'Тусгай дэмжлэг', on: f.priority_support },
        { label: 'API хандалт', on: f.api_access }
    ]
})

const progressColor = (pct: number) => {
    if (pct >= 90) return 'error'
    if (pct >= 70) return 'warning'
    return 'primary'
}

async function handleCancel() {
    canceling.value = true
    try {
        await cancelSubscription()
        showCancelModal.value = false
        toast.add({ title: 'Амжилттай', description: 'Захиалга цуцлагдлаа.', color: 'primary' })
    } catch {
        toast.add({ title: 'Алдаа', description: 'Цуцлахад алдаа гарлаа.', color: 'error' })
    } finally {
        canceling.value = false
    }
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
                <NuxtLink
                    to="/dashboard/billing"
                    exact-active-class="border-primary-500 text-[var(--text-heading)]"
                    class="py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
                >
                    Идэвхтэй багц
                </NuxtLink>
                <NuxtLink
                    to="/dashboard/plans"
                    exact-active-class="border-primary-500 text-[var(--text-heading)]"
                    class="py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
                >
                    Багц сонгох
                </NuxtLink>
                <NuxtLink
                    to="/dashboard/history"
                    exact-active-class="border-primary-500 text-[var(--text-heading)]"
                    class="py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
                >
                    Нэхэмжлэх
                </NuxtLink>
            </nav>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            <div class="max-w-3xl mx-auto px-4 sm:px-7 py-6 space-y-6">
                <!-- Loading skeleton -->
                <div v-if="loading" class="space-y-6">
                    <div class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5 space-y-4">
                        <div class="flex items-start justify-between">
                            <div class="space-y-2">
                                <div class="h-5 w-32 rounded bg-[var(--surface-inset)] animate-pulse" />
                                <div class="h-3 w-48 rounded bg-[var(--surface-inset)] animate-pulse" />
                            </div>
                            <div class="h-6 w-20 rounded bg-[var(--surface-inset)] animate-pulse" />
                        </div>
                        <div class="h-3 w-56 rounded bg-[var(--surface-inset)] animate-pulse" />
                        <div class="border-t border-[var(--border-subtle)] pt-4 flex gap-2">
                            <div class="h-8 w-28 rounded-md bg-[var(--surface-inset)] animate-pulse" />
                            <div class="h-8 w-24 rounded-md bg-[var(--surface-inset)] animate-pulse" />
                        </div>
                    </div>
                    <div class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5 space-y-4">
                        <div class="h-4 w-20 rounded bg-[var(--surface-inset)] animate-pulse" />
                        <div v-for="i in 4" :key="i" class="space-y-1.5">
                            <div class="flex justify-between">
                                <div class="h-3 w-24 rounded bg-[var(--surface-inset)] animate-pulse" />
                                <div class="h-3 w-16 rounded bg-[var(--surface-inset)] animate-pulse" />
                            </div>
                            <div class="h-1.5 w-full rounded-full bg-[var(--surface-inset)] animate-pulse" />
                        </div>
                    </div>
                    <div class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5 space-y-3">
                        <div class="h-4 w-28 rounded bg-[var(--surface-inset)] animate-pulse" />
                        <div class="grid grid-cols-2 gap-2">
                            <div v-for="i in 5" :key="i" class="h-4 w-32 rounded bg-[var(--surface-inset)] animate-pulse" />
                        </div>
                    </div>
                </div>

                <!-- No subscription -->
                <template v-else-if="!subscription">
                    <div class="flex flex-col items-center justify-center py-16 text-center">
                        <UIcon name="i-lucide-credit-card" class="size-10 text-[var(--text-placeholder)] mb-3" />
                        <p class="text-sm text-[var(--text-muted)] mb-4">Одоогоор идэвхтэй багц байхгүй байна</p>
                        <UButton label="Багц сонгох" color="primary" to="/dashboard/plans" />
                    </div>
                </template>

                <template v-else>
                    <!-- Plan overview -->
                    <div class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <div class="flex items-center gap-2.5 mb-1">
                                    <h2 class="text-lg font-bold text-[var(--text-heading)]">{{ subscription.plan?.name }}</h2>
                                    <UBadge :color="statusColor" variant="subtle" size="sm">{{ statusLabel }}</UBadge>
                                </div>
                                <p class="text-sm text-[var(--text-muted)]">{{ subscription.plan?.description }}</p>
                            </div>
                            <div class="text-right">
                                <div class="text-xl font-bold text-[var(--text-heading)]">{{ price }}</div>
                                <div class="text-xs text-[var(--text-muted)]">/ {{ cycle }}</div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                            <div class="flex items-center gap-1.5">
                                <UIcon name="i-lucide-calendar" class="size-3.5" />
                                <span v-if="isTrialing">Туршилт: {{ daysRemaining }} хоног үлдсэн</span>
                                <span v-else-if="isActive">Дараагийн төлбөр: {{ daysRemaining }} хоногийн дараа</span>
                                <span v-else>Хугацаа дууссан</span>
                            </div>
                        </div>

                        <div class="flex gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                            <UButton label="Багц өөрчлөх" color="primary" size="sm" to="/dashboard/plans" />
                            <UButton label="Нэхэмжлэх" color="neutral" variant="outline" size="sm" to="/dashboard/history" />
                            <UButton
                                v-if="isActive && subscription.plan?.slug !== 'free'"
                                label="Цуцлах"
                                color="error"
                                variant="ghost"
                                size="sm"
                                @click="showCancelModal = true"
                            />
                        </div>
                    </div>

                    <!-- Usage -->
                    <div class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5">
                        <h3 class="text-sm font-bold text-[var(--text-heading)] mb-4">Хэрэглээ</h3>
                        <div class="space-y-3.5">
                            <div v-for="item in usageItems" :key="item.label">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-sm text-[var(--text-body)]">{{ item.label }}</span>
                                    <span class="text-xs text-[var(--text-muted)]">
                                        <template v-if="item.isStorage">{{ formatStorage(item.current) }} / {{ formatStorage(item.max) }}</template>
                                        <template v-else>{{ item.current.toLocaleString() }} / {{ formatLimit(item.max) }}</template>
                                    </span>
                                </div>
                                <UProgress :model-value="item.percent" :color="progressColor(item.percent)" size="xs" />
                            </div>
                        </div>
                    </div>

                    <!-- Features -->
                    <div class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5">
                        <h3 class="text-sm font-bold text-[var(--text-heading)] mb-3">Багцын боломжууд</h3>
                        <div class="grid grid-cols-2 gap-2">
                            <div v-for="item in featureItems" :key="item.label" class="flex items-center gap-2 text-sm">
                                <UIcon
                                    :name="item.on ? 'i-lucide-check' : 'i-lucide-minus'"
                                    class="size-3.5"
                                    :class="item.on ? 'text-[var(--accent-green)]' : 'text-[var(--text-placeholder)]'"
                                />
                                <span :class="item.on ? 'text-[var(--text-body)]' : 'text-[var(--text-placeholder)]'">{{ item.label }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Cancel modal -->
                    <UModal v-model:open="showCancelModal">
                        <template #content>
                            <div class="p-6">
                                <h3 class="text-lg font-bold text-[var(--text-heading)] mb-2">Захиалга цуцлах</h3>
                                <p class="text-sm text-[var(--text-muted)] mb-6">
                                    Цуцалсан ч одоогийн хугацааны төгсгөл хүртэл ашиглах боломжтой.
                                </p>
                                <div class="flex justify-end gap-2">
                                    <UButton label="Болих" color="neutral" variant="outline" @click="showCancelModal = false" />
                                    <UButton label="Цуцлах" color="error" :loading="canceling" @click="handleCancel" />
                                </div>
                            </div>
                        </template>
                    </UModal>
                </template>
            </div>
        </div>
    </div>
</template>
