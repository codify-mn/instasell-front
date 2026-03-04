import { createSharedComposable } from '@vueuse/core'

export interface User {
    id: number
    email: string
    first_name: string
    last_name: string
    picture: string
    role: string
    shop_id: number
    is_facebook_connected: boolean
    onboarding_completed: boolean
}

interface AuthResponse {
    authenticated: boolean
    user: User | null
    onboarding_completed: boolean
}

interface LoginResponse {
    success: boolean
    user: User
}

interface RegisterResponse {
    success: boolean
    message: string
    email: string
}

interface VerifyOTPResponse {
    success: boolean
    user: User
}

interface ResendOTPResponse {
    success: boolean
    message: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials {
    email: string
    password: string
    first_name: string
    last_name: string
}

const _useAuth = () => {
    const config = useRuntimeConfig()
    const user = ref<User | null>(null)
    const isLoading = ref(true)
    const authError = ref<string | null>(null)
    const pendingVerificationEmail = ref<string | null>(null)
    const resendCooldown = ref(0)
    const isAuthenticated = computed(() => !!user.value)
    const needsOnboarding = computed(() => user.value && !user.value.onboarding_completed)

    const fetchUser = async () => {
        isLoading.value = true
        try {
            const data = await $fetch<AuthResponse>(`${config.public.apiUrl}/auth/me`, {
                credentials: 'include'
            })

            if (data.authenticated && data.user) {
                user.value = data.user
            } else {
                user.value = null
            }
        } catch {
            user.value = null
        } finally {
            isLoading.value = false
        }
    }

    const loginWithEmail = async (credentials: LoginCredentials): Promise<boolean> => {
        isLoading.value = true
        authError.value = null
        try {
            const data = await $fetch<LoginResponse>(`${config.public.apiUrl}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                body: credentials
            })

            if (data.success && data.user) {
                user.value = data.user
                return true
            }
            return false
        } catch (error: any) {
            console.log('[loginWithEmail] error.data:', error.data)
            if (error.data?.requires_verification && error.data?.email) {
                pendingVerificationEmail.value = error.data.email
            } else if (error.data?.error) {
                authError.value = error.data.error
            } else {
                authError.value = 'Login failed. Please try again.'
            }
            return false
        } finally {
            isLoading.value = false
        }
    }

    const register = async (credentials: RegisterCredentials): Promise<boolean> => {
        isLoading.value = true
        authError.value = null
        try {
            const data = await $fetch<RegisterResponse>(`${config.public.apiUrl}/auth/register`, {
                method: 'POST',
                credentials: 'include',
                body: credentials
            })

            if (data.success) {
                pendingVerificationEmail.value = data.email
                return true
            }
            return false
        } catch (error: any) {
            if (error.data?.error) {
                authError.value = error.data.error
            } else {
                authError.value = 'Бүртгэл амжилтгүй. Дахин оролдоно уу.'
            }
            return false
        } finally {
            isLoading.value = false
        }
    }

    const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
        isLoading.value = true
        authError.value = null
        try {
            const data = await $fetch<VerifyOTPResponse>(
                `${config.public.apiUrl}/auth/verify-otp`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body: { email, otp }
                }
            )

            if (data.success && data.user) {
                user.value = data.user
                pendingVerificationEmail.value = null
                return true
            }
            return false
        } catch (error: any) {
            if (error.data?.error) {
                authError.value = error.data.error
            } else {
                authError.value = 'Баталгаажуулалт амжилтгүй. Дахин оролдоно уу.'
            }
            return false
        } finally {
            isLoading.value = false
        }
    }

    const resendOTP = async (email: string): Promise<boolean> => {
        isLoading.value = true
        authError.value = null
        try {
            const data = await $fetch<ResendOTPResponse>(
                `${config.public.apiUrl}/auth/resend-otp`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body: { email }
                }
            )

            if (data.success) {
                // Start 60 second cooldown
                resendCooldown.value = 60
                const interval = setInterval(() => {
                    resendCooldown.value--
                    if (resendCooldown.value <= 0) {
                        clearInterval(interval)
                    }
                }, 1000)
                return true
            }
            return false
        } catch (error: any) {
            if (error.status === 429) {
                authError.value = 'Түр хүлээнэ үү. 60 секундын дараа дахин оролдоно уу.'
            } else if (error.data?.error) {
                authError.value = error.data.error
            } else {
                authError.value = 'Код илгээх амжилтгүй. Дахин оролдоно уу.'
            }
            return false
        } finally {
            isLoading.value = false
        }
    }

    const cancelVerification = () => {
        pendingVerificationEmail.value = null
        authError.value = null
    }

    const forgotPassword = async (email: string): Promise<boolean> => {
        isLoading.value = true
        authError.value = null
        try {
            await $fetch(`${config.public.apiUrl}/auth/forgot-password`, {
                method: 'POST',
                credentials: 'include',
                body: { email }
            })
            return true
        } catch (error: any) {
            if (error.data?.error) {
                authError.value = error.data.error
            } else {
                authError.value = 'Failed to process request. Please try again.'
            }
            return false
        } finally {
            isLoading.value = false
        }
    }

    const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
        isLoading.value = true
        authError.value = null
        try {
            await $fetch(`${config.public.apiUrl}/auth/reset-password`, {
                method: 'POST',
                credentials: 'include',
                body: { token, new_password: newPassword }
            })
            return true
        } catch (error: any) {
            if (error.data?.error) {
                authError.value = error.data.error
            } else {
                authError.value = 'Failed to reset password. Please try again.'
            }
            return false
        } finally {
            isLoading.value = false
        }
    }

    const logout = async () => {
        try {
            await $fetch(`${config.public.apiUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            })
        } finally {
            user.value = null
            navigateTo('/login')
        }
    }

    const clearError = () => {
        authError.value = null
    }

    return {
        user,
        isLoading,
        isAuthenticated,
        needsOnboarding,
        authError,
        pendingVerificationEmail,
        resendCooldown,
        fetchUser,
        loginWithEmail,
        register,
        verifyOTP,
        resendOTP,
        cancelVerification,
        forgotPassword,
        resetPassword,
        logout,
        clearError
    }
}

export const useAuth = createSharedComposable(_useAuth)
