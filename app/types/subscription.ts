export interface PlanLimits {
    max_products: number // -1 = unlimited
    max_orders_per_month: number
    max_storage_mb: number
    max_shops: number
}

export interface PlanFeatures {
    facebook_live: boolean
    advanced_analytics: boolean
    custom_branding: boolean
    priority_support: boolean
    api_access: boolean
    automation: boolean
}

export interface Plan {
    id: number
    name: string
    slug: string
    description: string
    monthly_price: number
    yearly_price: number
    limits: PlanLimits
    features: PlanFeatures
    trial_days: number
    sort_order: number
    is_active: boolean
    is_default: boolean
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
export type BillingCycle = 'monthly' | 'yearly'

export interface Subscription {
    id: number
    user_id: number
    plan_id: number
    status: SubscriptionStatus
    billing_cycle: BillingCycle
    trial_end_date?: string
    current_period_start: string
    current_period_end: string
    canceled_at?: string
    plan?: Plan
}

export interface SubscriptionUsage {
    user_id: number
    product_count: number
    order_count_month: number
    storage_used_mb: number
    shop_count: number
}

export interface SubscriptionLimits {
    limits: PlanLimits
    features: PlanFeatures
    usage: SubscriptionUsage
    days_remaining: number
    status: SubscriptionStatus
}
