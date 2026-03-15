import { createSharedComposable } from '@vueuse/core'

export interface QPayBankAccount {
    account_bank_code: string
    account_number: string
    account_name: string
    is_default: boolean
}

export interface QPayStatus {
    is_configured: boolean
    is_registered: boolean
    merchant_id: string
    merchant_type: string
    registered_at: string | null
    bank_account: QPayBankAccount
}

export interface QPayDeepLink {
    name: string
    description: string
    logo: string
    link: string
}

export interface QPayInvoice {
    invoice_id: string
    invoice_url: string
    qr_text: string
    qr_image: string
    deep_links: QPayDeepLink[]
}

export interface RegisterCompanyRequest {
    owner_register_no: string
    owner_first_name: string
    owner_last_name: string
    register_number: string
    name: string
    mcc_code: string
    city: string
    district: string
    address: string
    phone: string
    email: string
    bank_account: QPayBankAccount
}

export interface RegisterPersonRequest {
    register_number: string
    first_name: string
    last_name: string
    mcc_code: string
    city: string
    district: string
    address: string
    phone: string
    email: string
    bank_account: QPayBankAccount
}

export interface PaymentCheckResult {
    is_paid: boolean
    paid_amount: number
    payment_count: number
    checked_date: string
}

export interface QPayLocation {
    code: string
    name: string
}

const _useQPay = () => {
    const config = useRuntimeConfig()
    const toast = useToast()

    const status = ref<QPayStatus | null>(null)
    const isLoading = ref(false)
    const isRegistering = ref(false)
    const isCreatingInvoice = ref(false)
    const isCheckingPayment = ref(false)

    const fetchStatus = async () => {
        isLoading.value = true
        try {
            const data = await $fetch<QPayStatus>(`${config.public.apiUrl}/api/qpay/status`, {
                credentials: 'include'
            })
            status.value = data
            return data
        } catch (err: any) {
            console.error('Failed to fetch QPay status:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const registerCompanyMerchant = async (request: RegisterCompanyRequest) => {
        isRegistering.value = true
        try {
            const data = await $fetch<{ message: string; merchant_id: string; qpay: QPayStatus }>(
                `${config.public.apiUrl}/api/qpay/register/company`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body: request
                }
            )
            toast.add({
                title: 'Амжилттай',
                description: 'QPay компани мерчант бүртгэгдлээ.',
                icon: 'i-lucide-check',
                color: 'primary'
            })
            await fetchStatus()
            return data
        } catch (err: any) {
            toast.add({
                title: 'Алдаа',
                description: err.data?.message || 'QPay бүртгэхэд алдаа гарлаа.',
                icon: 'i-lucide-x',
                color: 'error'
            })
            throw err
        } finally {
            isRegistering.value = false
        }
    }

    const registerPersonMerchant = async (request: RegisterPersonRequest) => {
        isRegistering.value = true
        try {
            const data = await $fetch<{ message: string; merchant_id: string; qpay: QPayStatus }>(
                `${config.public.apiUrl}/api/qpay/register/person`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body: request
                }
            )
            toast.add({
                title: 'Амжилттай',
                description: 'QPay хувь хүн мерчант бүртгэгдлээ.',
                icon: 'i-lucide-check',
                color: 'primary'
            })
            await fetchStatus()
            return data
        } catch (err: any) {
            toast.add({
                title: 'Алдаа',
                description: err.data?.message || 'QPay бүртгэхэд алдаа гарлаа.',
                icon: 'i-lucide-x',
                color: 'error'
            })
            throw err
        } finally {
            isRegistering.value = false
        }
    }

    const createInvoice = async (orderId: number, description?: string) => {
        isCreatingInvoice.value = true
        try {
            const data = await $fetch<{ message: string; invoice_id: string; qpay: QPayInvoice }>(
                `${config.public.apiUrl}/api/qpay/invoice`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body: { order_id: orderId, description }
                }
            )
            return data
        } catch (err: any) {
            toast.add({
                title: 'Алдаа',
                description: err.data?.message || 'Нэхэмжлэх үүсгэхэд алдаа гарлаа.',
                icon: 'i-lucide-x',
                color: 'error'
            })
            throw err
        } finally {
            isCreatingInvoice.value = false
        }
    }

    const getOrderInvoice = async (orderId: number) => {
        try {
            const data = await $fetch<QPayInvoice>(
                `${config.public.apiUrl}/api/orders/${orderId}/qpay`,
                {
                    credentials: 'include'
                }
            )
            return data
        } catch (err: any) {
            if (err.status !== 404) {
                console.error('Failed to get order QPay invoice:', err)
            }
            return null
        }
    }

    const checkPayment = async (orderId: number) => {
        isCheckingPayment.value = true
        try {
            const data = await $fetch<PaymentCheckResult>(
                `${config.public.apiUrl}/api/qpay/payment/check`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body: { order_id: orderId }
                }
            )
            if (data.is_paid) {
                toast.add({
                    title: 'Төлбөр баталгаажлаа',
                    description: `${data.paid_amount.toLocaleString()}₮ төлбөр хүлээн авлаа.`,
                    icon: 'i-lucide-check-circle',
                    color: 'primary'
                })
            }
            return data
        } catch (err: any) {
            toast.add({
                title: 'Алдаа',
                description: err.data?.message || 'Төлбөр шалгахад алдаа гарлаа.',
                icon: 'i-lucide-x',
                color: 'error'
            })
            throw err
        } finally {
            isCheckingPayment.value = false
        }
    }

    const fetchCities = async () => {
        try {
            const data = await $fetch<QPayLocation[]>(`${config.public.apiUrl}/api/qpay/cities`, {
                credentials: 'include'
            })
            return data
        } catch (err: any) {
            console.error('Failed to fetch QPay cities:', err)
            return []
        }
    }

    const fetchDistricts = async (cityCode: string) => {
        try {
            const data = await $fetch<QPayLocation[]>(
                `${config.public.apiUrl}/api/qpay/districts/${cityCode}`,
                {
                    credentials: 'include'
                }
            )
            return data
        } catch (err: any) {
            console.error('Failed to fetch QPay districts:', err)
            return []
        }
    }

    return {
        status,
        isLoading,
        isRegistering,
        isCreatingInvoice,
        isCheckingPayment,
        fetchStatus,
        registerCompanyMerchant,
        registerPersonMerchant,
        createInvoice,
        getOrderInvoice,
        checkPayment,
        fetchCities,
        fetchDistricts
    }
}

export const useQPay = createSharedComposable(_useQPay)
