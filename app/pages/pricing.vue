<script setup lang="ts">
import type { Plan, BillingCycle } from '~/types/subscription'

definePageMeta({
    layout: 'public'
})

useSeoMeta({
    title: 'Үнийн мэдээлэл - Instasell',
    description: 'Энгийн, ил тод үнийн бодлого. Бүх хэмжээний бизнест тохирсон багцууд.'
})

const {
    plans,
    subscription,
    loading,
    fetchPlans,
    fetchSubscription,
    purchasePlan,
    currentInvoice,
    purchaseLoading,
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

const faq = [
    {
        label: 'Багцаа сольж болох уу?',
        content:
            'Тийм, та хүссэн үедээ багцаа шинэчлэх эсвэл бууруулах боломжтой. Өөрчлөлт шууд хүчин төгөлдөр болно.'
    },
    {
        label: 'Ямар төлбөрийн хэрэгсэл хүлээн авдаг вэ?',
        content: 'Бид QPay, банкны шилжүүлэг, картын төлбөр хүлээн авдаг.'
    },
    {
        label: 'Үнэгүй туршилт байгаа юу?',
        content: 'Тийм, бүх төлбөртэй багц 30 хоногийн үнэгүй туршилттай. Карт шаардлагагүй.'
    },
    {
        label: 'Хязгаараа хэтрүүлбэл яах вэ?',
        content:
            'Хязгаартаа ойртож байгаа тухай мэдэгдэл илгээнэ. Та хүссэн үедээ багцаа шинэчилж болно.'
    }
]

const trustPoints = [
    { icon: 'i-lucide-shield-check', label: 'Аюулгүй төлбөр' },
    { icon: 'i-lucide-clock', label: '30 хоног үнэгүй' },
    { icon: 'i-lucide-rotate-ccw', label: 'Хүссэн үед цуцлах' },
    { icon: 'i-lucide-credit-card', label: 'Карт шаардлагагүй' }
]
</script>

<template>
    <div>
        <!-- Hero Section -->
        <section class="relative py-20 md:py-28 overflow-hidden">
            <!-- Background decoration -->
            <div class="absolute inset-0 -z-10">
                <div
                    class="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
                    style="
                        background: radial-gradient(
                            circle,
                            rgba(249, 115, 22, 0.2) 0%,
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

            <UContainer class="max-w-7xl">
                <div class="text-center max-w-3xl mx-auto">
                    <div
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
                    >
                        <UIcon name="i-lucide-tag" class="w-4 h-4 text-primary-500" />
                        <span class="text-sm font-medium text-primary-600 dark:text-primary-400"
                            >Үнийн мэдээлэл</span
                        >
                    </div>

                    <h1
                        class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6"
                    >
                        Энгийн, <span class="text-gradient">ил тод</span> үнэ
                    </h1>

                    <p
                        class="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto"
                    >
                        Бизнесийнхээ хэмжээнд тохирсон багцыг сонгоорой. Нуугдмал төлбөр байхгүй.
                    </p>

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
                                class="bg-gradient-to-r from-primary-500 to-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
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
                            <UIcon :name="point.icon" class="w-5 h-5 text-primary-500" />
                            <span>{{ point.label }}</span>
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Pricing Cards Section -->
        <section class="pb-24">
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
                            class="absolute -top-4 left-1/2 -translate-x-1/2"
                        >
                            <span
                                class="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg"
                            >
                                <UIcon name="i-lucide-star" class="w-3.5 h-3.5" />
                                Хамгийн түгээмэл
                            </span>
                        </div>

                        <!-- Current Plan Badge -->
                        <div v-if="isCurrentPlan(plan)" class="absolute -top-4 right-4">
                            <span
                                class="inline-flex items-center gap-1.5 bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                            >
                                <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
                                Одоогийн
                            </span>
                        </div>

                        <!-- Card Content -->
                        <div class="p-8 flex-1 flex flex-col">
                            <!-- Plan Name & Description -->
                            <div class="mb-6">
                                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
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
                                    <span class="text-gray-500 dark:text-gray-400 font-medium"
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
                                            class="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded-full"
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
                                                ? 'bg-primary-100 dark:bg-primary-900/30'
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
                                                    ? 'text-primary-600 dark:text-primary-400'
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
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40'
                                        : '',
                                    isCurrentPlan(plan) ? 'opacity-60 cursor-not-allowed' : ''
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
                                <template v-else-if="plan.slug === 'free'"> Үнэгүй эхлэх </template>
                                <template v-else>
                                    Багц авах
                                    <UIcon name="i-lucide-arrow-right" class="w-4 h-4 ml-2" />
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

        <!-- FAQ Section -->
        <section id="faq" class="py-24 bg-gray-50 dark:bg-gray-900/50">
            <UContainer class="max-w-4xl">
                <div class="text-center mb-16">
                    <div
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
                    >
                        <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-violet-500" />
                        <span class="text-sm font-medium text-violet-600 dark:text-violet-400"
                            >Түгээмэл асуултууд</span
                        >
                    </div>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Асуулт байна уу?
                    </h2>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Хамгийн түгээмэл асуултуудын хариулт
                    </p>
                </div>

                <div class="space-y-4">
                    <UAccordion
                        :items="faq"
                        :ui="{
                            item: 'bg-white dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 px-6',
                            trigger:
                                'py-5 font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors',
                            content: 'pb-5 text-gray-600 dark:text-gray-400'
                        }"
                    />
                </div>
            </UContainer>
        </section>

        <!-- Enterprise CTA Section -->
        <section class="py-24">
            <UContainer class="max-w-4xl">
                <div
                    class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900"
                >
                    <!-- Background pattern -->
                    <div class="absolute inset-0 opacity-10">
                        <div
                            class="absolute inset-0"
                            style="
                                background-image: radial-gradient(
                                    circle at 25% 25%,
                                    rgba(255, 255, 255, 0.2) 1px,
                                    transparent 1px
                                );
                                background-size: 50px 50px;
                            "
                        />
                    </div>

                    <div class="relative px-8 py-16 md:px-16 md:py-20 text-center">
                        <div
                            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-6"
                        >
                            <UIcon name="i-lucide-building-2" class="w-8 h-8 text-white" />
                        </div>

                        <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
                            Томоохон бизнест зориулсан
                        </h2>
                        <p class="text-gray-400 mb-8 max-w-xl mx-auto">
                            Тусгай шаардлага, хязгааргүй хэрэглээ, дэмжлэгийн тусгай багц авахыг
                            хүсвэл бидэнтэй холбогдоорой.
                        </p>

                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <UButton
                                size="lg"
                                class="bg-white text-gray-900 hover:bg-gray-100 border-0 font-semibold"
                            >
                                <UIcon name="i-lucide-mail" class="w-5 h-5 mr-2" />
                                Холбоо барих
                            </UButton>
                            <UButton
                                to="/docs"
                                size="lg"
                                variant="outline"
                                class="border-gray-600 text-white hover:bg-white/10"
                            >
                                Дэлгэрэнгүй үзэх
                            </UButton>
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
    </div>
</template>
