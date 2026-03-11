<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import { useShopBackgrounds } from '~/composables/useShopBackgrounds'
const props = defineProps<{
    open: boolean
    productId?: number
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
}>()

const isOpen = computed({
    get: () => props.open,
    set: (val: boolean) => emit('update:open', val)
})

const { fetchProducts } = useProducts()
const { getPreviewImageUrl, generateCaptionStream, generateAIImage, postToFacebook } =
    useProductPost()
const { backgrounds, addBackground, fetchShop, shop } = useShopBackgrounds()
const toast = useToast()

const products = ref<Product[]>([])
const selectedProductId = ref<number | undefined>(undefined)
const selectedTemplate = ref('classic')
const bgColor = ref('#FFFFFF')
const caption = ref('')
const watchComments = ref(true)
const commentMode = ref<'all' | 'keywords'>('keywords')
const loadingProducts = ref(false)
const loadingCaption = ref(false)
const posting = ref(false)
const previewKey = ref(0)

const purpose = ref<'normal' | 'sale' | 'new_arrival'>('normal')
const imageMode = ref<'template' | 'ai'>('template')
const selectedBackground = ref<string | undefined>(undefined)
const aiImageUrl = ref<string | undefined>(undefined)
const loadingAIImage = ref(false)
const uploadingBg = ref(false)
const bgFileRef = ref<HTMLInputElement>()

const purposes = [
    { value: 'normal' as const, label: 'Энгийн', icon: 'i-lucide-package' },
    { value: 'sale' as const, label: 'Хямдрал', icon: 'i-lucide-percent' },
    { value: 'new_arrival' as const, label: 'Шинэ бараа', icon: 'i-lucide-sparkles' }
]

const presetColors = [
    { label: 'Цагаан', value: '#FFFFFF' },
    { label: 'Хар', value: '#1F2937' },
    { label: 'Цэнхэр', value: '#0EA5E9' },
    { label: 'Ягаан', value: '#F43F5E' },
    { label: 'Шар', value: '#F59E0B' },
    { label: 'Шөнийн цэнхэр', value: '#1A1A2E' },
    { label: 'Дулаан цагаан', value: '#FFF7ED' }
]

const templates = [
    {
        value: 'classic',
        label: 'Сонгодог',
        description: 'Лого, цэгэн дэвсгэр, сүүдэртэй зураг'
    },
    {
        value: 'minimal',
        label: 'Энгийн',
        description: 'Булангийн хүрээ, их зай, премиум'
    },
    {
        value: 'elegant',
        label: 'Гоёмсог',
        description: 'Алтан хүрээ, serif фонт, алмааз чимэг'
    },
    {
        value: 'sale',
        label: 'Хямдрал',
        description: 'SALE тууз, улаан үнийн шошго'
    }
]

const isPrepopulated = computed(() => props.productId !== undefined)
const prepopulatedProduct = computed(() =>
    props.productId !== undefined ? products.value.find((p) => p.id === props.productId) : undefined
)

const selectedProduct = computed(() =>
    selectedProductId.value !== undefined
        ? products.value.find((p) => p.id === selectedProductId.value)
        : undefined
)

const productOptions = computed(() =>
    products.value
        .filter((p) => p.status === 'active')
        .map((p) => ({
            label: p.name,
            value: p.id
        }))
)

const previewUrl = computed(() => {
    if (!selectedProductId.value) return ''
    return getPreviewImageUrl(
        selectedProductId.value,
        selectedTemplate.value,
        bgColor.value,
        selectedBackground.value
    )
})

// Build the final caption with watch comment suffix
const finalCaption = computed(() => {
    let text = caption.value.trim()
    if (!text) return ''
    if (watchComments.value && selectedProduct.value) {
        const sku = selectedProduct.value.search_keywords
        if (commentMode.value === 'keywords' && sku) {
            text += `\n\n📝 Сагсанд нэмэхийн тулд "${sku}" гэж коммент бичнэ үү.`
        } else {
            text += '\n\n📝 Сагсанд нэмэхийн тулд коммент бичнэ үү.'
        }
    }
    return text
})

let colorDebounceTimer: ReturnType<typeof setTimeout> | null = null

function onColorChange(newColor: string) {
    if (colorDebounceTimer) clearTimeout(colorDebounceTimer)
    colorDebounceTimer = setTimeout(() => {
        bgColor.value = newColor
        previewKey.value++
    }, 500)
}

