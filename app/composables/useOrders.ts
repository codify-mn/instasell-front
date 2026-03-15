import type { Product, ProductVariant } from './useProducts'
import type { ShopData } from './useShopSettings'

// Order status matches backend orderman.OrderStatus
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

// Payment method matches backend orderman.PaymentMethod
export type PaymentMethod = 'qpay' | 'cash' | 'bank_transfer' | 'card'

export interface Customer {
    id: number
    facebook_id?: string
    facebook_name?: string
    name: string
    phone_number: string
    phone_number_secondary?: string
    email?: string
    address?: string
    city?: string
    district?: string
    apartment?: string
    description?: string
    shop_id: number
    notes?: string
    created_at: string
    updated_at: string
}

export interface OrderMetadata {
    facebook_comment_id?: string
    facebook_post_id?: string
    facebook_page_id?: string
    source?: string
    ip_address?: string
    user_agent?: string
    delivery_date?: string
    delivery_time?: string
    seller_notes?: string
    invoice_url?: string
    tracking_number?: string
}

export interface OrderItemProduct {
    id: number
    name: string
    images?: string[]
}

export interface OrderItem {
    id: number
    order_id: number
    product_id: number
    product?: OrderItemProduct
    variant_id?: number
    sku: string
    name: string
    options?: string
    price: number
    quantity: number
    subtotal: number
    created_at: string
    updated_at: string
}

export interface OrderQPayData {
    invoice_id: string
    invoice_url: string
    qr_text: string
    qr_image: string
    deep_links: QPayDeepLink[]
    created_at?: string
    paid_at?: string
}

export interface Order {
    id: number
    shop_id: number
    customer_id: number
    customer?: Customer
    order_number: string
    status: OrderStatus
    subtotal: number
    shipping_fee: number
    discount: number
    total_amount: number
    currency: string
    payment_method: PaymentMethod
    metadata: OrderMetadata
    qpay?: OrderQPayData
    items: OrderItem[]
    checkout_token?: string
    expires_at?: string
    shop?: ShopData
    created_at: string
    updated_at: string
}

export interface OrdersResponse {
    orders: Order[]
    total: number
}

export interface OrderFilter {
    keyword?: string
    status?: string
    date_from?: string
    date_to?: string
    sort_by?: string
    sort_dir?: string
    page?: number
    size?: number
}

export interface CreateOrderItemInput {
    product_id: number
    variant_id?: number
    sku: string
    name: string
    options?: string
    price: number
    quantity: number
}

export interface CreateOrderInput {
    // Customer info (flat structure as expected by backend)
    customer_id?: number
    customer_name: string
    customer_phone: string
    customer_facebook_id?: string
    customer_email?: string
    customer_address?: string
    customer_city?: string
    customer_district?: string
    customer_apartment?: string
    // Order items and details
    items: CreateOrderItemInput[]
    shipping_fee?: number
    discount?: number
    payment_method: PaymentMethod
    metadata?: OrderMetadata
}

// Cart item used in order creation UI
export interface CartItem {
    product: Product
    variant?: ProductVariant
    quantity: number
}

