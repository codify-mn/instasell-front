<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, FormError } from '@nuxt/ui'
import { useShopSettings } from '~/composables/useShopSettings'
import { useQPay } from '~/composables/useQPay'
import { useShopBackgrounds } from '~/composables/useShopBackgrounds'
import { MONGOLIAN_BANKS } from '~/utils/banks'

const { shop, isLoading, isSaving, fetchShop, updateShop } = useShopSettings()
const shopData = useShop()
const { status: qpayStatus, isLoading: qpayLoading, fetchStatus: fetchQPayStatus } = useQPay()
const { backgrounds, addBackground, removeBackground } = useShopBackgrounds()

const fileRef = ref<HTMLInputElement>()
const bgFileRef = ref<HTMLInputElement>()
const uploadingBg = ref(false)
const config = useRuntimeConfig()
const toast = useToast()
const router = useRouter()

const bankOptions = MONGOLIAN_BANKS
const { user, fetchUser } = useAuth()

// Integrations
const isDisconnecting = ref(false)
const isConnecting = ref(false)

const disconnectFacebook = async () => {
    isDisconnecting.value = true
    try {
        await $fetch(`${config.public.apiUrl}/api/connect/facebook`, {
            method: 'DELETE',
            credentials: 'include'
        })
        toast.add({ title: 'Амжилттай', description: 'Facebook салгагдлаа' })
        await Promise.all([fetchUser(), fetchShop()])
    } catch (e) {
        toast.add({ title: 'Алдаа', description: 'Facebook салгахад алдаа гарлаа', color: 'error' })
    } finally {
        isDisconnecting.value = false
    }
}

const connectFacebook = async () => {
    await navigateTo(`${config.public.apiUrl}/api/connect/facebook`, { external: true })
}

const showQPayRegisterModal = ref(false)
const showDeleteAccountModal = ref(false)
const deletingAccount = ref(false)

const shopSchema = z.object({
    name: z.string().min(1, 'Дэлгүүрийн нэр оруулна уу'),
    phone_number: z.string().optional(),
    picture: z.string().optional()
})

const passwordSchema = z.object({
    current: z.string().min(8, 'Хамгийн багадаа 8 тэмдэгт байх ёстой'),
    new: z.string().min(8, 'Хамгийн багадаа 8 тэмдэгт байх ёстой')
})

type ShopSchema = z.output<typeof shopSchema>
type PasswordSchema = z.output<typeof passwordSchema>

type DeliveryType = 'none' | 'fixed' | 'free_over' | 'custom' | 'all_free'

const state = reactive({
    name: '',
    phone_number: '',
    picture: '',
    delivery_type: 'none' as DeliveryType,
    delivery_fee: 0,
    free_delivery_over: 0,
    delivery_note: '',
    // Automation
    automation_enabled: true,
    trigger_keywords: [] as string[],
    like_comments: false,
    auto_comment_enabled: false,
    auto_comment_text: '',
    private_reply_enabled: false,
    private_reply_message: '',
    max_quantity_per_item: 10,
    unpaid_order_cancel_hours: 24,
    payment_methods: [] as string[],
    max_featured_products: 6,
    bank_account_bank_name: '',
    bank_account_bank_code: '',
    bank_account_account_number: '',
    bank_account_account_name: '',
    bank_account_note: ''
})

// Unsaved changes tracking
const hasChanges = ref(false)
watch(state, () => { hasChanges.value = true }, { deep: true })

onBeforeRouteLeave(() => {
    if (hasChanges.value) {
        return window.confirm('Хадгалаагүй өөрчлөлт байна. Гарах уу?')
    }
})

// Trigger keywords input helpers
const keywordInput = ref('')
function addKeyword() {
    const kw = keywordInput.value.trim()
    if (kw && !state.trigger_keywords.includes(kw)) {
        state.trigger_keywords.push(kw)
    }
    keywordInput.value = ''
}
function removeKeyword(kw: string) {
    const idx = state.trigger_keywords.indexOf(kw)
    if (idx !== -1) state.trigger_keywords.splice(idx, 1)
}
function onKeywordKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        e.preventDefault()
        addKeyword()
    }
}

