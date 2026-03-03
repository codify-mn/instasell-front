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

export const useDashboardData = () => {
    const config = useRuntimeConfig()

    const orderStats = ref<OrderStats | null>(null)
    const productStats = ref<ProductStats>({ total: 0, active: 0 })
    const customerStats = ref<CustomerStats>({ total: 0, this_month: 0 })
    const isLoading = ref(true)
    const error = ref<string | null>(null)
    const lives = ref<any[]>([])

    const fetchOrderStats = async () => {
        try {
            const data = await $fetch<OrderStats>(`${config.public.apiUrl}/api/orders/stats`, {
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
                {
                    credentials: 'include'
                }
            )
            productStats.value = {
                total: data.total || 0,
                active: data.total || 0
            }
        } catch (err: any) {
            console.error('Failed to fetch product stats:', err)
        }
    }

    const fetchLives = async () => {
        try {
            const data = await $fetch<{ lives: any[]; total: number }>(
                `${config.public.apiUrl}/api/lives?limit=1`,
                {
                    credentials: 'include'
                }
            )
            lives.value = data.lives
        } catch (err: any) {
            console.error('Failed to fetch lives:', err)
        }
    }

    const revenueChart = ref<{ label: string; value: number }[]>([])

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

    const fetchAll = async () => {
        isLoading.value = true
        error.value = null

        try {
            await Promise.all([fetchOrderStats(), fetchProductStats(), fetchRevenueChart()])
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
        revenueChart,
        isLoading,
        error,
        lives,
        fetchAll,
        fetchOrderStats,
        fetchProductStats,
        fetchRevenueChart,
        fetchLives
    }
}
