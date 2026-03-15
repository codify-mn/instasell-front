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
            ...shop.value?.settings,
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
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-[var(--text-muted)]" />
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
                            class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center"
                        >
                            <UIcon
                                name="i-simple-icons-facebook"
                                class="w-5 h-5 text-primary-500"
                            />
                        </div>
                        <div>
                            <h4 class="font-medium text-[var(--text-heading)]">Facebook</h4>
                            <p v-if="user?.is_facebook_connected" class="text-sm text-[var(--text-muted)]">
                                Холбогдсон:
                                <span class="font-medium text-[var(--text-heading)]">{{
                                    shopData?.facebook_page?.page_name
                                }}</span>
                            </p>
                            <p v-else class="text-sm text-[var(--text-muted)]">
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
                                ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                                : 'border-[var(--border-primary)] hover:border-[var(--border-strong)]'"
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
                            class="w-10 h-10 rounded-xl bg-[var(--surface-inset)] flex items-center justify-center"
                        >
                            <UIcon
                                name="i-lucide-smartphone"
                                class="w-5 h-5 text-[var(--text-muted)]"
                            />
                        </div>
                        <div>
                            <h4 class="font-medium text-[var(--text-heading)]">QPay мерчант</h4>
                            <p class="text-sm text-[var(--text-muted)]">
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
                    <div class="flex items-center gap-2 px-3 py-2 bg-[var(--accent-warn-light)] rounded-lg border border-[var(--accent-warn)]/20">
                        <UIcon name="i-lucide-info" class="w-4 h-4 text-[var(--accent-warn-dark)] shrink-0" />
                        <p class="text-xs text-[var(--accent-warn-dark)]">
                            QPay бүртгэхийн өмнө дээрх <span class="font-semibold">Банкны мэдээлэл</span> хэсгийг бөглөнө үү — бүртгэлд автоматаар ашиглагдана.
                        </p>
                    </div>
                </template>

                <template v-if="qpayStatus?.is_registered && qpayStatus.bank_account">
                    <USeparator class="my-4" />
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-[var(--text-muted)]">
                            Бүртгэлтэй данс
                        </p>
                        <div
                            class="flex items-center gap-3 p-3 bg-[var(--surface-inset)] rounded-lg"
                        >
                            <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-[var(--text-placeholder)]" />
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
                        class="relative group w-24 h-24 rounded-lg overflow-hidden border border-[var(--border-primary)]"
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
                        class="w-24 h-24 rounded-lg border-2 border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary-400 transition-colors"
                        :disabled="uploadingBg"
                        @click="onBgFileClick"
                    >
                        <UIcon
                            v-if="uploadingBg"
                            name="i-lucide-loader-2"
                            class="w-5 h-5 animate-spin text-[var(--text-placeholder)]"
                        />
                        <template v-else>
                            <UIcon name="i-lucide-plus" class="w-5 h-5 text-[var(--text-placeholder)]" />
                            <span class="text-xs text-[var(--text-placeholder)]">Нэмэх</span>
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
                <p v-if="backgrounds.length === 0" class="text-sm text-[var(--text-placeholder)] mt-2">
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
                        <h4 class="font-medium text-[var(--text-heading)] mb-1">Бүртгэл устгах</h4>
                        <p class="text-sm text-[var(--text-muted)] max-w-md">
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
                                class="w-10 h-10 rounded-full bg-[var(--surface-inset)] flex items-center justify-center"
                            >
                                <UIcon
                                    name="i-lucide-smartphone"
                                    class="w-5 h-5 text-[var(--text-muted)]"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-[var(--text-heading)]">
                                    QPay бүртгүүлэх
                                </h3>
                                <p class="text-sm text-[var(--text-muted)]">Мерчант мэдээллээ оруулна уу</p>
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
                        <div class="w-10 h-10 rounded-full bg-[var(--accent-error-light)] flex items-center justify-center shrink-0">
                            <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-[var(--accent-error)]" />
                        </div>
                        <div>
                            <h3 class="font-semibold text-[var(--text-heading)]">Бүртгэл устгах уу?</h3>
                            <p class="text-sm text-[var(--text-muted)]">Энэ үйлдлийг буцаах боломжгүй</p>
                        </div>
                    </div>
                    <p class="text-sm text-[var(--text-muted)] mb-6">
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
