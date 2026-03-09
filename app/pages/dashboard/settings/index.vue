<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, FormError } from '@nuxt/ui'
import { useShopSettings } from '~/composables/useShopSettings'
import { useQPay } from '~/composables/useQPay'
import { useShopBackgrounds } from '~/composables/useShopBackgrounds'

const { shop, isLoading, isSaving, fetchShop, updateShop } = useShopSettings()
const shopData = useShop()
const { status: qpayStatus, isLoading: qpayLoading, fetchStatus: fetchQPayStatus } = useQPay()
const { backgrounds, addBackground, removeBackground } = useShopBackgrounds()

const fileRef = ref<HTMLInputElement>()
const bgFileRef = ref<HTMLInputElement>()
const uploadingBg = ref(false)
const config = useRuntimeConfig()
const toast = useToast()
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
        await fetchUser()
    } catch (e) {
        toast.add({ title: 'Алдаа', description: 'Facebook салгахад алдаа гарлаа', color: 'error' })
    } finally {
        isDisconnecting.value = false
    }
}

const connectFacebook = async () => {
    isConnecting.value = true
    await navigateTo(`${config.public.apiUrl}/api/connect/facebook`, { external: true })
}
const showQPayRegisterModal = ref(false)

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
    max_featured_products: 6
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