// Insert template variable at cursor position in a textarea
function insertVariable(field: 'auto_comment_text' | 'private_reply_message', variable: string) {
    const selector = field === 'auto_comment_text' ? '#auto-comment-textarea' : '#private-reply-textarea'
    const el = document.querySelector(selector) as HTMLTextAreaElement | null
    if (!el) {
        state[field] = (state[field] || '') + variable
        return
    }
    const start = el.selectionStart ?? state[field].length
    const end = el.selectionEnd ?? state[field].length
    const current = state[field] || ''
    state[field] = current.slice(0, start) + variable + current.slice(end)
    nextTick(() => {
        el.focus()
        const pos = start + variable.length
        el.setSelectionRange(pos, pos)
    })
}

const activeSteps = computed(() => {
    let count = 0
    if (state.like_comments) count++
    if (state.auto_comment_enabled) count++
    if (state.private_reply_enabled) count++
    return count
})

const password = reactive<Partial<PasswordSchema>>({
    current: undefined,
    new: undefined
})

const cancelTimeOptions = [
    { label: '1 цаг', value: 1 },
    { label: '2 цаг', value: 2 },
    { label: '6 цаг', value: 6 },
    { label: '12 цаг', value: 12 },
    { label: '24 цаг (Санал болгох)', value: 24 },
    { label: '48 цаг', value: 48 },
    { label: '72 цаг', value: 72 }
]

const paymentMethodOptions = [
    { label: 'QPay', value: 'qpay' },
    { label: 'Бэлнээр', value: 'cash' },
    { label: 'Дансаар шилжүүлэх', value: 'bank_transfer' },
    { label: 'Картаар', value: 'card' }
]

function togglePaymentMethod(value: string) {
    const index = state.payment_methods.indexOf(value)
    if (index === -1) {
        state.payment_methods.push(value)
    } else {
        state.payment_methods.splice(index, 1)
    }
}

const route = useRoute()

onMounted(async () => {
    if (route.query.callback_status === 'connected') {
        toast.add({ title: 'Амжилттай', description: 'Facebook амжилттай холбогдлоо' })
    }
    await Promise.all([fetchShop(), fetchQPayStatus()])
    if (shop.value) {
        state.name = shop.value.name || ''
        state.phone_number = shop.value.phone_number || ''
        state.picture = shop.value.picture || ''
        state.delivery_type = (shop.value.settings?.delivery_type || 'none') as DeliveryType
        state.delivery_fee = shop.value.settings?.delivery_fee || 0
        state.free_delivery_over = shop.value.settings?.free_delivery_over || 0
        state.delivery_note = shop.value.settings?.delivery_note || ''
        state.automation_enabled = shop.value.settings?.automation_enabled ?? true
        state.trigger_keywords = shop.value.settings?.trigger_keywords || []
        state.like_comments = shop.value.settings?.like_comments || false
        state.auto_comment_enabled = shop.value.settings?.auto_comment_enabled || false
        state.auto_comment_text = shop.value.settings?.auto_comment_text || ''
        state.private_reply_enabled = shop.value.settings?.private_reply_enabled || false
        state.private_reply_message = shop.value.settings?.private_reply_message || ''
        state.max_quantity_per_item = shop.value.settings?.max_quantity_per_item || 10
        state.unpaid_order_cancel_hours = shop.value.settings?.unpaid_order_cancel_hours || 24
        state.payment_methods = shop.value.settings?.payment_methods || []
        state.max_featured_products = shop.value.settings?.max_featured_products || 6
        state.bank_account_bank_name = shop.value.settings?.bank_account?.bank_name || ''
        state.bank_account_bank_code = shop.value.settings?.bank_account?.bank_code || ''
        state.bank_account_account_number = shop.value.settings?.bank_account?.account_number || ''
        state.bank_account_account_name = shop.value.settings?.bank_account?.account_name || ''
        state.bank_account_note = shop.value.settings?.bank_account?.note || ''
    }
    // Reset dirty flag after initial load
    await nextTick()
    hasChanges.value = false
})

function onQPayRegisterSuccess() {
    showQPayRegisterModal.value = false
    fetchQPayStatus()
}

const validatePassword = (state: Partial<PasswordSchema>): FormError[] => {
    const errors: FormError[] = []
    if (state.current && state.new && state.current === state.new) {
        errors.push({ name: 'new', message: 'Нууц үг өөр байх ёстой' })
    }
    return errors
}

