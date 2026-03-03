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
    if (authCheck.value) {
        await fetchSubscription()
    }
})

function formatPrice(price: number): string {
    return price.toLocaleString()
}

function getYearlyDiscount(plan: Plan): number {
    if (plan.monthly_price === 0) return 0
    const fullYearlyPrice = plan.monthly_price * 12
    const discount = ((fullYearlyPrice - plan.yearly_price) / fullYearlyPrice) * 100
    return Math.round(discount)
}

function getPlanFeatures(plan: Plan): { label: string; included: boolean }[] {
    return [
        {
            label:
                plan.limits.max_products === -1
                    ? 'Хязгааргүй бараа'
                    : `${plan.limits.max_products} бараа`,
            included: true
        },
        {
            label:
                plan.limits.max_orders_per_month === -1
                    ? 'Хязгааргүй захиалга'
                    : `Сард ${plan.limits.max_orders_per_month} захиалга`,
            included: true
        },
        {
            label:
                plan.limits.max_shops === -1
                    ? 'Хязгааргүй дэлгүүр'
                    : `${plan.limits.max_shops} дэлгүүр`,
            included: true
        },
        {
            label:
                plan.limits.max_storage_mb === -1
                    ? 'Хязгааргүй хадгалах зай'
                    : plan.limits.max_storage_mb >= 1000
                      ? `${plan.limits.max_storage_mb / 1000} GB хадгалах зай`
                      : `${plan.limits.max_storage_mb} MB хадгалах зай`,
            included: true
        },
        {
            label: 'Facebook Live холболт',
            included: plan.features.facebook_live
        },
        {
            label: 'Дэлгэрэнгүй тайлан',
            included: plan.features.advanced_analytics
        },
        {
            label: 'Өөрийн лого, брэнд',
            included: plan.features.custom_branding
        },
        {
            label: 'Тэргүүлэх дэмжлэг',
            included: plan.features.priority_support
        },
        {
            label: 'API хандалт',
            included: plan.features.api_access
        },
        {
            label: 'Автомат хариулагч',
            included: plan.features.automation
        }
    ]
}

function isPopularPlan(plan: Plan): boolean {
    return plan.slug === 'pro'
}

function isCurrentPlan(plan: Plan): boolean {
    return subscription.value?.plan?.slug === plan.slug
}

async function handlePlanSelect(plan: Plan, billingCycle?: BillingCycle) {
    if (!authCheck.value) {
        router.push('/login?redirect=/pricing')
        return
    }

    if (isCurrentPlan(plan)) {
        return
    }

    if (plan.slug === 'free') {
        router.push('/dashboard')
        return
    }

    const cycle = billingCycle || (isYearly.value ? 'yearly' : 'monthly')
    startingTrial.value = plan.slug

    try {
        await purchasePlan(plan.slug, cycle)
        showPaymentModal.value = true
    } catch (e: any) {
        toast.add({
            title: 'Алдаа',
            description: e.data?.error || 'Төлбөр үүсгэхэд алдаа гарлаа.',
            icon: 'i-lucide-x',
            color: 'error'
        })
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
            toast.add({
                title: 'Амжилттай!',
                description: 'Төлбөр баталгаажлаа. Таны багц идэвхжлээ.',
                icon: 'i-lucide-check',
                color: 'success'
            })
            router.push('/dashboard')
        } else {
            toast.add({
                title: 'Төлбөр хүлээгдэж байна',
                description: 'Төлбөр хараахан ирээгүй байна. Дахин шалгана уу.',
                icon: 'i-lucide-clock',
                color: 'warning'
            })
        }
    } catch {
        // Error handled in composable
    }
}

