<script setup lang="ts">
import type { Plan, BillingCycle } from '~/types/subscription'

const props = defineProps<{
    plans: Plan[]
    currentPlanSlug?: string
    isYearly: boolean
    loading?: boolean
    purchaseLoading?: string | null
}>()

const emit = defineEmits<{
    select: [plan: Plan, billingCycle: BillingCycle]
}>()

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
    return props.currentPlanSlug === plan.slug
}

function handleSelect(plan: Plan) {
    const cycle: BillingCycle = props.isYearly ? 'yearly' : 'monthly'
    emit('select', plan, cycle)
}
</script>

<template>
    <div>
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center py-20">
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
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
                <div v-if="isPopularPlan(plan)" class="absolute -top-4 left-1/2 -translate-x-1/2">
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
                            <span class="text-4xl font-extrabold text-gray-900 dark:text-white">
                                ₮{{
                                    formatPrice(
                                        isYearly
                                            ? Math.round(plan.yearly_price / 12)
                                            : plan.monthly_price
                                    )
                                }}
                            </span>
                            <span class="text-gray-500 dark:text-gray-400 font-medium">/сар</span>
                        </div>

                        <!-- Yearly savings info -->
                        <div v-if="isYearly && plan.monthly_price > 0" class="mt-2 space-y-1">
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
                            <div class="text-sm text-primary-600 dark:text-primary-400 font-medium">
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
                                    :name="feature.included ? 'i-lucide-check' : 'i-lucide-minus'"
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
                        :variant="plan.slug === 'free' || isCurrentPlan(plan) ? 'outline' : 'solid'"
                        :disabled="isCurrentPlan(plan) || !plan.is_active"
                        :loading="purchaseLoading === plan.slug"
                        block
                        size="lg"
                        class="font-semibold transition-all duration-300"
                        @click="handleSelect(plan)"
                    >
                        <template v-if="isCurrentPlan(plan)">
                            <UIcon name="i-lucide-check" class="w-4 h-4 mr-2" />
                            Одоогийн багц
                        </template>
                        <template v-else-if="!plan.is_active"> Удахгүй </template>
                        <template v-else-if="plan.slug === 'free'"> Үнэгүй эхлэх </template>
                        <template v-else>
                            Багц авах
                            <UIcon name="i-lucide-arrow-right" class="w-4 h-4 ml-2" />
                        </template>
                    </UButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pricing-popular {
    border: 2px solid transparent;
    background-image:
        linear-gradient(white, white),
        linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%);
    background-origin: border-box;
    background-clip: padding-box, border-box;
}

.dark .pricing-popular {
    background-image:
        linear-gradient(#111827, #111827),
        linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%);
}
</style>