export function useOrders() {
    const config = useRuntimeConfig()
    const apiUrl = config.public.apiUrl

    const fetchOrders = async (filter: OrderFilter = {}): Promise<OrdersResponse> => {
        const params = new URLSearchParams()
        if (filter.keyword) params.set('keyword', filter.keyword)
        if (filter.status) params.set('status', filter.status)
        if (filter.date_from) params.set('date_from', filter.date_from)
        if (filter.date_to) params.set('date_to', filter.date_to)
        if (filter.sort_by) params.set('sort_by', filter.sort_by)
        if (filter.sort_dir) params.set('sort_dir', filter.sort_dir)
        if (filter.page) params.set('page', filter.page.toString())
        if (filter.size) params.set('size', filter.size.toString())

        const query = params.toString()
        const url = `${apiUrl}/api/orders${query ? `?${query}` : ''}`

        return await $fetch<OrdersResponse>(url, {
            credentials: 'include'
        })
    }

    const fetchOrder = async (id: number): Promise<Order> => {
        return await $fetch<Order>(`${apiUrl}/api/orders/${id}`, {
            credentials: 'include'
        })
    }

    const createOrder = async (data: CreateOrderInput): Promise<Order> => {
        return await $fetch<Order>(`${apiUrl}/api/orders`, {
            method: 'POST',
            credentials: 'include',
            body: data
        })
    }

    const updateOrderStatus = async (id: number, status: OrderStatus): Promise<Order> => {
        return await $fetch<Order>(`${apiUrl}/api/orders/${id}/status`, {
            method: 'PATCH',
            credentials: 'include',
            body: { status }
        })
    }

    const cancelOrder = async (id: number, reason?: string): Promise<Order> => {
        return await $fetch<Order>(`${apiUrl}/api/orders/${id}/cancel`, {
            method: 'POST',
            credentials: 'include',
            body: { reason }
        })
    }

    const fetchOrderStats = async (): Promise<OrderStats> => {
        return await $fetch<OrderStats>(`${apiUrl}/api/orders/stats`, {
            credentials: 'include'
        })
    }

    const fetchRecentOrders = async (limit: number = 5): Promise<Order[]> => {
        const response = await $fetch<{ orders: Order[] }>(
            `${apiUrl}/api/orders/recent?limit=${limit}`,
            {
                credentials: 'include'
            }
        )
        return response.orders || []
    }

    const searchCustomerByPhone = async (phone: string): Promise<Customer | null> => {
        const response = await $fetch<{ customer: Customer | null }>(
            `${apiUrl}/api/customers/search?phone=${encodeURIComponent(phone)}`,
            { credentials: 'include' }
        )
        return response.customer
    }

    const fetchPublicOrder = async (token: string): Promise<Order> => {
        return await $fetch<Order>(`${apiUrl}/api/checkout/${token}`)
    }

    const fetchUpsellProducts = async (token: string): Promise<Product[]> => {
        const response = await $fetch<{ products: Product[] }>(
            `${apiUrl}/api/checkout/${token}/upsells`
        )
        return response.products || []
    }

    const completePublicCheckout = async (
        token: string,
        data: any
    ): Promise<{ order: Order; qpay?: OrderQPayData }> => {
        return await $fetch<{ order: Order; qpay?: OrderQPayData }>(
            `${apiUrl}/api/checkout/${token}/complete`,
            {
                method: 'POST',
                body: data
            }
        )
    }

    const checkPaymentStatus = async (
        token: string
    ): Promise<{ status: OrderStatus; qpay?: OrderQPayData }> => {
        return await $fetch<{ status: OrderStatus; qpay?: OrderQPayData }>(
            `${apiUrl}/api/checkout/${token}/payment-status`
        )
    }

    // CSV Export
    const exportOrdersCSV = async (params: {
        status?: string
        keyword?: string
        ids?: number[]
    }): Promise<void> => {
        const query = new URLSearchParams()
        if (params.status) query.set('status', params.status)
        if (params.keyword) query.set('keyword', params.keyword)
        if (params.ids?.length) query.set('ids', params.ids.join(','))

        const queryStr = query.toString()
        const url = `${apiUrl}/api/orders/export/csv${queryStr ? `?${queryStr}` : ''}`

        try {
            const response = await fetch(url, { credentials: 'include' })
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.setAttribute('download', `захиалга_${new Date().toISOString().slice(0, 10)}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(blobUrl)
        } catch {
            throw new Error('CSV татахад алдаа гарлаа')
        }
    }

    // CSV Import
    const downloadOrderImportTemplate = async (): Promise<void> => {
        const url = `${apiUrl}/api/orders/import/template`
        try {
            const response = await fetch(url, { credentials: 'include' })
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.setAttribute('download', 'захиалга_загвар.csv')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(blobUrl)
        } catch {
            throw new Error('Загвар татахад алдаа гарлаа')
        }
    }

    const importOrdersCSV = async (file: File): Promise<{ created: number; errors: string[]; total: number }> => {
        const formData = new FormData()
        formData.append('file', file)

        return await $fetch<{ created: number; errors: string[]; total: number }>(
            `${apiUrl}/api/orders/import`,
            {
                method: 'POST',
                credentials: 'include',
                body: formData
            }
        )
    }

    // Helper functions for display
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('mn-MN').format(price) + '₮'
    }

    const getStatusLabel = (status: OrderStatus): string => {
        const labels: Record<OrderStatus, string> = {
            pending: 'Хүлээгдэж байна',
            paid: 'Төлсөн',
            shipped: 'Илгээсэн',
            delivered: 'Хүргэсэн',
            cancelled: 'Цуцлагдсан',
            refunded: 'Буцаагдсан'
        }
        return labels[status] || status
    }

    const getStatusColor = (
        status: OrderStatus
    ): 'warning' | 'info' | 'success' | 'error' | 'neutral' => {
        const colors: Record<OrderStatus, 'warning' | 'info' | 'success' | 'error' | 'neutral'> = {
            pending: 'warning',
            paid: 'success',
            shipped: 'info',
            delivered: 'success',
            cancelled: 'error',
            refunded: 'neutral'
        }
        return colors[status] || 'neutral'
    }

    const getPaymentMethodLabel = (method: PaymentMethod): string => {
        const labels: Record<PaymentMethod, string> = {
            qpay: 'QPay',
            cash: 'Бэлнээр',
            bank_transfer: 'Банк шилжүүлэг',
            card: 'Карт'
        }
        return labels[method] || method
    }

    return {
        fetchOrders,
        fetchOrder,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        fetchOrderStats,
        fetchRecentOrders,
        exportOrdersCSV,
        downloadOrderImportTemplate,
        importOrdersCSV,
        formatPrice,
        getStatusLabel,
        getStatusColor,
        getPaymentMethodLabel,
        searchCustomerByPhone,
        fetchPublicOrder,
        fetchUpsellProducts,
        completePublicCheckout,
        checkPaymentStatus
    }
}
