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
    if (daysRemaining.value > 7) return 'bg-[var(--accent-green)]'
    if (daysRemaining.value > 3) return 'bg-[var(--accent-warn)]'
    return 'bg-[var(--accent-error)]'
})
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] shadow-sm card-hover">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
            <div class="text-sm font-bold text-[var(--text-heading)]">Дэлгүүр</div>
            <NuxtLink
                to="/dashboard/settings"
                class="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
            >
                <UIcon name="i-lucide-settings" class="h-3.5 w-3.5" />
                Тохиргоо
            </NuxtLink>
        </div>

        <!-- Body -->
        <div class="flex flex-1 flex-col px-5 py-4 gap-3">
            <!-- Shop name -->
            <div>
                <div class="text-sm font-extrabold text-[var(--text-heading)]">{{ props.shopName }}</div>
                <div v-if="props.shopHandle" class="text-xs text-[var(--text-muted)] mt-0.5">{{ props.shopHandle }}</div>
            </div>

            <!-- Checklist -->
            <div class="flex flex-col divide-y divide-[var(--border-subtle)]">
                <div
                    v-for="item in props.checks"
                    :key="item.label"
                    class="flex items-center gap-2.5 py-2"
                >
                    <div
                        class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                        :class="item.ok ? 'bg-[var(--accent-green-light)] text-[var(--accent-green)]' : 'bg-[var(--accent-warn-light)] text-[var(--accent-warn-dark)]'"
                    >
                        {{ item.ok ? '✓' : '!' }}
                    </div>
                    <span class="flex-1 text-xs text-[var(--text-body)]">{{ item.label }}</span>
                    <NuxtLink
                        v-if="!item.ok && item.action"
                        :to="item.action"
                        class="text-xs font-semibold text-[var(--text-body)] hover:text-[var(--text-heading)] transition-colors"
                    >
                        Нэмэх →
                    </NuxtLink>
                </div>
            </div>

            <!-- Plan pill -->
            <div class="mt-auto">
                <div v-if="subLoading" class="h-8 w-full animate-pulse rounded-lg bg-[var(--border-subtle)]" />
                <template v-else-if="hasSubscription && subscription">
                    <div class="flex items-center gap-2 rounded-lg border border-[var(--accent-green-border)] bg-[var(--accent-green-light)] px-3 py-2">
                        <span class="text-xs font-bold text-[var(--accent-green)]">{{ planName }}</span>
                        <template v-if="daysRemaining > 0">
                            <span class="h-1.5 w-1.5 rounded-full flex-shrink-0" :class="daysColor" />
                            <span class="text-xs text-[var(--text-muted)]">
                                {{ isTrialing ? 'Туршилт ·' : '' }} {{ daysRemaining }} хоног үлдсэн
                            </span>
                        </template>
                        <NuxtLink
                            to="/dashboard/billing"
                            class="ml-auto text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
                        >
                            Удирдах →
                        </NuxtLink>
                    </div>
                </template>
                <template v-else>
                    <NuxtLink
                        to="/pricing"
                        class="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--accent-green)] px-3 py-2 text-xs font-bold text-[var(--accent-green)] hover:bg-[var(--accent-green-light)] transition-colors"
                    >
                        Багц авах →
                    </NuxtLink>
                </template>
            </div>
        </div>
    </div>
</template>
