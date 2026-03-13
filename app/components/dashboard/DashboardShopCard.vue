<script setup lang="ts">
interface CheckItem {
    label: string
    ok: boolean
    action?: string
}

interface Props {
    shopName?: string
    shopHandle?: string
    checks?: CheckItem[]
}

const props = withDefaults(defineProps<Props>(), {
    shopName: 'Миний дэлгүүр',
    shopHandle: '',
    checks: () => [],
})

const {
    subscription,
    loading: subLoading,
    daysRemaining,
    isTrialing,
    hasSubscription,
    fetchSubscription,
} = useSubscription()

onMounted(() => { fetchSubscription() })

const planName = computed(() => subscription.value?.plan?.name || 'Үнэгүй')

const daysColor = computed(() => {
    if (!daysRemaining.value) return ''
    if (daysRemaining.value > 7) return 'bg-[#059669]'
    if (daysRemaining.value > 3) return 'bg-[#e47a00]'
    return 'bg-[#dc2626]'
})
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden rounded-xl border border-[#e3e8ee] bg-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[#f0f4f8] px-5 py-4">
            <div class="text-[13px] font-bold text-[#1a1f36]">Дэлгүүр</div>
            <NuxtLink
                to="/dashboard/settings"
                class="flex items-center gap-1 text-[11px] font-medium text-[#697386] hover:text-[#1a1f36] transition-colors"
            >
                <UIcon name="i-lucide-settings" class="h-3.5 w-3.5" />
                Тохиргоо
            </NuxtLink>
        </div>

        <!-- Body -->
        <div class="flex flex-1 flex-col px-5 py-4 gap-3">
            <!-- Shop name -->
            <div>
                <div class="text-[15px] font-extrabold text-[#1a1f36]">{{ props.shopName }}</div>
                <div v-if="props.shopHandle" class="text-[11px] text-[#697386] mt-0.5">{{ props.shopHandle }}</div>
            </div>

            <!-- Checklist -->
            <div class="flex flex-col divide-y divide-[#f7fafc]">
                <div
                    v-for="item in props.checks"
                    :key="item.label"
                    class="flex items-center gap-2.5 py-2"
                >
                    <div
                        class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                        :class="item.ok ? 'bg-[#f0fdf4] text-[#059669]' : 'bg-[#fff8ec] text-[#b45309]'"
                    >
                        {{ item.ok ? '✓' : '!' }}
                    </div>
                    <span class="flex-1 text-[12px] text-[#4f566b]">{{ item.label }}</span>
                    <NuxtLink
                        v-if="!item.ok && item.action"
                        :to="item.action"
                        class="text-[11px] font-semibold text-[#059669] hover:text-[#047857] transition-colors"
                    >
                        Нэмэх →
                    </NuxtLink>
                </div>
            </div>

            <!-- Plan pill -->
            <div class="mt-auto">
                <div v-if="subLoading" class="h-8 w-full animate-pulse rounded-lg bg-[#f0f4f8]" />
                <template v-else-if="hasSubscription && subscription">
                    <div class="flex items-center gap-2 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2">
                        <span class="text-[11px] font-bold text-[#059669]">⚡ {{ planName }}</span>
                        <template v-if="daysRemaining > 0">
                            <span class="h-1.5 w-1.5 rounded-full flex-shrink-0" :class="daysColor" />
                            <span class="text-[11px] text-[#697386]">
                                {{ isTrialing ? 'Туршилт ·' : '' }} {{ daysRemaining }} хоног үлдсэн
                            </span>
                        </template>
                        <NuxtLink
                            to="/dashboard/billing"
                            class="ml-auto text-[11px] font-semibold text-[#697386] hover:text-[#1a1f36] transition-colors"
                        >
                            Удирдах →
                        </NuxtLink>
                    </div>
                </template>
                <template v-else>
                    <NuxtLink
                        to="/pricing"
                        class="flex items-center justify-center gap-1.5 rounded-lg border border-[#059669] px-3 py-2 text-[12px] font-bold text-[#059669] hover:bg-[#f0fdf4] transition-colors"
                    >
                        Багц авах →
                    </NuxtLink>
                </template>
            </div>
        </div>
    </div>
</template>