async function onSubmit(_event: FormSubmitEvent<ShopSchema>) {
    await saveSettings()
}

async function onPasswordSubmit(_event: FormSubmitEvent<PasswordSchema>) {
    try {
        await $fetch(`${config.public.apiUrl}/api/me/password`, {
            method: 'PUT',
            credentials: 'include',
            body: {
                current_password: password.current,
                new_password: password.new
            }
        })
        toast.add({ title: 'Амжилттай', description: 'Нууц үг амжилттай солигдлоо' })
        password.current = undefined
        password.new = undefined
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.error || 'Нууц үг солиход алдаа гарлаа',
            color: 'error'
        })
    }
}

async function onDeleteAccount() {
    deletingAccount.value = true
    try {
        await $fetch(`${config.public.apiUrl}/api/me`, {
            method: 'DELETE',
            credentials: 'include'
        })
        hasChanges.value = false
        toast.add({ title: 'Амжилттай', description: 'Таны бүртгэл устгагдлаа' })
        await navigateTo('/login')
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.error || 'Бүртгэл устгахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        deletingAccount.value = false
        showDeleteAccountModal.value = false
    }
}

async function saveSettings() {
    const updates = {
        name: state.name,
        phone_number: state.phone_number,
        picture: state.picture,
        settings: {
            automation_enabled: state.automation_enabled,
            trigger_keywords: state.trigger_keywords,
            like_comments: state.like_comments,
            auto_comment_enabled: state.auto_comment_enabled,
            auto_comment_text: state.auto_comment_text,
            private_reply_enabled: state.private_reply_enabled,
            private_reply_message: state.private_reply_message,
            delivery_type: state.delivery_type,
            delivery_fee: state.delivery_fee,
            free_delivery_over: state.free_delivery_over,
            delivery_note: state.delivery_note,
            max_quantity_per_item: state.max_quantity_per_item,
            unpaid_order_cancel_hours: state.unpaid_order_cancel_hours,
            payment_methods: state.payment_methods,
            max_featured_products: state.max_featured_products,
            bank_account: {
                bank_name: state.bank_account_bank_name,
                bank_code: state.bank_account_bank_code,
                account_number: state.bank_account_account_number,
                account_name: state.bank_account_account_name,
                note: state.bank_account_note
            }
        }
    }
    await updateShop(updates)
    hasChanges.value = false
}

