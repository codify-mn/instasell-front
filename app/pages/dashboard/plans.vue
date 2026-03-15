<script setup lang="ts">
import type { Plan, BillingCycle } from '~/types/subscription'

const {
    plans,
    subscription,
    loading,
    fetchPlans,
    fetchSubscription,
    purchasePlan,
    currentInvoice,
    checkingPayment,
    checkInvoicePayment
} = useSubscription()
const { isAuthenticated: authCheck } = useAuth()
const toast = useToast()
const router = useRouter()

const isYearly = ref(false)
const startingTrial = ref<string | null>(null)
const showPaymentModal = ref(false)

onMounted(async () => {
    await fetchPlans()
    if (authCheck.value) await fetchSubscription()
})

function formatPrice(price: number): string {
    return price.toLocaleString()
}

function getYearlyDiscount(plan: Plan): number {
    if (plan.monthly_price === 0) return 0
    return Math.round(((plan.monthly_price * 12 - plan.yearly_price) / (plan.monthly_price * 12)) * 100)
}

function isCurrentPlan(plan: Plan): boolean {
    return subscription.value?.plan?.slug === plan.slug
}

function isPopularPlan(plan: Plan): boolean {
    return plan.slug === 'pro'
}

function getPlanFeatures(plan: Plan): { label: string; on: boolean }[] {
    return [
        { label: plan.limits.max_products === -1 ? 'Хязгааргүй бараа' : `${plan.limits.max_products} бараа`, on: true },
        { label: plan.limits.max_orders_per_month === -1 ? 'Хязгааргүй захиалга' : `Сард ${plan.limits.max_orders_per_month} захиалга`, on: true },
        { label: plan.limits.max_storage_mb >= 1000 ? `${plan.limits.max_storage_mb / 1000} GB зай` : `${plan.limits.max_storage_mb} MB зай`, on: true },
        { label: 'Facebook Live', on: plan.features.facebook_live },
        { label: 'Дэлгэрэнгүй тайлан', on: plan.features.advanced_analytics },
        { label: 'Брэнд тохиргоо', on: plan.features.custom_branding },
        { label: 'Тэргүүлэх дэмжлэг', on: plan.features.priority_support },
        { label: 'Автомат хариулагч', on: plan.features.automation }
    ]
}

async function handlePlanSelect(plan: Plan) {
    if (!authCheck.value) { router.push('/login?redirect=/pricing'); return }
    if (isCurrentPlan(plan)) return
    if (plan.slug === 'free') { router.push('/dashboard'); return }

    const cycle: BillingCycle = isYearly.value ? 'yearly' : 'monthly'
    startingTrial.value = plan.slug
    try {
        await purchasePlan(plan.slug, cycle)
        showPaymentModal.value = true
    } catch (e: any) {
        toast.add({ title: 'Алдаа', description: e.data?.error || 'Төлбөр үүсгэхэд алдаа гарлаа.', color: 'error' })
    } finally {
        startingTrial.value = null
    }
}

