<script setup lang="ts">
import type { Product } from '~/composables/useProducts'

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
const { getPreviewImageUrl, generateCaption, postToFacebook } = useProductPost()
const toast = useToast()

const products = ref<Product[]>([])
const selectedProductId = ref<number | undefined>(undefined)
const selectedTemplate = ref('classic')
const bgColor = ref('#FFFFFF')
const caption = ref('')
const watchComments = ref(true)
const loadingProducts = ref(false)
const loadingCaption = ref(false)
const posting = ref(false)
const previewKey = ref(0)

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

// When productId prop is provided, use it directly and skip the dropdown
const isPrepopulated = computed(() => props.productId !== undefined)
const prepopulatedProduct = computed(() =>
    props.productId !== undefined ? products.value.find((p) => p.id === props.productId) : undefined
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
    return getPreviewImageUrl(selectedProductId.value, selectedTemplate.value, bgColor.value)
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
    try {
        caption.value = await generateCaption(selectedProductId.value)
    } catch {
        toast.add({ title: 'AI caption үүсгэхэд алдаа гарлаа', color: 'error' })
    } finally {
        loadingCaption.value = false
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

    posting.value = true
    try {
        await postToFacebook(selectedProductId.value, {
            template: selectedTemplate.value,
            bg_color: bgColor.value,
            caption: caption.value,
            watch_comments: watchComments.value
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
    <USlideover
        v-model:open="isOpen"
        title="Бараа нийтлэх"
        description="Facebook хуудсанд бараа зурагтай нийтлэх"
    >
        <template #body>
            <div class="flex flex-col gap-6">
                <!-- Product info chip (pre-selected) or selector -->
                <div v-if="isPrepopulated">
                    <label class="block text-sm font-medium mb-2">Бараа</label>
                    <div
                        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                    >
                        <UIcon name="i-lucide-package" class="w-4 h-4 text-primary-500 shrink-0" />
                        <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
                            {{ prepopulatedProduct?.name ?? `Бараа #${productId}` }}
                        </span>
                    </div>
                </div>
                <div v-else>
                    <label class="block text-sm font-medium mb-2">Бараа сонгох</label>
                    <USelectMenu
                        v-model="selectedProductId"
                        :items="productOptions"
                        placeholder="Бараа хайх..."
                        value-key="value"
                        :loading="loadingProducts"
                    />
                </div>

                <!-- Template selector -->
                <div>
                    <label class="block text-sm font-medium mb-2">Загвар</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button
                            v-for="t in templates"
                            :key="t.value"
                            class="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all cursor-pointer"
                            :class="
                                selectedTemplate === t.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            "
                            @click="onTemplateChange(t.value)"
                        >
                            <!-- Classic: dot-grid bg, circular logo, shadowed image, divider -->
                            <svg
                                v-if="t.value === 'classic'"
                                width="72"
                                height="90"
                                viewBox="0 0 72 90"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                class="rounded"
                            >
                                <rect
                                    width="72"
                                    height="90"
                                    rx="4"
                                    fill="#F9FAFB"
                                    class="dark:fill-gray-800"
                                />
                                <pattern
                                    id="dots-c"
                                    x="0"
                                    y="0"
                                    width="8"
                                    height="8"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <circle cx="1" cy="1" r="0.6" fill="#E5E7EB" />
                                </pattern>
                                <rect width="72" height="90" rx="4" fill="url(#dots-c)" />
                                <circle
                                    cx="36"
                                    cy="14"
                                    r="6"
                                    fill="#E0E7EF"
                                    stroke="#CBD5E1"
                                    stroke-width="1"
                                />
                                <line
                                    x1="16"
                                    y1="24"
                                    x2="56"
                                    y2="24"
                                    stroke="#E5E7EB"
                                    stroke-width="0.75"
                                />
                                <rect
                                    x="18"
                                    y="28"
                                    width="36"
                                    height="32"
                                    rx="3"
                                    fill="#E0E7EF"
                                    filter="url(#shadow-c)"
                                />
                                <defs>
                                    <filter
                                        id="shadow-c"
                                        x="14"
                                        y="26"
                                        width="44"
                                        height="40"
                                        filterUnits="userSpaceOnUse"
                                    >
                                        <feDropShadow
                                            dx="0"
                                            dy="2"
                                            stdDeviation="2"
                                            flood-opacity="0.12"
                                        />
                                    </filter>
                                </defs>
                                <rect x="20" y="66" width="28" height="3" rx="1.5" fill="#94A3B8" />
                                <rect x="20" y="73" width="18" height="3" rx="1.5" fill="#0EA5E9" />
                            </svg>

                            <!-- Minimal: corner brackets, horizontal rules, whitespace -->
                            <svg
                                v-else-if="t.value === 'minimal'"
                                width="72"
                                height="90"
                                viewBox="0 0 72 90"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                class="rounded"
                            >
                                <rect
                                    width="72"
                                    height="90"
                                    rx="4"
                                    fill="#FAFAFA"
                                    class="dark:fill-gray-800"
                                />
                                <!-- Top-left bracket -->
                                <path
                                    d="M8 8 L8 16 M8 8 L16 8"
                                    stroke="#94A3B8"
                                    stroke-width="1.2"
                                    fill="none"
                                />
                                <!-- Top-right bracket -->
                                <path
                                    d="M64 8 L64 16 M64 8 L56 8"
                                    stroke="#94A3B8"
                                    stroke-width="1.2"
                                    fill="none"
                                />
                                <!-- Bottom-left bracket -->
                                <path
                                    d="M8 82 L8 74 M8 82 L16 82"
                                    stroke="#94A3B8"
                                    stroke-width="1.2"
                                    fill="none"
                                />
                                <!-- Bottom-right bracket -->
                                <path
                                    d="M64 82 L64 74 M64 82 L56 82"
                                    stroke="#94A3B8"
                                    stroke-width="1.2"
                                    fill="none"
                                />
                                <line
                                    x1="14"
                                    y1="22"
                                    x2="58"
                                    y2="22"
                                    stroke="#D1D5DB"
                                    stroke-width="0.5"
                                />
                                <rect x="22" y="28" width="28" height="28" rx="2" fill="#E5E7EB" />
                                <line
                                    x1="14"
                                    y1="64"
                                    x2="58"
                                    y2="64"
                                    stroke="#D1D5DB"
                                    stroke-width="0.5"
                                />
                                <rect
                                    x="22"
                                    y="69"
                                    width="28"
                                    height="2.5"
                                    rx="1.25"
                                    fill="#94A3B8"
                                />
                                <rect
                                    x="26"
                                    y="75"
                                    width="20"
                                    height="2.5"
                                    rx="1.25"
                                    fill="#0EA5E9"
                                />
                            </svg>

                            <!-- Elegant: double border, gold diamonds, serif feel, ornamental divider -->
                            <svg
                                v-else-if="t.value === 'elegant'"
                                width="72"
                                height="90"
                                viewBox="0 0 72 90"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                class="rounded"
                            >
                                <rect width="72" height="90" rx="4" fill="#1A1A2E" />
                                <rect
                                    x="4"
                                    y="4"
                                    width="64"
                                    height="82"
                                    rx="2"
                                    stroke="#B8860B"
                                    stroke-width="0.75"
                                    fill="none"
                                />
                                <rect
                                    x="7"
                                    y="7"
                                    width="58"
                                    height="76"
                                    rx="1"
                                    stroke="#B8860B"
                                    stroke-width="0.5"
                                    fill="none"
                                />
                                <!-- Corner diamonds -->
                                <polygon points="8,8 10,6 12,8 10,10" fill="#B8860B" />
                                <polygon points="60,8 62,6 64,8 62,10" fill="#B8860B" />
                                <polygon points="8,82 10,80 12,82 10,84" fill="#B8860B" />
                                <polygon points="60,82 62,80 64,82 62,84" fill="#B8860B" />
                                <rect
                                    x="20"
                                    y="14"
                                    width="32"
                                    height="28"
                                    rx="2"
                                    stroke="#B8860B"
                                    stroke-width="0.5"
                                    fill="#2A2A3E"
                                />
                                <rect x="22" y="16" width="28" height="24" rx="1" fill="#3A3A4E" />
                                <!-- Ornamental divider with diamond -->
                                <line
                                    x1="14"
                                    y1="50"
                                    x2="30"
                                    y2="50"
                                    stroke="#B8860B"
                                    stroke-width="0.5"
                                />
                                <polygon points="36,48 38,50 36,52 34,50" fill="#B8860B" />
                                <line
                                    x1="42"
                                    y1="50"
                                    x2="58"
                                    y2="50"
                                    stroke="#B8860B"
                                    stroke-width="0.5"
                                />
                                <rect x="18" y="56" width="36" height="3" rx="1.5" fill="#C9A84C" />
                                <rect x="22" y="63" width="28" height="3" rx="1.5" fill="#B8860B" />
                            </svg>

                            <!-- Sale: chevron pattern, diagonal ribbon, price pill, strikethrough -->
                            <svg
                                v-else-if="t.value === 'sale'"
                                width="72"
                                height="90"
                                viewBox="0 0 72 90"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                class="rounded"
                            >
                                <rect width="72" height="90" rx="4" fill="#FFF7ED" />
                                <!-- Chevron pattern -->
                                <path
                                    d="M0 12 L6 6 L12 12 M12 12 L18 6 L24 12 M24 12 L30 6 L36 12 M36 12 L42 6 L48 12 M48 12 L54 6 L60 12 M60 12 L66 6 L72 12"
                                    stroke="#FDBA74"
                                    stroke-width="0.6"
                                    stroke-opacity="0.4"
                                    fill="none"
                                />
                                <path
                                    d="M0 24 L6 18 L12 24 M12 24 L18 18 L24 24 M24 24 L30 18 L36 24 M36 24 L42 18 L48 24 M48 24 L54 18 L60 24 M60 24 L66 18 L72 24"
                                    stroke="#FDBA74"
                                    stroke-width="0.6"
                                    stroke-opacity="0.3"
                                    fill="none"
                                />
                                <!-- Diagonal SALE ribbon -->
                                <polygon points="46,0 72,0 72,26" fill="#EF4444" />
                                <text
                                    x="54"
                                    y="16"
                                    transform="rotate(45, 59, 13)"
                                    fill="white"
                                    font-size="5"
                                    font-weight="bold"
                                    text-anchor="middle"
                                >
                                    SALE
                                </text>
                                <!-- Product image -->
                                <rect x="18" y="22" width="36" height="32" rx="3" fill="#FED7AA" />
                                <rect x="26" y="30" width="20" height="16" rx="1" fill="#FDBA74" />
                                <!-- Strikethrough old price -->
                                <rect x="16" y="62" width="18" height="3" rx="1.5" fill="#9CA3AF" />
                                <line
                                    x1="15"
                                    y1="63.5"
                                    x2="35"
                                    y2="63.5"
                                    stroke="#EF4444"
                                    stroke-width="0.75"
                                />
                                <!-- Price pill -->
                                <rect x="16" y="69" width="40" height="10" rx="5" fill="#EF4444" />
                                <rect
                                    x="24"
                                    y="72"
                                    width="24"
                                    height="4"
                                    rx="2"
                                    fill="white"
                                    fill-opacity="0.9"
                                />
                            </svg>

                            <span class="text-xs font-medium mt-0.5">{{ t.label }}</span>
                        </button>
                    </div>
                </div>

                <!-- Color picker -->
                <div>
                    <label class="block text-sm font-medium mb-2">Дэвсгэр өнгө</label>
                    <div class="flex items-center gap-3">
                        <div class="flex gap-1.5">
                            <button
                                v-for="c in presetColors"
                                :key="c.value"
                                class="w-7 h-7 rounded-full border-2 transition-all cursor-pointer"
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
                            class="w-8 h-8 rounded cursor-pointer border-0"
                            @input="onColorChange(($event.target as HTMLInputElement).value)"
                        />
                    </div>
                </div>

                <!-- Image preview -->
                <div v-if="selectedProductId">
                    <label class="block text-sm font-medium mb-2">Урьдчилан харах</label>
                    <div
                        class="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                    >
                        <img
                            :key="previewKey"
                            :src="previewUrl"
                            alt="Preview"
                            class="w-full h-full object-contain"
                            crossorigin="use-credentials"
                        />
                    </div>
                </div>
                <div
                    v-else
                    class="flex items-center justify-center h-40 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                    <p class="text-sm text-gray-400">Бараа сонгож урьдчилан харах</p>
                </div>

                <!-- Caption -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium">Тайлбар</label>
                        <UButton
                            size="xs"
                            variant="soft"
                            icon="i-lucide-sparkles"
                            :loading="loadingCaption"
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

                <!-- Watch Comments toggle -->
                <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <USwitch v-model="watchComments" class="mt-0.5 shrink-0" />
                    <div>
                        <p class="text-sm font-medium">Автоматаар захиалга авах</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Нийтлэл дээр сэтгэгдэл үлдээсэн хэрэглэгчид тухайн барааг картанд нэмж,
                            Messenger-ээр мэдэгдэл явуулна.
                        </p>
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex gap-2 w-full">
                <UButton variant="outline" class="flex-1" @click="emit('update:open', false)">
                    Болих
                </UButton>
                <UButton
                    class="flex-1"
                    icon="i-lucide-send"
                    :loading="posting"
                    :disabled="!selectedProductId || !caption.trim()"
                    @click="handlePost"
                >
                    Facebook-д нийтлэх
                </UButton>
            </div>
        </template>
    </USlideover>
</template>