function onPresetColor(color: string) {
    bgColor.value = color
    previewKey.value++
}

function onTemplateChange(template: string) {
    selectedTemplate.value = template
    previewKey.value++
}

function onPurposeChange(p: 'normal' | 'sale' | 'new_arrival') {
    purpose.value = p
    if (p === 'sale' && imageMode.value === 'template') {
        selectedTemplate.value = 'sale'
        previewKey.value++
    }
}

function onBackgroundSelect(url: string | undefined) {
    selectedBackground.value = url
    previewKey.value++
    if (imageMode.value === 'ai') {
        aiImageUrl.value = undefined
    }
}

function onImageModeChange(mode: 'template' | 'ai') {
    imageMode.value = mode
    aiImageUrl.value = undefined
}

async function handleBgUpload(e: Event) {
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

async function loadProducts() {
    loadingProducts.value = true
    try {
        const res = await fetchProducts({ size: 100, status: 'active' })
        products.value = res.products || []
    } catch {
        toast.add({ title: 'Бараа ачаалахад алдаа гарлаа', color: 'error' })
    } finally {
        loadingProducts.value = false
    }
}

async function handleGenerateCaption() {
    if (!selectedProductId.value) {
        toast.add({ title: 'Бараа сонгоно уу', color: 'warning' })
        return
    }

    loadingCaption.value = true
    caption.value = ''
    try {
        await generateCaptionStream(
            selectedProductId.value,
            (text) => {
                caption.value = text
            },
            undefined,
            purpose.value
        )
    } catch {
        toast.add({ title: 'AI caption үүсгэхэд алдаа гарлаа', color: 'error' })
    } finally {
        loadingCaption.value = false
    }
}

async function handleGenerateAIImage() {
    if (!selectedProductId.value) {
        toast.add({ title: 'Бараа сонгоно уу', color: 'warning' })
        return
    }

    loadingAIImage.value = true
    aiImageUrl.value = undefined
    try {
        aiImageUrl.value = await generateAIImage(
            selectedProductId.value,
            purpose.value,
            selectedBackground.value
        )
    } catch {
        toast.add({ title: 'AI зураг үүсгэхэд алдаа гарлаа', color: 'error' })
    } finally {
        loadingAIImage.value = false
    }
}

async function handlePost() {
    if (!selectedProductId.value) {
        toast.add({ title: 'Бараа сонгоно уу', color: 'warning' })
        return
    }
    if (!caption.value.trim()) {
        toast.add({ title: 'Тайлбар бичнэ үү', color: 'warning' })
        return
    }
    if (imageMode.value === 'ai' && !aiImageUrl.value) {
        toast.add({ title: 'AI зураг үүсгэнэ үү', color: 'warning' })
        return
    }

    posting.value = true
    try {
        await postToFacebook(selectedProductId.value, {
            template: selectedTemplate.value,
            bg_color: bgColor.value,
            caption: finalCaption.value,
            watch_comments: watchComments.value,
            comment_mode: watchComments.value ? commentMode.value : undefined,
            purpose: purpose.value,
            mode: imageMode.value,
            background: selectedBackground.value,
            ai_image_url: aiImageUrl.value
        })
        toast.add({ title: 'Facebook-д амжилттай нийтэллээ!', color: 'success' })
        isOpen.value = false
    } catch (err: any) {
        const message = err?.data?.message || err?.message || 'Алдаа гарлаа'
        toast.add({ title: 'Нийтлэхэд алдаа гарлаа', description: message, color: 'error' })
    } finally {
        posting.value = false
    }
}

function resetState() {
    caption.value = ''
    watchComments.value = true
    commentMode.value = 'keywords'
    purpose.value = 'normal'
    imageMode.value = 'template'
    selectedBackground.value = undefined
    aiImageUrl.value = undefined
    if (!isPrepopulated.value) {
        selectedProductId.value = undefined
    }
}

watch(isOpen, (val) => {
    if (val) {
        if (props.productId !== undefined) {
            selectedProductId.value = props.productId
        }
        if (products.value.length === 0) {
            loadProducts()
        }
        fetchShop()
    } else {
        resetState()
    }
})

watch(
    () => props.productId,
    (newId) => {
        if (newId !== undefined && isOpen.value) {
            selectedProductId.value = newId
        }
    }
)
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :ui="{
            // width: 'sm:max-w-5xl',
            content: 'p-0 max-w-5xl'
        }"
    >
        <template #content>
            <div class="flex flex-col h-[85vh]">
                <!-- Header -->
                <div
                    class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
                >
                    <div>
                        <h2 class="text-lg font-semibold">Facebook-д нийтлэх</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Барааны зураг, тайлбар бэлтгэж нийтлэх
                        </p>
                    </div>
                    <UButton
                        icon="i-lucide-x"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        @click="isOpen = false"
                    />
                </div>

                <!-- Body: Two columns -->
                <div class="flex-1 flex overflow-hidden">
                    <!-- Left: Controls -->
                    <div
                        class="w-1/2 overflow-y-auto p-6 space-y-5 border-r border-gray-200 dark:border-gray-700"
                    >
                        <!-- Product selector -->
                        <div v-if="isPrepopulated">
                            <label class="block text-sm font-medium mb-1.5">Бараа</label>
                            <div
                                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                            >
                                <UIcon
                                    name="i-lucide-package"
                                    class="w-4 h-4 text-primary-500 shrink-0"
                                />
                                <span
                                    class="text-sm font-medium text-primary-700 dark:text-primary-300"
                                >
                                    {{ prepopulatedProduct?.name ?? `Бараа #${productId}` }}
                                </span>
                                <span
                                    v-if="prepopulatedProduct?.search_keywords"
                                    class="ml-auto text-xs font-mono text-gray-400"
                                >
                                    {{ prepopulatedProduct.search_keywords }}
                                </span>
                            </div>
                        </div>
                        <div v-else>
                            <label class="block text-sm font-medium mb-1.5">Бараа сонгох</label>
                            <USelectMenu
                                v-model="selectedProductId"
                                :items="productOptions"
                                placeholder="Бараа хайх..."
                                value-key="value"
                                :loading="loadingProducts"
                            />
                        </div>

                        <!-- Image Mode -->
                        <div>
                            <label class="block text-sm font-medium mb-1.5">Зургийн горим</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button
                                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all cursor-pointer"
                                    :class="
                                        imageMode === 'template'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    "
                                    @click="onImageModeChange('template')"
                                >
                                    <UIcon
                                        name="i-lucide-layout-template"
                                        class="size-5 shrink-0"
                                    />
                                    <div class="text-left">
                                        <span class="text-sm font-medium block">Загвар</span>
                                        <span class="text-xs text-gray-400">Үнэгүй</span>
                                    </div>
                                </button>
                                <button
                                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all cursor-pointer relative"
                                    :class="
                                        imageMode === 'ai'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    "
                                    @click="onImageModeChange('ai')"
                                >
                                    <span
                                        class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                    >
                                        PRO
                                    </span>
                                    <UIcon name="i-lucide-wand-2" class="size-5 shrink-0" />
                                    <div class="text-left">
                                        <span class="text-sm font-medium block">AI зураг</span>
                                        <span class="text-xs text-gray-400">Pro plan</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- Purpose -->
                        <div>
                            <label class="block text-sm font-medium mb-1.5">Зорилго</label>
                            <div class="flex gap-2">
                                <button
                                    v-for="p in purposes"
                                    :key="p.value"
                                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border"
                                    :class="
                                        purpose === p.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                    "
                                    @click="onPurposeChange(p.value)"
                                >
                                    <UIcon :name="p.icon" class="w-3.5 h-3.5" />
                                    {{ p.label }}
                                </button>
                            </div>
                        </div>

                        <!-- Template selector -->
                        <div v-if="imageMode === 'template'">
                            <label class="block text-sm font-medium mb-1.5">Загвар</label>
                            <div class="grid grid-cols-4 gap-1.5">
                                <button
                                    v-for="t in templates"
                                    :key="t.value"
                                    class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-pointer"
                                    :class="
                                        selectedTemplate === t.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    "
                                    @click="onTemplateChange(t.value)"
                                >
                                    <!-- Classic -->
                                    <TemplatePreviewClassic v-if="t.value === 'classic'" />
                                    <!-- Minimal -->
                                    <TemplatePreviewMinimal v-else-if="t.value === 'minimal'" />
                                    <!-- Elegant -->
                                    <TemplatePreviewElegant v-else-if="t.value === 'elegant'" />
                                    <!-- Sale -->
                                    <TemplatePreviewSale v-else-if="t.value === 'sale'" />

                                    <span class="text-xs font-medium">{{ t.label }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Color picker (template mode) -->
                        <div v-if="imageMode === 'template'">
                            <label class="block text-sm font-medium mb-1.5">Дэвсгэр өнгө</label>
                            <div class="flex items-center gap-3">
                                <div class="flex gap-1.5">
                                    <button
                                        v-for="c in presetColors"
                                        :key="c.value"
                                        class="w-6 h-6 rounded-full border-2 transition-all cursor-pointer"
                                        :class="
                                            bgColor === c.value
                                                ? 'border-primary-500 scale-110'
                                                : 'border-gray-300 dark:border-gray-600'
                                        "
                                        :style="{ backgroundColor: c.value }"
                                        :title="c.label"
                                        @click="onPresetColor(c.value)"
                                    />
                                </div>
                                <input
                                    type="color"
                                    :value="bgColor"
                                    class="w-7 h-7 rounded cursor-pointer border-0"
                                    @input="
                                        onColorChange(($event.target as HTMLInputElement).value)
                                    "
                                />
                            </div>
                        </div>

                        <!-- AI Image generation (ai mode) -->
                        <div v-if="imageMode === 'ai' && selectedProductId">
                            <label class="block text-sm font-medium mb-1.5">AI зураг</label>
                            <div class="flex gap-2">
                                <UButton
                                    icon="i-lucide-sparkles"
                                    :loading="loadingAIImage"
                                    @click="handleGenerateAIImage"
                                >
                                    {{ aiImageUrl ? 'Дахин үүсгэх' : 'AI зураг үүсгэх' }}
                                </UButton>
                            </div>
                        </div>

                        <!-- Background images -->
                        <div>
                            <label class="block text-sm font-medium mb-1.5">Дэвсгэр зураг</label>
                            <div class="flex gap-2 flex-wrap">
                                <button
                                    class="w-12 h-12 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center"
                                    :class="
                                        !selectedBackground
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    "
                                    @click="onBackgroundSelect(undefined)"
                                >
                                    <UIcon name="i-lucide-ban" class="size-5 text-gray-400" />
                                </button>
                                <button
                                    v-for="bg in backgrounds"
                                    :key="bg"
                                    class="w-12 h-12 rounded-lg border-2 transition-all cursor-pointer overflow-hidden"
                                    :class="
                                        selectedBackground === bg
                                            ? 'border-primary-500'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    "
                                    @click="onBackgroundSelect(bg)"
                                >
                                    <img
                                        :src="bg"
                                        class="w-full h-full object-cover"
                                        alt="Background"
                                    />
                                </button>
                                <button
                                    v-if="backgrounds.length < 10"
                                    class="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors"
                                    :disabled="uploadingBg"
                                    @click="bgFileRef?.click()"
                                >
                                    <UIcon
                                        v-if="uploadingBg"
                                        name="i-lucide-loader-2"
                                        class="size-5 animate-spin text-gray-400"
                                    />
                                    <UIcon
                                        v-else
                                        name="i-lucide-plus"
                                        class="size-5 text-gray-400"
                                    />
                                </button>
                                <input
                                    ref="bgFileRef"
                                    type="file"
                                    class="hidden"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    @change="handleBgUpload"
                                />
                            </div>
                        </div>

                        <!-- Caption -->
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="text-sm font-medium">Тайлбар</label>
                                <UButton
                                    size="xs"
                                    variant="soft"
                                    icon="i-lucide-sparkles"
                                    :loading="loadingCaption"
                                    :disabled="!selectedProductId"
                                    @click="handleGenerateCaption"
                                >
                                    AI-р үүсгэх
                                </UButton>
                            </div>
                            <UTextarea
                                v-model="caption"
                                placeholder="Барааны тайлбар бичих..."
                                :rows="4"
                                class="w-full"
                            />
                        </div>

                        <!-- Watch Comments -->
                        <div class="space-y-3">
                            <div
                                class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                            >
                                <USwitch v-model="watchComments" class="mt-0.5 shrink-0" />
                                <div>
                                    <p class="text-sm font-medium">Автоматаар захиалга авах</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Коммент бичсэн хэрэглэгчид тухайн барааг картанд нэмж,
                                        Messenger-ээр мэдэгдэл явуулна.
                                    </p>
                                </div>
                            </div>

                            <!-- Comment mode toggle (only when watchComments is on) -->
                            <div v-if="watchComments" class="pl-3">
                                <label
                                    class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2"
                                    >Захиалга хүлээн авах горим</label
                                >
                                <div class="flex gap-2">
                                    <button
                                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border"
                                        :class="
                                            commentMode === 'all'
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                        "
                                        @click="commentMode = 'all'"
                                    >
                                        <UIcon name="i-lucide-message-circle" class="w-3.5 h-3.5" />
                                        Бүх коммент
                                    </button>
                                    <button
                                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border"
                                        :class="
                                            commentMode === 'keywords'
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                        "
                                        @click="commentMode = 'keywords'"
                                    >
                                        <UIcon name="i-lucide-hash" class="w-3.5 h-3.5" />
                                        Зөвхөн түлхүүр үг
                                    </button>
                                </div>

                                <p
                                    v-if="commentMode === 'all'"
                                    class="text-xs text-gray-400 mt-1.5"
                                >
                                    Ямар ч коммент бичвэл сагсанд автоматаар нэмнэ.
                                </p>
                                <div v-else class="mt-2">
                                    <p class="text-xs text-gray-400 mb-1.5">
                                        Доорх түлхүүр үгийг коммент бичвэл сагсанд нэмнэ:
                                    </p>
                                    <div
                                        v-if="selectedProduct?.search_keywords"
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                                    >
                                        <UIcon
                                            name="i-lucide-hash"
                                            class="w-3.5 h-3.5 text-primary-500"
                                        />
                                        <span
                                            class="text-sm font-semibold font-mono text-primary-700 dark:text-primary-300"
                                        >
                                            {{ selectedProduct?.search_keywords }}
                                        </span>
                                    </div>
                                    <p v-else class="text-xs text-amber-500 dark:text-amber-400">
                                        <UIcon
                                            name="i-lucide-alert-triangle"
                                            class="w-3 h-3 inline-block mr-0.5"
                                        />
                                        Бараанд SKU код тохируулаагүй байна.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Preview (Facebook-style) -->
                    <div
                        class="w-1/2 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-950 flex flex-col items-center"
                    >
                        <label
                            class="block text-xs font-medium mb-3 text-gray-400 dark:text-gray-500 self-start"
                        >
                            <UIcon name="i-lucide-eye" class="w-3 h-3 inline-block mr-1" />
                            Facebook нийтлэлийн урьдчилсан харагдац
                        </label>

                        <div v-if="selectedProductId" class="w-full max-w-[420px]">
                            <!-- Facebook Post Card -->
                            <div
                                class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
                            >
                                <!-- Post Header -->
                                <div class="flex items-center gap-2.5 px-4 py-3">
                                    <div
                                        class="w-10 h-10 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
                                    >
                                        <img
                                            v-if="shop?.picture"
                                            :src="shop.picture"
                                            :alt="shop.name"
                                            class="w-full h-full object-cover"
                                        />
                                        <UIcon
                                            v-else
                                            name="i-lucide-store"
                                            class="w-5 h-5 text-blue-500"
                                        />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p
                                            class="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight truncate"
                                        >
                                            {{ shop?.name || 'Таны дэлгүүр' }}
                                        </p>
                                        <div
                                            class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                                        >
                                            <span>Яг одоо</span>
                                            <span class="text-gray-300 dark:text-gray-600">·</span>
                                            <UIcon name="i-lucide-globe" class="w-3 h-3" />
                                        </div>
                                    </div>
                                    <UIcon name="i-lucide-ellipsis" class="w-5 h-5 text-gray-400" />
                                </div>

                                <!-- Caption -->
                                <div class="px-4 pb-2.5">
                                    <div
                                        v-if="finalCaption"
                                        class="text-[13px] text-gray-900 dark:text-gray-100 whitespace-pre-line leading-[1.35]"
                                    >
                                        {{
                                            finalCaption.length > 300
                                                ? finalCaption.slice(0, 300)
                                                : finalCaption
                                        }}<button
                                            v-if="finalCaption.length > 300"
                                            class="text-gray-500 dark:text-gray-400 hover:underline font-medium ml-0.5"
                                        >
                                            ... Цааш унших
                                        </button>
                                    </div>
                                    <div
                                        v-else
                                        class="text-[13px] text-gray-300 dark:text-gray-700 italic"
                                    >
                                        Тайлбар бичих эсвэл AI-р үүсгэх...
                                    </div>
                                </div>

                                <!-- Image -->
                                <div class="relative bg-gray-50 dark:bg-gray-800/50">
                                    <!-- Template mode image -->
                                    <img
                                        v-if="imageMode === 'template' && previewUrl"
                                        :key="previewKey"
                                        :src="previewUrl"
                                        alt="Preview"
                                        class="w-full aspect-square object-contain"
                                        crossorigin="use-credentials"
                                    />
                                    <!-- AI mode image -->
                                    <img
                                        v-else-if="imageMode === 'ai' && aiImageUrl"
                                        :src="aiImageUrl"
                                        alt="AI Generated"
                                        class="w-full aspect-square object-contain"
                                    />
                                    <!-- AI loading -->
                                    <div
                                        v-else-if="imageMode === 'ai' && loadingAIImage"
                                        class="w-full aspect-square flex flex-col items-center justify-center gap-3"
                                    >
                                        <UIcon
                                            name="i-lucide-loader-2"
                                            class="w-8 h-8 animate-spin text-primary-500"
                                        />
                                        <p class="text-sm text-gray-400">
                                            AI зураг үүсгэж байна...
                                        </p>
                                    </div>
                                    <!-- AI empty -->
                                    <div
                                        v-else-if="imageMode === 'ai'"
                                        class="w-full aspect-square flex flex-col items-center justify-center gap-2"
                                    >
                                        <UIcon
                                            name="i-lucide-image"
                                            class="w-10 h-10 text-gray-200 dark:text-gray-700"
                                        />
                                        <p class="text-xs text-gray-400">AI зураг үүсгэнэ үү</p>
                                    </div>
                                </div>

                                <!-- Engagement stats row -->
                                <div
                                    class="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400"
                                >
                                    <div class="flex items-center gap-1">
                                        <div class="flex -space-x-0.5">
                                            <div
                                                class="w-[18px] h-[18px] rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-900"
                                            >
                                                <UIcon
                                                    name="i-lucide-thumbs-up"
                                                    class="w-2.5 h-2.5 text-white"
                                                />
                                            </div>
                                            <div
                                                class="w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-900"
                                            >
                                                <UIcon
                                                    name="i-lucide-heart"
                                                    class="w-2.5 h-2.5 text-white"
                                                />
                                            </div>
                                        </div>
                                        <span class="ml-0.5">128</span>
                                    </div>
                                    <div class="flex gap-2.5">
                                        <span>24 сэтгэгдэл</span>
                                        <span>8 хуваалцсан</span>
                                    </div>
                                </div>

                                <!-- Divider -->
                                <div class="mx-4 border-t border-gray-200 dark:border-gray-800" />

                                <!-- Action buttons -->
                                <div class="grid grid-cols-3 px-2 py-1">
                                    <button
                                        class="flex items-center justify-center gap-1.5 py-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <UIcon
                                            name="i-lucide-thumbs-up"
                                            class="w-[18px] h-[18px]"
                                        />
                                        <span class="text-[13px] font-medium">Like</span>
                                    </button>
                                    <button
                                        class="flex items-center justify-center gap-1.5 py-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <UIcon
                                            name="i-lucide-message-circle"
                                            class="w-[18px] h-[18px]"
                                        />
                                        <span class="text-[13px] font-medium">Comment</span>
                                    </button>
                                    <button
                                        class="flex items-center justify-center gap-1.5 py-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <UIcon name="i-lucide-share" class="w-[18px] h-[18px]" />
                                        <span class="text-[13px] font-medium">Share</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Watch comments indicator -->
                            <div
                                v-if="watchComments"
                                class="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900/50"
                            >
                                <UIcon
                                    name="i-lucide-bot"
                                    class="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0"
                                />
                                <p class="text-xs text-primary-700 dark:text-primary-300">
                                    Автомат захиалга идэвхтэй — комментод захиалга үүснэ
                                </p>
                            </div>
                        </div>

                        <!-- Empty state -->
                        <div
                            v-else
                            class="flex-1 flex flex-col items-center justify-center text-center"
                        >
                            <UIcon
                                name="i-lucide-image-plus"
                                class="w-16 h-16 text-gray-200 dark:text-gray-700 mb-3"
                            />
                            <p class="text-sm text-gray-400">Бараа сонгож урьдчилан харах</p>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700"
                >
                    <UButton variant="outline" @click="isOpen = false"> Болих </UButton>
                    <UButton
                        icon="i-lucide-send"
                        :loading="posting"
                        :disabled="
                            !selectedProductId ||
                            !caption.trim() ||
                            (imageMode === 'ai' && !aiImageUrl)
                        "
                        @click="handlePost"
                    >
                        Facebook-д нийтлэх
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>