// Removed unused computed properties showDeliveryFee and showFreeDeliveryOver
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
        state.trigger_keywords = shop.value.settings?.trigger_keywords || ['buy', 'invoice', 'авах', 'захиалах', 'авъя']
        state.like_comments = shop.value.settings?.like_comments || false
        state.auto_comment_enabled = shop.value.settings?.auto_comment_enabled || false
        state.auto_comment_text = shop.value.settings?.auto_comment_text || ''
        state.private_reply_enabled = shop.value.settings?.private_reply_enabled || false
        state.private_reply_message = shop.value.settings?.private_reply_message || ''
        state.max_quantity_per_item = shop.value.settings?.max_quantity_per_item || 10
        state.unpaid_order_cancel_hours = shop.value.settings?.unpaid_order_cancel_hours || 24
        state.payment_methods = shop.value.settings?.payment_methods || []
        state.max_featured_products = shop.value.settings?.max_featured_products || 6
    }
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
    try {
        await $fetch(`${config.public.apiUrl}/api/me`, {
            method: 'DELETE',
            credentials: 'include'
        })
        toast.add({ title: 'Амжилттай', description: 'Таны бүртгэл устгагдлаа' })
        await navigateTo('/login')
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.error || 'Бүртгэл устгахад алдаа гарлаа',
            color: 'error'
        })
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
            max_featured_products: state.max_featured_products
        }
    }
    await updateShop(updates)
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

            <!-- Section 2: Delivery Settings -->
            <DeliveryOptions
                v-model:delivery_type="state.delivery_type"
                v-model:delivery_fee="state.delivery_fee"
                v-model:free_delivery_over="state.free_delivery_over"
                v-model:delivery_note="state.delivery_note"
            />

            <!-- Section 3: Order Settings -->
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
                <USeparator />
                <UFormField
                    name="max_featured_products"
                    label="Checkout санал болгох барааны тоо"
                    description="Checkout хуудас дээр хэдэн санал болгох бараа харагдахыг тохируулна. Бараа тус бүр дээр одоор тэмдэглэнэ."
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <UInput
                        v-model.number="state.max_featured_products"
                        type="number"
                        min="1"
                        max="20"
                        autocomplete="off"
                    />
                </UFormField>
            </UPageCard>

            <!-- Section: Automation Settings -->
            <UPageCard
                title="Автоматжуулалт"
                description="Facebook комментоос захиалга үүсгэх, хариулт илгээх тохиргоо."
                variant="naked"
                class="mb-4"
            />

            <UPageCard variant="subtle" class="mb-8">
                <!-- Enable automation toggle -->
                <UFormField
                    name="automation_enabled"
                    label="Автоматжуулалт идэвхжүүлэх"
                    description="Facebook Live болон нийтлэлийн комментоос захиалга автоматаар үүсгэнэ."
                    class="flex items-center justify-between gap-2"
                >
                    <USwitch v-model="state.automation_enabled" />
                </UFormField>

                <USeparator />

                <!-- Trigger keywords -->
                <UFormField
                    name="trigger_keywords"
                    label="Trigger түлхүүр үгс"
                    description="Эдгээр үгсийг агуулсан коммент захиалга болно."
                    class="flex max-sm:flex-col justify-between items-start gap-4"
                >
                    <div class="flex flex-col gap-2 w-full">
                        <div class="flex flex-wrap gap-2">
                            <UBadge
                                v-for="kw in state.trigger_keywords"
                                :key="kw"
                                variant="soft"
                                color="primary"
                                class="flex items-center gap-1 cursor-pointer"
                                @click="removeKeyword(kw)"
                            >
                                {{ kw }}
                                <UIcon name="i-lucide-x" class="w-3 h-3" />
                            </UBadge>
                        </div>
                        <div class="flex gap-2">
                            <UInput
                                v-model="keywordInput"
                                placeholder="авах, buy, захиалах..."
                                class="flex-1"
                                @keydown="onKeywordKeydown"
                            />
                            <UButton
                                icon="i-lucide-plus"
                                color="neutral"
                                variant="subtle"
                                @click="addKeyword"
                            />
                        </div>
                        <p class="text-xs text-muted">Нэмэх товчийг дарна уу. Badge дээр дарвал устгана.</p>
                    </div>
                </UFormField>

                <USeparator />

                <!-- Like comments toggle -->
                <UFormField
                    name="like_comments"
                    label="Коммент like дарах"
                    description="Захиалга илрүүлсэн комментод автоматаар like дарна."
                    class="flex items-center justify-between gap-2"
                >
                    <USwitch v-model="state.like_comments" />
                </UFormField>

                <USeparator />

                <!-- Auto comment reply -->
                <UFormField
                    name="auto_comment_enabled"
                    label="Комментод нийтэд хариулах"
                    description="Захиалга илрүүлсэн комментод нийтэд харагдах хариулт илгээнэ."
                    class="flex items-center justify-between gap-2"
                >
                    <USwitch v-model="state.auto_comment_enabled" />
                </UFormField>

                <template v-if="state.auto_comment_enabled">
                    <USeparator />
                    <UFormField
                        name="auto_comment_text"
                        label="Нийтийн хариултын текст"
                        description="Комментод нийтэд харагдах хариулт."
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                        :ui="{ container: 'w-full' }"
                    >
                        <UTextarea
                            v-model="state.auto_comment_text"
                            :rows="2"
                            autoresize
                            class="w-full"
                            placeholder="Баярлалаа! Мессежээр захиалгын мэдээллийг илгээлэе."
                        />
                    </UFormField>
                </template>

                <USeparator />

                <!-- Private reply -->
                <UFormField
                    name="private_reply_enabled"
                    label="Хувийн мессеж илгээх"
                    description="Захиалга үүссэний дараа хэрэглэгчид хувийн мессеж илгээнэ."
                    class="flex items-center justify-between gap-2"
                >
                    <USwitch v-model="state.private_reply_enabled" />
                </UFormField>

                <template v-if="state.private_reply_enabled">
                    <USeparator />
                    <UFormField
                        name="private_reply_message"
                        label="Хувийн мессежийн загвар"
                        description="Загварт {checkout_link}, {order_number} ашиглаж болно."
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                        :ui="{ container: 'w-full' }"
                    >
                        <UTextarea
                            v-model="state.private_reply_message"
                            :rows="3"
                            autoresize
                            class="w-full"
                            placeholder="Захиалга #{order_number} бүртгэгдлээ! Төлбөр: {checkout_link}"
                        />
                    </UFormField>
                </template>
            </UPageCard>

            <!-- Section: Integrations -->
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
                            :loading="isConnecting"
                            @click="connectFacebook"
                        />
                    </div>
                </div>
            </UPageCard>

            <!-- Section 5: Security -->
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
                    class="flex flex-col gap-4 max-w-xs"
                    @submit="onPasswordSubmit"
                >
                    <UFormField name="current" label="Одоогийн нууц үг">
                        <UInput
                            v-model="password.current"
                            type="password"
                            placeholder="Одоогийн нууц үг"
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField name="new" label="Шинэ нууц үг">
                        <UInput
                            v-model="password.new"
                            type="password"
                            placeholder="Шинэ нууц үг"
                            class="w-full"
                        />
                    </UFormField>

                    <UButton label="Нууц үг шинэчлэх" class="w-fit" type="submit" color="neutral" />
                </UForm>
            </UPageCard>

            <!-- Section 6: Account Management -->
            <UPageCard
                title="Бүртгэл"
                description="Бүртгэлтэй холбоотой тохиргоо."
                variant="naked"
                class="mb-4"
            />

            <UPageCard
                variant="subtle"
                description="Манай үйлчилгээг цаашид ашиглахгүй бол бүртгэлээ устгах боломжтой. Энэ үйлдлийг буцаах боломжгүй бөгөөд бүх мэдээлэл бүрмөсөн устгагдах болно."
                class="bg-gradient-to-tl from-error/10 from-5% to-transparent"
            >
                <template #footer>
                    <UButton
                        label="Бүртгэл устгах"
                        color="error"
                        variant="subtle"
                        @click="onDeleteAccount"
                    />
                </template>
            </UPageCard>
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
                            @success="onQPayRegisterSuccess"
                            @cancel="showQPayRegisterModal = false"
                        />
                    </div>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