async function handleCheckPayment() {
    if (!currentInvoice.value) return
    try {
        const result = await checkInvoicePayment(currentInvoice.value.id)
        if (result.is_paid) {
            showPaymentModal.value = false
            toast.add({ title: 'Амжилттай!', description: 'Багц идэвхжлээ.', color: 'primary' })
            router.push('/dashboard')
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
            <div class="max-w-5xl mx-auto px-4 sm:px-7 py-6">
                <!-- Billing toggle -->
                <div class="flex items-center justify-center mb-8">
                    <div class="inline-flex items-center gap-1 p-1 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-card)]">
                        <button
                            class="px-4 py-2 rounded-md text-sm font-medium transition-all"
                            :class="!isYearly ? 'bg-primary-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'"
                            @click="isYearly = false"
                        >
                            Сараар
                        </button>
                        <button
                            class="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
                            :class="isYearly ? 'bg-primary-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'"
                            @click="isYearly = true"
                        >
                            Жилээр
                            <span class="text-xs font-bold bg-white/20 px-1.5 py-0.5 rounded" :class="isYearly ? '' : 'bg-primary-100 text-primary-600'">-20%</span>
                        </button>
                    </div>
                </div>

                <!-- Loading skeleton -->
                <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div v-for="i in 4" :key="i" class="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5 space-y-4">
                        <div class="space-y-2">
                            <div class="h-4 w-20 rounded bg-[var(--surface-inset)] animate-pulse" />
                            <div class="h-3 w-32 rounded bg-[var(--surface-inset)] animate-pulse" />
                        </div>
                        <div class="h-7 w-28 rounded bg-[var(--surface-inset)] animate-pulse" />
                        <div class="space-y-2">
                            <div v-for="j in 6" :key="j" class="h-3 rounded bg-[var(--surface-inset)] animate-pulse" :class="j % 2 === 0 ? 'w-3/4' : 'w-full'" />
                        </div>
                        <div class="h-9 w-full rounded-md bg-[var(--surface-inset)] animate-pulse" />
                    </div>
                </div>

                <!-- Plans grid -->
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        v-for="plan in plans"
                        :key="plan.slug"
                        class="relative flex flex-col rounded-xl border bg-[var(--surface-card)] transition-all duration-200"
                        :class="[
                            isPopularPlan(plan) ? 'border-primary-500 shadow-md' : 'border-[var(--border-primary)] hover:border-[var(--border-strong)]',
                            isCurrentPlan(plan) ? 'ring-2 ring-primary-500' : ''
                        ]"
                    >
                        <!-- Popular tag -->
                        <div v-if="isPopularPlan(plan)" class="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span class="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">Түгээмэл</span>
                        </div>

                        <div class="p-5 flex-1 flex flex-col">
                            <!-- Name -->
                            <div class="mb-4">
                                <div class="flex items-center justify-between mb-1">
                                    <h3 class="text-base font-bold text-[var(--text-heading)]">{{ plan.name }}</h3>
                                    <span v-if="isCurrentPlan(plan)" class="text-xs font-semibold text-primary-500">Одоогийн</span>
                                </div>
                                <p class="text-xs text-[var(--text-muted)]">{{ plan.description }}</p>
                            </div>

                            <!-- Price -->
                            <div class="mb-5">
                                <div class="flex items-baseline gap-0.5">
                                    <span class="text-2xl font-extrabold text-[var(--text-heading)]">
                                        {{ formatPrice(isYearly ? Math.round(plan.yearly_price / 12) : plan.monthly_price) }}₮
                                    </span>
                                    <span class="text-sm text-[var(--text-muted)]">/сар</span>
                                </div>
                                <div v-if="isYearly && plan.monthly_price > 0" class="flex items-center gap-1.5 mt-1">
                                    <span class="text-xs text-[var(--text-placeholder)] line-through">{{ formatPrice(plan.monthly_price * 12) }}₮/жил</span>
                                    <span class="text-xs font-bold text-primary-500">-{{ getYearlyDiscount(plan) }}%</span>
                                </div>
                            </div>

                            <!-- Features -->
                            <ul class="space-y-2 mb-5 flex-1">
                                <li v-for="f in getPlanFeatures(plan)" :key="f.label" class="flex items-center gap-2 text-sm">
                                    <UIcon
                                        :name="f.on ? 'i-lucide-check' : 'i-lucide-minus'"
                                        class="size-3.5 shrink-0"
                                        :class="f.on ? 'text-[var(--accent-green)]' : 'text-[var(--text-placeholder)]'"
                                    />
                                    <span :class="f.on ? 'text-[var(--text-body)]' : 'text-[var(--text-placeholder)]'">{{ f.label }}</span>
                                </li>
                            </ul>

                            <!-- CTA -->
                            <UButton
                                :color="isPopularPlan(plan) ? 'primary' : 'neutral'"
                                :variant="plan.slug === 'free' || isCurrentPlan(plan) ? 'outline' : 'solid'"
                                :disabled="isCurrentPlan(plan)"
                                :loading="startingTrial === plan.slug"
                                block
                                @click="handlePlanSelect(plan)"
                            >
                                {{ isCurrentPlan(plan) ? 'Одоогийн багц' : plan.slug === 'free' ? 'Үнэгүй эхлэх' : 'Багц авах' }}
                            </UButton>

                            <p v-if="plan.trial_days > 0 && !isCurrentPlan(plan)" class="text-center text-xs text-[var(--text-muted)] mt-2">
                                {{ plan.trial_days }} хоног үнэгүй туршилт
                            </p>
                        </div>
                    </div>
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
