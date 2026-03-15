// app/composables/useDashboardData.ts
import type { FacebookPage } from '~/types'

export interface Shop {
    id: number
    name: string
    phone_number: string
    owner_id: number
    is_active: boolean
    picture: string
    description: string
    facebook_page_id: number
    facebook_page?: FacebookPage
    settings: {
        auto_reply: boolean
        reply_message: string
        payment_method: string
        comment_prefix: string
        delivery_fee: number
        delivery_note: string
        free_delivery_over: number
        bank_name: string
        bank_account_number: string
        bank_account_name: string
        bank_account?: { bank_name: string; bank_code: string; account_number: string; account_name: string; note: string }
    }
    qpay: {
        is_registered: boolean
        merchant_id: string | null
        merchant_type: string | null
        bank_account: {
            acconunt_bank_code: string
            account_number: string
            account_name: string
            is_default: boolean
        }
    }
}

export interface OrderStats {
    total_orders: number
    pending_orders: number
    delivered_orders: number
    cancelled_orders: number
    total_revenue: number
    average_order_value: number
}

export interface ProductStats {
    total: number
    active: number
}

export interface CustomerStats {
    total: number
    this_month: number
}

export interface ConversionStats {
    comments_processed: number
    orders_created: number
    orders_paid: number
    paid_revenue: number
    conversion_rate: number
    live_comments: number
    post_comments: number
    live_orders_created: number
    post_orders_created: number
    manual_orders_created: number
}

export const useDashboardData = () => {
    const config = useRuntimeConfig()

    const orderStats = ref<OrderStats | null>(null)
    const productStats = ref<ProductStats>({ total: 0, active: 0 })
    const customerStats = ref<CustomerStats>({ total: 0, this_month: 0 })
    const conversionStats = ref<ConversionStats | null>(null)
    const revenueChart = ref<{ label: string; value: number }[]>([])
    const isLoading = ref(true)
    const error = ref<string | null>(null)

    const fetchOrderStats = async (days?: number) => {
        try {
            const url = days
                ? `${config.public.apiUrl}/api/orders/stats?days=${days}`
                : `${config.public.apiUrl}/api/orders/stats`
            const data = await $fetch<OrderStats>(url, {
                credentials: 'include'
            })
            orderStats.value = data
        } catch (err: any) {
            console.error('Failed to fetch order stats:', err)
        }
    }

    const fetchProductStats = async () => {
        try {
            const data = await $fetch<{ products: any[]; total: number }>(
                `${config.public.apiUrl}/api/products?limit=1`,
                { credentials: 'include' }
            )
            productStats.value = { total: data.total || 0, active: data.total || 0 }
        } catch (err: any) {
            console.error('Failed to fetch product stats:', err)
        }
    }

    const fetchCustomerStats = async () => {
        try {
            const data = await $fetch<{ customers: any[]; total: number }>(
                `${config.public.apiUrl}/api/customers?size=1`,
                { credentials: 'include' }
            )
            customerStats.value = { total: data.total || 0, this_month: 0 }
        } catch (err: any) {
            console.error('Failed to fetch customer stats:', err)
        }
    }

    const fetchConversionStats = async (days?: number) => {
        try {
            const url = days
                ? `${config.public.apiUrl}/api/dashboard/conversion?days=${days}`
                : `${config.public.apiUrl}/api/dashboard/conversion`
            const data = await $fetch<ConversionStats>(url, {
                credentials: 'include'
            })
            conversionStats.value = data
        } catch (err: any) {
            console.error('Failed to fetch conversion stats:', err)
        }
    }

    const fetchRevenueChart = async (days: number = 7) => {
        try {
            const data = await $fetch<{ label: string; value: number }[]>(
                `${config.public.apiUrl}/api/dashboard/revenue-chart?days=${days}`,
                { credentials: 'include' }
            )
            revenueChart.value = data || []
        } catch (err: any) {
            console.error('Failed to fetch revenue chart:', err)
        }
    }

    const fetchAll = async (days: number = 7) => {
        isLoading.value = true
        error.value = null
        try {
            await Promise.all([
                fetchOrderStats(days),
                fetchProductStats(),
                fetchCustomerStats(),
                fetchConversionStats(days),
                fetchRevenueChart(days),
            ])
        } catch (err: any) {
            error.value = 'Failed to load dashboard data'
        } finally {
            isLoading.value = false
        }
    }

    return {
        orderStats,
        productStats,
        customerStats,
        conversionStats,
        revenueChart,
        isLoading,
        error,
        fetchAll,
        fetchOrderStats,
        fetchProductStats,
        fetchCustomerStats,
        fetchConversionStats,
        fetchRevenueChart,
    }
}
