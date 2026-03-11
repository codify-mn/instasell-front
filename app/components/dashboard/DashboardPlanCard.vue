<script setup lang="ts">
const {
    subscription,
    usage,
    loading,
    daysRemaining,
    isTrialing,
    isActive,
    hasSubscription,
    productUsagePercent,
    fetchSubscription,
    fetchUsage,
    formatLimit
} = useSubscription()

onMounted(async () => {
    await Promise.all([fetchSubscription(), fetchUsage()])
})

const statusColor = computed(() => {
    if (!subscription.value) return 'neutral'
    switch (subscription.value.status) {
        case 'active':
            return 'success'
        case 'trialing':
            return 'info'
        case 'past_due':
            return 'warning'
        case 'canceled':
        case 'expired':
            return 'error'
        default:
            return 'neutral'
    }
})

const statusLabel = computed(() => {
    if (!subscription.value) return 'Багцгүй'
    switch (subscription.value.status) {
        case 'active':
            return 'Идэвхтэй'
        case 'trialing':
            return 'Туршилт'
        case 'past_due':
            return 'Хугацаа хэтэрсэн'
        case 'canceled':
            return 'Цуцлагдсан'
        case 'expired':
            return 'Дууссан'
        default:
            return 'Тодорхойгүй'
    }
})

const daysColor = computed(() => {
    if (daysRemaining.value > 7) return 'bg-primary-500'
    if (daysRemaining.value > 3) return 'bg-amber-500'
    return 'bg-red-500'
})
</script>

<template>
    <DashboardCard padding="lg">
        <div class="flex flex-col h-full">
            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-4">
                <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-gray-400" />
            </div>

            <!-- Has Subscription -->
            <template v-else-if="hasSubscription && subscription">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Одоогийн багц</span>
                </div>

                <div class="flex items-center gap-2 mt-2">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ subscription.plan?.name || 'Үнэгүй' }}
                    </h3>
                    <UBadge :color="statusColor" variant="subtle" size="sm">
                        {{ statusLabel }}
                    </UBadge>
                </div>

                <!-- Trial/Period Info -->
                <div v-if="isTrialing || isActive" class="flex items-center gap-1.5 mt-2 text-sm">
                    <span class="w-2 h-2 rounded-full" :class="daysColor" />
                    <span class="text-gray-600 dark:text-gray-400">
                        <template v-if="isTrialing">
                            Туршилт дуусахад {{ daysRemaining }} хоног
                        </template>
                        <template v-else> Дуусахад {{ daysRemaining }} хоног </template>
                    </span>
                </div>

                <!-- Usage Summary -->
                <div v-if="usage && subscription.plan" class="mt-3 space-y-2">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Бүтээгдэхүүн</span>
                        <span>
                            {{ usage.product_count }} /
                            {{ formatLimit(subscription.plan.limits.max_products) }}
                        </span>
                    </div>
                    <UProgress
                        v-model="productUsagePercent"
                        :color="
                            productUsagePercent >= 90
                                ? 'error'
                                : productUsagePercent >= 70
                                  ? 'warning'
                                  : 'primary'
                        "
                        size="xs"
                    />
                </div>

                <div class="mt-auto pt-4">
                    <UButton
                        v-if="subscription.plan?.slug === 'free' || isTrialing"
                        to="/dashboard/plans"
                        color="primary"
                        variant="outline"
                        block
                        icon="i-lucide-crown"
                    >
                        Багц шинэчлэх
                    </UButton>
                    <UButton
                        v-else
                        to="/dashboard/billing"
                        color="neutral"
                        variant="outline"
                        block
                        icon="i-lucide-credit-card"
                    >
                        Төлбөрийн мэдээлэл
                    </UButton>
                </div>
            </template>

            <!-- No Subscription -->
            <template v-else>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Захиалга</span>
                </div>

                <div class="flex items-center gap-2 mt-2">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Багц байхгүй</h3>
                </div>

                <p class="text-sm text-gray-500 mt-2">
                    Бүх боломжуудыг ашиглахын тулд багц сонгоорой.
                </p>

                <div class="mt-auto pt-4">
                    <UButton to="/pricing" color="primary" block icon="i-lucide-shopping-cart">
                        Багц авах
                    </UButton>
                </div>
            </template>
        </div>
    </DashboardCard>
</template>