function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    const file = input.files[0]!
    const formData = new FormData()
    formData.append('file', file)

    $fetch<{ url: string }>(`${config.public.apiUrl}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    })
        .then((response) => {
            state.picture = response.url
        })
        .catch((err) => {
            console.error('Upload failed:', err)
        })
}

function onFileClick() {
    fileRef.value?.click()
}

function onBgFileClick() {
    bgFileRef.value?.click()
}

watch(isLoading, (loading) => {
    if (!loading && route.hash) {
        nextTick(() => {
            const el = document.querySelector(route.hash)
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
    }
})

async function onBgFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    uploadingBg.value = true
    try {
        await addBackground(input.files[0]!)
    } finally {
        uploadingBg.value = false
        input.value = ''
    }
}
</script>

<template>
    <div>
        <div v-if="isLoading" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
        </div>

        <UForm v-else id="shop-settings" :schema="shopSchema" :state="state" @submit="onSubmit">
            <!-- Section 1: Basic Info -->
            <UPageCard
                title="Дэлгүүрийн мэдээлэл"
                description="Дэлгүүрийн үндсэн мэдээлэл."
                variant="naked"
                orientation="horizontal"
                class="mb-4"
            >
                <UButton
                    form="shop-settings"
                    label="Хадгалах"
                    color="neutral"
                    type="submit"
                    :loading="isSaving"
                    class="w-fit lg:ms-auto"
                />
            </UPageCard>

            <div id="phone" class="scroll-mt-16" />
            <UPageCard variant="subtle" class="mb-8">
                <UFormField
                    name="name"
                    label="Нэр"
                    description="Дэлгүүрийн нэр хэрэглэгчдэд харагдана."
                    required
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <UInput v-model="state.name" autocomplete="off" />
                </UFormField>
                <USeparator />
                <UFormField
                    name="phone_number"
                    label="Утас"
                    description="Холбоо барих утасны дугаар."
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <UInput v-model="state.phone_number" type="tel" autocomplete="off" />
                </UFormField>
                <USeparator />
                <UFormField
                    name="picture"
                    label="Лого"
                    description="JPG, GIF эсвэл PNG. Хамгийн ихдээ 1MB."
                    class="flex max-sm:flex-col justify-between sm:items-center gap-4"
                >
                    <div class="flex flex-wrap items-center gap-3">
                        <UAvatar :src="state.picture" :alt="state.name" size="lg" />
                        <UButton label="Сонгох" color="neutral" @click="onFileClick" />
                        <input
                            ref="fileRef"
                            type="file"
                            class="hidden"
                            accept=".jpg, .jpeg, .png, .gif"
                            @change="onFileChange"
                        >
                    </div>
                </UFormField>
            </UPageCard>

            <!-- Section: Integrations (moved up — critical for new merchants) -->
            <UPageCard
                title="Холболт"
                description="Гадаад үйлчилгээтэй холбох тохиргоо."
                variant="naked"
                class="mb-4"
            />

            <UPageCard variant="subtle" class="mb-8">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div
                            class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                        >
                            <UIcon
                                name="i-simple-icons-facebook"
                                class="w-6 h-6 text-blue-600 dark:text-blue-400"
                            />
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900 dark:text-white">Facebook</h4>
                            <p v-if="user?.is_facebook_connected" class="text-sm text-gray-500">
                                Холбогдсон:
                                <span class="font-medium text-gray-900 dark:text-white">{{
                                    shopData?.facebook_page?.page_name
                                }}</span>
                            </p>
                            <p v-else class="text-sm text-gray-500">
                                Facebook хуудасаа холбож захиалга болон бараагаа удирдаарай.
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <UButton
                            v-if="user?.is_facebook_connected"
                            icon="i-heroicons-arrow-path"
                            label="Дахин холбох"
                            color="neutral"
                            variant="subtle"
                            :loading="isConnecting"
                            @click="connectFacebook"
                        />
                        <UButton
                            v-if="user?.is_facebook_connected"
                            label="Салгах"
                            color="error"
                            variant="subtle"
                            :loading="isDisconnecting"
                            @click="disconnectFacebook"
                        />
                        <UButton
                            v-else
                            icon="i-simple-icons-facebook"
                            label="Facebook холбох"
                            @click="connectFacebook"
                        />
                    </div>
                </div>
            </UPageCard>

            <!-- Section: Bank Account -->
            <div id="bank-account" class="scroll-mt-16" />
            <UPageCard
                title="Банкны мэдээлэл"
                description="Дансаар шилжүүлэх төлбөрт ашиглах банкны мэдээлэл."
                variant="naked"
                class="mb-4"
            />

            <UPageCard variant="subtle" class="mb-8">
                <UFormField name="bank_account_bank_name" label="Банкны нэр">
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        <button
                            v-for="bank in bankOptions"
                            :key="bank.value"
                            type="button"
                            class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer"
                            :class="state.bank_account_bank_name === bank.label
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                            @click="state.bank_account_bank_name = bank.label; state.bank_account_bank_code = bank.value"
                        >
                            <img :src="bank.logo" class="w-5 h-5 rounded-sm object-contain flex-shrink-0" />
                            <span class="truncate">{{ bank.label }}</span>
                        </button>
                    </div>
                </UFormField>
                <USeparator />
                <UFormField
                    name="bank_account_account_number"
                    label="Дансны дугаар"
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <UInput v-model="state.bank_account_account_number" autocomplete="off" />
                </UFormField>
                <USeparator />
                <UFormField
                    name="bank_account_account_name"
                    label="Дансны нэр"
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <UInput v-model="state.bank_account_account_name" autocomplete="off" />
                </UFormField>
                <USeparator />
                <UFormField
                    name="bank_account_note"
                    label="Гүйлгээний заавар"
                    description="Захиалагчид дансанд мөнгө шилжүүлэхдээ юу бичихийг заана уу. Жишээ нь: &quot;Гүйлгээний утга-д захиалгын дугаараа бичнэ үү&quot;"
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                    :ui="{ container: 'w-full' }"
                >
                    <UTextarea
                        v-model="state.bank_account_note"
                        :rows="2"
                        autoresize
                        class="w-full"
                    />
                </UFormField>
            </UPageCard>

            <!-- Section: QPay -->
            <div id="qpay" class="scroll-mt-16" />
            <UPageCard
                title="QPay тохиргоо"
                description="QPay-ээр төлбөр хүлээн авах тохиргоо."
                variant="naked"
                class="mb-4"
            />

            <UPageCard variant="subtle" class="mb-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div
                            class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
                        >
                            <UIcon
                                name="i-lucide-smartphone"
                                class="w-6 h-6 text-purple-600 dark:text-purple-400"
                            />
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900 dark:text-white">QPay мерчант</h4>
                            <p class="text-sm text-gray-500">
                                <template v-if="qpayLoading"> Ачаалж байна... </template>
                                <template v-else-if="qpayStatus?.is_registered">
                                    Merchant ID: {{ qpayStatus.merchant_id }}
                                </template>
                                <template v-else>
                                    QPay-д бүртгүүлж, шууд төлбөр хүлээн авах боломжтой болно.
                                </template>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <QPayStatusBadge
                            v-if="qpayStatus"
                            :is-registered="qpayStatus.is_registered"
                            :merchant-type="qpayStatus.merchant_type"
                        />
                        <UButton
                            v-if="!qpayStatus?.is_registered"
                            size="sm"
                            @click="showQPayRegisterModal = true"
                        >
                            Бүртгүүлэх
                        </UButton>
                    </div>
                </div>

                <!-- QPay hint when not registered and bank account is empty -->
                <template v-if="!qpayStatus?.is_registered && !state.bank_account_account_number">
                    <USeparator class="my-4" />
                    <div class="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
                        <UIcon name="i-lucide-info" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <p class="text-xs text-amber-700 dark:text-amber-300">
                            QPay бүртгэхийн өмнө дээрх <span class="font-semibold">Банкны мэдээлэл</span> хэсгийг бөглөнө үү — бүртгэлд автоматаар ашиглагдана.
                        </p>
                    </div>
                </template>

                <template v-if="qpayStatus?.is_registered && qpayStatus.bank_account">
                    <USeparator class="my-4" />
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Бүртгэлтэй данс
                        </p>
                        <div
                            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                            <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-gray-400" />
                            <span class="text-sm"
                                >{{ qpayStatus.bank_account.account_number }} -
                                {{ qpayStatus.bank_account.account_name }}</span
                            >
                            <UBadge
                                v-if="qpayStatus.bank_account.is_default"
                                size="xs"
                                color="primary"
                                variant="soft"
                            >
                                Үндсэн
                            </UBadge>
                        </div>
                    </div>
                </template>
            </UPageCard>

            <!-- Section: Delivery Settings -->
            <DeliveryOptions
                v-model:delivery_type="state.delivery_type"
                v-model:delivery_fee="state.delivery_fee"
                v-model:free_delivery_over="state.free_delivery_over"
                v-model:delivery_note="state.delivery_note"
            />

            <!-- Section: Order Settings -->
            <UPageCard
                title="Захиалгын тохиргоо"
                description="Захиалга болон сагсны тохиргоо."
                variant="naked"
                class="mb-4"
            />

            <UPageCard variant="subtle" class="mb-8">
                <UFormField
                    name="max_quantity_per_item"
                    label="Нэг барааны сагслах дээд хэмжээ"
                    description="Хэрэглэгч нэг бараанаас хэдэн ширхэг захиалж болох."
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <UInput
                        v-model.number="state.max_quantity_per_item"
                        type="number"
                        min="1"
                        max="100"
                        autocomplete="off"
                    />
                </UFormField>
                <USeparator />
                <UFormField
                    name="unpaid_order_cancel_hours"
                    label="Төлөгдөөгүй захиалга цуцлагдах хугацаа"
                    description="QPay төлбөр хийгдээгүй захиалга автоматаар цуцлагдах хугацаа."
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <USelect
                        v-model="state.unpaid_order_cancel_hours"
                        :items="cancelTimeOptions"
                        placeholder="Хугацаа сонгох"
                    />
                </UFormField>
                <USeparator />
                <UFormField
                    name="payment_methods"
                    label="Төлбөрийн аргууд"
                    description="Захиалга хийхэд нээлттэй байх төлбөрийн аргууд."
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <div class="flex flex-wrap gap-4 pt-2">
                        <UCheckbox
                            v-for="option in paymentMethodOptions"
                            :key="option.value"
                            :model-value="state.payment_methods.includes(option.value)"
                            :label="option.label"
                            @update:model-value="togglePaymentMethod(option.value)"
                        />
                    </div>
                </UFormField>
            </UPageCard>

            <!-- Section: Automation Flow -->
            <UPageCard
                title="Автоматжуулалт"
                description="Facebook комментоос захиалга үүсгэх урсгал."
                variant="naked"
                orientation="horizontal"
                class="mb-4"
            >
                <div class="flex items-center gap-3 lg:ms-auto">
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                        {{ state.automation_enabled ? 'Идэвхтэй' : 'Идэвхгүй' }}
                    </span>
                    <USwitch v-model="state.automation_enabled" />
                </div>
            </UPageCard>

            <div class="mb-8 space-y-0" :class="{ 'opacity-50 pointer-events-none': !state.automation_enabled }">

                <!-- Status bar -->
                <div class="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl border text-sm font-medium transition-colors"
                    :class="state.automation_enabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'"
                >
                    <span :class="['w-2 h-2 rounded-full shrink-0', state.automation_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400']" />
                    <span v-if="state.automation_enabled">
                        Автоматжуулалт идэвхтэй —
                        <span class="font-semibold">{{ activeSteps }} нэмэлт үйлдэл</span> тохируулагдсан
                    </span>
                    <span v-else>Автоматжуулалт унтраалттай байна</span>
                </div>

                <!-- Step 1: Trigger -->
                <div class="relative">
                    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                        <div class="flex items-start gap-4">
                            <div class="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center shrink-0 mt-0.5">
                                <UIcon name="i-lucide-message-square" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2 mb-1">
                                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">1. Идэвхжүүлэх үгс</h4>
                                    <span class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Үргэлж идэвхтэй</span>
                                </div>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Хэрэглэгч эдгээр үгсийн аль нэгийг комментлоход захиалга автоматаар үүснэ
                                </p>
                                <div class="flex flex-wrap gap-2 mb-3">
                                    <button
                                        v-for="kw in state.trigger_keywords"
                                        :key="kw"
                                        type="button"
                                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs font-medium border border-primary-200 dark:border-primary-800/50 hover:bg-primary-100 dark:hover:bg-primary-950/60 transition-colors group"
                                        @click="removeKeyword(kw)"
                                    >
                                        {{ kw }}
                                        <UIcon name="i-lucide-x" class="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                    </button>
                                </div>
                                <div class="flex gap-2">
                                    <UInput
                                        v-model="keywordInput"
                                        placeholder="Шинэ үг нэмэх..."
                                        size="sm"
                                        class="flex-1 max-w-xs"
                                        @keydown="onKeywordKeydown"
                                    />
                                    <UButton icon="i-lucide-plus" size="sm" color="primary" variant="soft" @click="addKeyword">Нэмэх</UButton>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Connector -->
                    <div class="flex justify-center py-1">
                        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>

                <!-- Step 2: Core action (locked) -->
                <div class="relative">
                    <div class="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 p-5">
                        <div class="flex items-center gap-4">
                            <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                                <UIcon name="i-lucide-zap" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h4 class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">⚡ Захиалга автоматаар үүснэ</h4>
                                <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Энэ үйлдэл үргэлж явагдана — унтраах боломжгүй</p>
                            </div>
                        </div>
                    </div>
                    <!-- Connector -->
                    <div class="flex justify-center py-1">
                        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>

                <!-- Step 3: Follow-up actions (3 cards) -->
                <div>
                    <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">Захиалга үүссэний дараа...</p>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">

                        <!-- Like comment -->
                        <div
                            class="rounded-2xl border-2 p-4 transition-all"
                            :class="state.like_comments
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'"
                        >
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    :class="state.like_comments ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'"
                                >
                                    <UIcon name="i-lucide-thumbs-up" class="w-4 h-4"
                                        :class="state.like_comments ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
                                    />
                                </div>
                                <USwitch v-model="state.like_comments" size="xs" />
                            </div>
                            <h5 class="text-sm font-semibold mb-0.5"
                                :class="state.like_comments ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                            >
                                Like дарах
                            </h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Комментод автоматаар like дарна</p>
                        </div>

                        <!-- Public reply -->
                        <div
                            class="rounded-2xl border-2 p-4 transition-all"
                            :class="state.auto_comment_enabled
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'"
                        >
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    :class="state.auto_comment_enabled ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'"
                                >
                                    <UIcon name="i-lucide-message-circle" class="w-4 h-4"
                                        :class="state.auto_comment_enabled ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
                                    />
                                </div>
                                <USwitch v-model="state.auto_comment_enabled" size="xs" />
                            </div>
                            <h5 class="text-sm font-semibold mb-0.5"
                                :class="state.auto_comment_enabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                            >
                                Нийтэд хариулах
                            </h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Комментод нийтэд харагдах хариулт</p>
                            <div v-if="state.auto_comment_enabled" class="mt-3 space-y-2">
                                <UTextarea
                                    id="auto-comment-textarea"
                                    v-model="state.auto_comment_text"
                                    :rows="2"
                                    autoresize
                                    size="sm"
                                    class="w-full"
                                    placeholder="Баярлалаа! Мессежээр захиалгын мэдээллийг илгээлэе."
                                />
                            </div>
                        </div>

                        <!-- Private message -->
                        <div
                            class="rounded-2xl border-2 p-4 transition-all"
                            :class="state.private_reply_enabled
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'"
                        >
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    :class="state.private_reply_enabled ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'"
                                >
                                    <UIcon name="i-lucide-send" class="w-4 h-4"
                                        :class="state.private_reply_enabled ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
                                    />
                                </div>
                                <USwitch v-model="state.private_reply_enabled" size="xs" />
                            </div>
                            <h5 class="text-sm font-semibold mb-0.5"
                                :class="state.private_reply_enabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                            >
                                Хувийн мессеж
                            </h5>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Хэрэглэгчид хувийн мессеж илгээнэ</p>
                            <div v-if="state.private_reply_enabled" class="mt-3 space-y-2">
                                <UTextarea
                                    id="private-reply-textarea"
                                    v-model="state.private_reply_message"
                                    :rows="3"
                                    autoresize
                                    size="sm"
                                    class="w-full"
                                    placeholder="Захиалга #{order_number} бүртгэгдлээ! Төлбөр: {checkout_link}"
                                />
                                <div class="flex flex-wrap gap-1">
                                    <button
                                        v-for="v in ['{order_number}', '{checkout_link}', '{customer_name}']"
                                        :key="v"
                                        type="button"
                                        class="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-mono cursor-pointer border border-gray-200 dark:border-gray-700"
                                        @click="insertVariable('private_reply_message', v)"
                                    >{{ v }}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section: Background Images -->
            <UPageCard
                title="Дэвсгэр зургууд"
                description="Бараа нийтлэхэд ашиглах дэвсгэр зургууд. Хамгийн ихдээ 10 ширхэг."
                variant="naked"
                class="mb-4"
            />

            <UPageCard variant="subtle" class="mb-8">
                <div class="flex flex-wrap gap-3">
                    <div
                        v-for="bg in backgrounds"
                        :key="bg"
                        class="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                        <img :src="bg" class="w-full h-full object-cover" alt="Background" />
                        <button
                            class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            @click="removeBackground(bg)"
                        >
                            <UIcon name="i-lucide-trash-2" class="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <button
                        v-if="backgrounds.length < 10"
                        class="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary-400 transition-colors"
                        :disabled="uploadingBg"
                        @click="onBgFileClick"
                    >
                        <UIcon
                            v-if="uploadingBg"
                            name="i-lucide-loader-2"
                            class="w-5 h-5 animate-spin text-gray-400"
                        />
                        <template v-else>
                            <UIcon name="i-lucide-plus" class="w-5 h-5 text-gray-400" />
                            <span class="text-xs text-gray-400">Нэмэх</span>
                        </template>
                    </button>
                    <input
                        ref="bgFileRef"
                        type="file"
                        class="hidden"
                        accept=".jpg,.jpeg,.png,.webp"
                        @change="onBgFileChange"
                    />
                </div>
                <p v-if="backgrounds.length === 0" class="text-sm text-gray-400 mt-2">
                    Дэвсгэр зураг нэмээгүй байна.
                </p>
            </UPageCard>

            <!-- Section: Security -->
            <UPageCard
                title="Нууц үг"
                description="Шинэ нууц үг тохируулахын өмнө одоогийн нууц үгээ баталгаажуулна уу."
                variant="naked"
                class="mb-4"
            />

            <UPageCard variant="subtle" class="mb-8">
                <UForm
                    :schema="passwordSchema"
                    :state="password"
                    :validate="validatePassword"
                    class="space-y-4 max-w-sm"
                    @submit="onPasswordSubmit"
                >
                    <UFormField
                        name="current"
                        label="Одоогийн нууц үг"
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                    >
                        <UInput
                            v-model="password.current"
                            type="password"
                            placeholder="Одоогийн нууц үг"
                        />
                    </UFormField>

                    <UFormField
                        name="new"
                        label="Шинэ нууц үг"
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                    >
                        <UInput
                            v-model="password.new"
                            type="password"
                            placeholder="Шинэ нууц үг"
                        />
                    </UFormField>

                    <UButton label="Нууц үг шинэчлэх" class="w-fit" type="submit" color="neutral" />
                </UForm>
            </UPageCard>

            <!-- Section: Account Management (danger zone) -->
            <UPageCard
                title="Бүртгэл"
                description="Бүртгэлтэй холбоотой тохиргоо."
                variant="naked"
                class="mb-4"
            />

            <UPageCard
                variant="subtle"
                class="bg-gradient-to-tl from-error/10 from-5% to-transparent"
            >
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-1">Бүртгэл устгах</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                            Манай үйлчилгээг цаашид ашиглахгүй бол бүртгэлээ устгах боломжтой. Энэ үйлдлийг буцаах боломжгүй бөгөөд бүх мэдээлэл бүрмөсөн устгагдах болно.
                        </p>
                    </div>
                    <UButton
                        label="Устгах"
                        color="error"
                        variant="subtle"
                        class="shrink-0"
                        @click="showDeleteAccountModal = true"
                    />
                </div>
            </UPageCard>

            <!-- Bottom save button -->
            <div class="flex justify-end mt-8">
                <UButton
                    form="shop-settings"
                    label="Хадгалах"
                    color="neutral"
                    type="submit"
                    :loading="isSaving"
                />
            </div>
        </UForm>

        <!-- QPay Registration Modal -->
        <UModal v-model:open="showQPayRegisterModal">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
                            >
                                <UIcon
                                    name="i-lucide-smartphone"
                                    class="w-5 h-5 text-purple-600 dark:text-purple-400"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 dark:text-white">
                                    QPay бүртгүүлэх
                                </h3>
                                <p class="text-sm text-gray-500">Мерчант мэдээллээ оруулна уу</p>
                            </div>
                        </div>
                    </template>

                    <div class="max-h-[70vh] overflow-y-auto px-1">
                        <QPayMerchantForm
                            :default-bank-account="{
                                bank_name: state.bank_account_bank_name,
                                bank_code: state.bank_account_bank_code,
                                account_number: state.bank_account_account_number,
                                account_name: state.bank_account_account_name,
                                note: state.bank_account_note
                            }"
                            @success="onQPayRegisterSuccess"
                            @cancel="showQPayRegisterModal = false"
                        />
                    </div>
                </UCard>
            </template>
        </UModal>

        <!-- Delete Account Confirmation Modal -->
        <UModal v-model:open="showDeleteAccountModal">
            <template #content>
                <div class="p-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                            <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">Бүртгэл устгах уу?</h3>
                            <p class="text-sm text-gray-500">Энэ үйлдлийг буцаах боломжгүй</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Бүх бараа, захиалга, хэрэглэгчийн мэдээлэл бүрмөсөн устгагдах болно. Итгэлтэй байна уу?
                    </p>
                    <div class="flex justify-end gap-3">
                        <UButton variant="ghost" color="neutral" @click="showDeleteAccountModal = false">Болих</UButton>
                        <UButton color="error" :loading="deletingAccount" @click="onDeleteAccount">Бүртгэл устгах</UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
