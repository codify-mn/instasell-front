import { createSharedComposable } from '@vueuse/core'
import type { QPayBankAccount } from './useQPay'

export interface ShopSettings {
    // Automation
    automation_enabled: boolean
    trigger_keywords: string[]
    like_comments: boolean
    auto_comment_enabled: boolean
    auto_comment_text: string
    private_reply_enabled: boolean
    private_reply_message: string
    // Delivery
    delivery_type: string
    delivery_fee: number
    delivery_note: string
    free_delivery_over: number
    // Order
    max_quantity_per_item: number
    unpaid_order_cancel_hours: number
    payment_methods?: string[]
    upsell_product_ids?: number[]
    max_featured_products?: number
    backgrounds?: string[]
}

export interface ShopQPayData {
    merchant_id: string
    vendor_id?: string
    p2p_terminal_id?: string
    card_terminal_id?: string
    merchant_type: string
    is_registered: boolean
    registered_at?: string
    bank_account?: QPayBankAccount
}

export interface ShopData {
    id: number
    name: string
    phone_number: string
    owner_id: number
    is_active: boolean
    picture: string
    settings: ShopSettings
    qpay?: ShopQPayData
}

const _useShopSettings = () => {
    const config = useRuntimeConfig()
    const toast = useToast()

    const shop = ref<ShopData | null>(null)
    const isLoading = ref(false)
    const isSaving = ref(false)
    const error = ref<string | null>(null)

    const fetchShop = async () => {
        isLoading.value = true
        error.value = null

        try {
            const data = await $fetch<ShopData>(`${config.public.apiUrl}/api/shops/my`, {
                credentials: 'include'
            })
            shop.value = data
        } catch (err: any) {
            if (err.status !== 404) {
                error.value = 'Дэлгүүрийн мэдээлэл ачаалахад алдаа гарлаа'
                console.error('Failed to fetch shop:', err)
            }
        } finally {
            isLoading.value = false
        }
    }

    const updateShop = async (updates: Partial<ShopData>) => {
        isSaving.value = true
        error.value = null

        try {
            const data = await $fetch<ShopData>(`${config.public.apiUrl}/api/shops/my`, {
                method: 'PUT',
                credentials: 'include',
                body: updates
            })
            shop.value = data
            toast.add({
                title: 'Амжилттай',
                description: 'Тохиргоо хадгалагдлаа.',
                icon: 'i-lucide-check',
                color: 'success'
            })
            return data
        } catch (err: any) {
            error.value = 'Тохиргоо хадгалахад алдаа гарлаа'
            toast.add({
                title: 'Алдаа',
                description: 'Тохиргоо хадгалахад алдаа гарлаа.',
                icon: 'i-lucide-x',
                color: 'error'
            })
            console.error('Failed to update shop:', err)
            throw err
        } finally {
            isSaving.value = false
        }
    }

    return {
        shop,
        isLoading,
        isSaving,
        error,
        fetchShop,
        updateShop
    }
}

export const useShopSettings = createSharedComposable(_useShopSettings)
