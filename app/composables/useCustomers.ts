import type { Customer, Order } from './useOrders'

export interface CustomerWithStats extends Customer {
    order_count: number
    total_spent: number
    last_order_at?: string
}

export interface CustomersResponse {
    customers: CustomerWithStats[]
    total: number
    page: number
    size: number
}

export interface CustomerDetail {
    customer: Customer
    order_count: number
    total_spent: number
}

export interface CustomerOrdersResponse {
    orders: Order[]
    total: number
    page: number
    size: number
}

export function useCustomers() {
    const config = useRuntimeConfig()
    const apiUrl = config.public.apiUrl

    const listCustomers = async (
        page: number = 1,
        search: string = '',
        size: number = 20
    ): Promise<CustomersResponse> => {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('size', size.toString())
        if (search) params.set('search', search)

        return await $fetch<CustomersResponse>(
            `${apiUrl}/api/customers?${params.toString()}`,
            { credentials: 'include' }
        )
    }

    const getCustomer = async (id: number): Promise<CustomerDetail> => {
        return await $fetch<CustomerDetail>(`${apiUrl}/api/customers/${id}`, {
            credentials: 'include'
        })
    }

    const getCustomerOrders = async (
        id: number,
        page: number = 1,
        size: number = 20
    ): Promise<CustomerOrdersResponse> => {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('size', size.toString())

        return await $fetch<CustomerOrdersResponse>(
            `${apiUrl}/api/customers/${id}/orders?${params.toString()}`,
            { credentials: 'include' }
        )
    }

    return {
        listCustomers,
        getCustomer,
        getCustomerOrders
    }
}