const trustPoints = [
    { icon: 'i-lucide-shield-check', label: 'Аюулгүй төлбөр' },
    { icon: 'i-lucide-clock', label: '30 хоног үнэгүй' },
    { icon: 'i-lucide-rotate-ccw', label: 'Хүссэн үед цуцлах' },
    { icon: 'i-lucide-credit-card', label: 'Карт шаардлагагүй' }
]
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="plans" :ui="{ body: 'lg:py-12' }">
            <template #header>
                <UDashboardNavbar title="Багц сонгох">
                    <template #leading>
                        <UDashboardSidebarCollapse />
                    </template>
                </UDashboardNavbar>

                <UDashboardToolbar>
                    <UNavigationMenu
                        :items="[
                            [
                                {
                                    label: 'Төлбөр',
                                    icon: 'i-lucide-credit-card',
                                    to: '/dashboard/billing',
                                    exact: true
                                },
                                {
                                    label: 'Багц сонгох',
                                    icon: 'i-lucide-crown',
                                    to: '/dashboard/plans'
                                },
                                {
                                    label: 'Түүх',
                                    icon: 'i-lucide-history',
                                    to: '/dashboard/history'
                                }
                            ]
                        ]"
                        highlight
                        class="-mx-1 flex-1"
                    />
                </UDashboardToolbar>
            </template>
            <template #body>
                <!-- Background decoration -->
                <div class="fixed inset-0 pointer-events-none overflow-hidden">
                    <div
                        class="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
                        style="
                            background: radial-gradient(
                                circle,
                                rgba(14, 165, 233, 0.2) 0%,
                                transparent 70%
                            );
                        "
                    />
                    <div
                        class="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-30"
                        style="
                            background: radial-gradient(
                                circle,
                                rgba(6, 182, 212, 0.15) 0%,
                                transparent 70%
                            );
                        "
                    />
                </div>

                <!-- Hero Section -->
                <section class="relative py-10 md:py-14">
                    <UContainer class="max-w-7xl">
                        <div class="text-center max-w-3xl mx-auto">
                            <!-- Billing Toggle -->
                            <div
                                class="inline-flex items-center gap-1 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"
                            >
                                <button
                                    class="relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300"
                                    :class="
                                        !isYearly
                                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    "
                                    @click="isYearly = false"
                                >
                                    Сараар
                                </button>
                                <button
                                    class="relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2"
                                    :class="
                                        isYearly
                                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    "
                                    @click="isYearly = true"
                                >
                                    Жилээр
                                    <span
                                        class="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                                    >
                                        -20%
                                    </span>
                                </button>
                            </div>

                            <!-- Trust points -->
                            <div class="flex flex-wrap justify-center gap-6 mt-10">
                                <div
                                    v-for="point in trustPoints"
                                    :key="point.label"
                                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                >
                                    <UIcon :name="point.icon" class="w-5 h-5 text-green-500" />
                                    <span>{{ point.label }}</span>
                                </div>
                            </div>
                        </div>
                    </UContainer>
                </section>

                <!-- Pricing Cards Section -->
                <section class="pb-24 relative">
                    <UContainer class="max-w-7xl">
                        <!-- Loading -->
                        <div v-if="loading" class="flex justify-center items-center py-20">
                            <div class="flex items-center gap-3">
                                <UIcon
                                    name="i-lucide-loader-2"
                                    class="w-8 h-8 animate-spin text-primary-500"
                                />
                                <span class="text-gray-500">Ачааллаж байна...</span>
                            </div>
                        </div>

                        <!-- Pricing Cards -->
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div
                                v-for="plan in plans"
                                :key="plan.slug"
                                class="relative flex flex-col rounded-2xl transition-all duration-300"
                                :class="[
                                    isPopularPlan(plan)
                                        ? 'pricing-popular bg-white dark:bg-gray-900 scale-[1.02] z-10 shadow-xl'
                                        : 'bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg',
                                    isCurrentPlan(plan)
                                        ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-950'
                                        : ''
                                ]"
                            >
                                <!-- Popular Badge -->
                                <div
                                    v-if="isPopularPlan(plan)"
                                    class="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                                >
                                    <span
                                        class="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg"
                                    >
                                        <UIcon name="i-lucide-star" class="w-3.5 h-3.5" />
                                        Хамгийн түгээмэл
                                    </span>
                                </div>

                                <!-- Current Plan Badge -->
                                <div
                                    v-if="isCurrentPlan(plan)"
                                    class="absolute -top-4 right-4 z-20"
                                >
                                    <span
                                        class="inline-flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                                    >
                                        <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
                                        Одоогийн
                                    </span>
                                </div>

                                <!-- Card Content -->
                                <div class="p-8 flex-1 flex flex-col relative z-10">
                                    <!-- Plan Name & Description -->
                                    <div class="mb-6">
                                        <h3
                                            class="text-xl font-bold text-gray-900 dark:text-white mb-2"
                                        >
                                            {{ plan.name }}
                                        </h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            {{ plan.description }}
                                        </p>
                                    </div>

                                    <!-- Price -->
                                    <div class="mb-8">
                                        <div class="flex items-baseline gap-1">
                                            <span
                                                class="text-4xl font-extrabold text-gray-900 dark:text-white"
                                            >
                                                ₮{{
                                                    formatPrice(
                                                        isYearly
                                                            ? Math.round(plan.yearly_price / 12)
                                                            : plan.monthly_price
                                                    )
                                                }}
                                            </span>
                                            <span
                                                class="text-gray-500 dark:text-gray-400 font-medium"
                                                >/сар</span
                                            >
                                        </div>

                                        <!-- Yearly savings info -->
                                        <div
                                            v-if="isYearly && plan.monthly_price > 0"
                                            class="mt-2 space-y-1"
                                        >
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm text-gray-400 line-through">
                                                    ₮{{ formatPrice(plan.monthly_price * 12) }}/жил
                                                </span>
                                                <span
                                                    class="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full"
                                                >
                                                    -{{ getYearlyDiscount(plan) }}%
                                                </span>
                                            </div>
                                            <div
                                                class="text-sm text-primary-600 dark:text-primary-400 font-medium"
                                            >
                                                ₮{{ formatPrice(plan.yearly_price) }}/жил
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Features -->
                                    <ul class="space-y-3.5 mb-8 flex-1">
                                        <li
                                            v-for="feature in getPlanFeatures(plan)"
                                            :key="feature.label"
                                            class="flex items-start gap-3 text-sm"
                                        >
                                            <div
                                                class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                                :class="
                                                    feature.included
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : 'bg-gray-100 dark:bg-gray-800'
                                                "
                                            >
                                                <UIcon
                                                    :name="
                                                        feature.included
                                                            ? 'i-lucide-check'
                                                            : 'i-lucide-minus'
                                                    "
                                                    class="w-3 h-3"
                                                    :class="
                                                        feature.included
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-gray-400 dark:text-gray-600'
                                                    "
                                                />
                                            </div>
                                            <span
                                                :class="
                                                    feature.included
                                                        ? 'text-gray-700 dark:text-gray-300'
                                                        : 'text-gray-400 dark:text-gray-500'
                                                "
                                            >
                                                {{ feature.label }}
                                            </span>
                                        </li>
                                    </ul>

                                    <!-- CTA Button -->
                                    <UButton
                                        :class="[
                                            isPopularPlan(plan)
                                                ? 'bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 relative z-20'
                                                : '',
                                            isCurrentPlan(plan)
                                                ? 'opacity-60 cursor-not-allowed'
                                                : ''
                                        ]"
                                        :color="isPopularPlan(plan) ? 'primary' : 'neutral'"
                                        :variant="
                                            plan.slug === 'free' || isCurrentPlan(plan)
                                                ? 'outline'
                                                : 'solid'
                                        "
                                        :disabled="isCurrentPlan(plan)"
                                        :loading="startingTrial === plan.slug"
                                        block
                                        size="lg"
                                        class="font-semibold transition-all duration-300"
                                        @click="handlePlanSelect(plan)"
                                    >
                                        <template v-if="isCurrentPlan(plan)">
                                            <UIcon name="i-lucide-check" class="w-4 h-4 mr-2" />
                                            Одоогийн багц
                                        </template>
                                        <template v-else-if="plan.slug === 'free'">
                                            Үнэгүй эхлэх
                                        </template>
                                        <template v-else>
                                            <span class="relative z-10">Багц авах</span>
                                            <UIcon
                                                name="i-lucide-arrow-right"
                                                class="w-4 h-4 ml-2 relative z-10"
                                            />
                                        </template>
                                    </UButton>

                                    <!-- Trial info -->
                                    <p
                                        v-if="plan.trial_days > 0 && !isCurrentPlan(plan)"
                                        class="text-center text-xs text-gray-500 mt-3"
                                    >
                                        {{ plan.trial_days }} хоногийн үнэгүй туршилт
                                    </p>
                                </div>
                            </div>
                        </div>
                    </UContainer>
                </section>

                <!-- Payment Modal -->
                <BillingPaymentModal
                    :open="showPaymentModal"
                    :invoice="currentInvoice"
                    :checking="checkingPayment"
                    @update:open="showPaymentModal = $event"
                    @check-payment="handleCheckPayment"
                />
            </template>
        </UDashboardPanel>
    </div>
</template>
