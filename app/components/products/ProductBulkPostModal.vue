<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import { useShopBackgrounds } from '~/composables/useShopBackgrounds'

const props = defineProps<{
    open: boolean
    products: Product[]
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    'success': []
}>()

const isOpen = computed({
    get: () => props.open,
    set: (val: boolean) => emit('update:open', val)
})

const { getPreviewImageUrl, generateCaptionStream, postToFacebook } = useProductPost()
const { backgrounds, addBackground, fetchShop, shop } = useShopBackgrounds()
const toast = useToast()

const selectedTemplate = ref('classic')
const bgColor = ref('#FFFFFF')
const watchComments = ref(true)
const commentMode = ref<'all' | 'keywords'>('keywords')
const purpose = ref<'normal' | 'sale' | 'new_arrival'>('normal')
const selectedBackground = ref<string | undefined>(undefined)
const uploadingBg = ref(false)
const bgFileRef = ref<HTMLInputElement>()
const previewKey = ref(0)

// Per-product captions
const captions = ref<Record<number, string>>({})
const activeProductIndex = ref(0)
const generatingCaptionFor = ref<number | null>(null)
const posting = ref(false)
const postingProgress = ref(0)

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
    { value: 'classic', label: 'Сонгодог' },
    { value: 'minimal', label: 'Энгийн' },
    { value: 'elegant', label: 'Гоёмсог' },
    { value: 'sale', label: 'Хямдрал' }
]

const activeProduct = computed(() => props.products[activeProductIndex.value])

const previewUrl = computed(() => {
    if (!activeProduct.value) return ''
    return getPreviewImageUrl(
        activeProduct.value.id,
        selectedTemplate.value,
        bgColor.value,
        selectedBackground.value
    )
})

const allCaptionsReady = computed(() =>
    props.products.every((p) => captions.value[p.id]?.trim())
)

function onPresetColor(color: string) {
    bgColor.value = color
    previewKey.value++
}

let colorDebounceTimer: ReturnType<typeof setTimeout> | null = null
function onColorChange(newColor: string) {
    if (colorDebounceTimer) clearTimeout(colorDebounceTimer)
    colorDebounceTimer = setTimeout(() => {
        bgColor.value = newColor
        previewKey.value++
    }, 500)
}

function onPurposeChange(p: 'normal' | 'sale' | 'new_arrival') {
    purpose.value = p
    if (p === 'sale') {
        selectedTemplate.value = 'sale'
        previewKey.value++
    }
}

function onBackgroundSelect(url: string | undefined) {
    selectedBackground.value = url
    previewKey.value++
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

async function generateCaptionForProduct(product: Product) {
    generatingCaptionFor.value = product.id
    captions.value[product.id] = ''
    try {
        await generateCaptionStream(
            product.id,
            (text) => {
                captions.value[product.id] = text
            },
            undefined,
            purpose.value
        )
    } catch {
        toast.add({ title: 'AI caption үүсгэхэд алдаа гарлаа', color: 'error' })
    } finally {
        generatingCaptionFor.value = null
    }
}

async function generateAllCaptions() {
    for (const product of props.products) {
        if (captions.value[product.id]?.trim()) continue
        await generateCaptionForProduct(product)
    }
}

function buildFinalCaption(product: Product): string {
    let text = (captions.value[product.id] || '').trim()
    if (!text) return ''
    if (watchComments.value) {
        const sku = product.keyword
        if (commentMode.value === 'keywords' && sku) {
            text += `\n\n📝 Сагсанд нэмэхийн тулд "${sku}" гэж коммент бичнэ үү.`
        } else {
            text += '\n\n📝 Сагсанд нэмэхийн тулд коммент бичнэ үү.'
        }
    }
    return text
}

async function handleBulkPost() {
    if (!allCaptionsReady.value) {
        toast.add({ title: 'Бүх барааны тайлбар бичнэ үү', color: 'warning' })
        return
    }

    posting.value = true
    postingProgress.value = 0
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < props.products.length; i++) {
        const product = props.products[i]!
        try {
            await postToFacebook(product.id, {
                template: selectedTemplate.value,
                bg_color: bgColor.value,
                caption: buildFinalCaption(product),
                watch_comments: watchComments.value,
                comment_mode: watchComments.value ? commentMode.value : undefined,
                purpose: purpose.value,
                mode: 'template',
                background: selectedBackground.value
            })
            successCount++
        } catch {
            errorCount++
        }
        postingProgress.value = i + 1
    }

    posting.value = false

    if (errorCount === 0) {
        toast.add({
            title: 'Амжилттай',
            description: `${successCount} бараа Facebook-д нийтлэгдлээ`,
            color: 'primary'
        })
        emit('success')
        isOpen.value = false
    } else {
        toast.add({
            title: 'Хэсэгчлэн нийтлэгдлээ',
            description: `${successCount} амжилттай, ${errorCount} алдаатай`,
            color: 'warning'
        })
    }
}

function resetState() {
    captions.value = {}
    activeProductIndex.value = 0
    posting.value = false
    postingProgress.value = 0
    purpose.value = 'normal'
    selectedBackground.value = undefined
}

watch(isOpen, (val) => {
    if (val) {
        fetchShop()
    } else {
        resetState()
    }
})
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :ui="{
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
                        <h2 class="text-lg font-semibold">Олноор нийтлэх</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ products.length }} бараа Facebook-д нийтлэх
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

                <div class="flex-1 flex overflow-hidden">
                    <!-- Left Panel: Settings + Product List -->
                    <div class="w-[55%] border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
                        <div class="p-5 space-y-5">
                            <!-- Purpose -->
                            <div>
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Нийтлэлийн зорилго
                                </label>
                                <div class="flex gap-2">
                                    <button
                                        v-for="p in purposes"
                                        :key="p.value"
                                        class="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                                        :class="
                                            purpose === p.value
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                        "
                                        @click="onPurposeChange(p.value)"
                                    >
                                        <UIcon :name="p.icon" class="w-4 h-4" />
                                        {{ p.label }}
                                    </button>
                                </div>
                            </div>

                            <!-- Template -->
                            <div>
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Зургийн загвар
                                </label>
                                <div class="grid grid-cols-4 gap-2">
                                    <button
                                        v-for="t in templates"
                                        :key="t.value"
                                        class="px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center"
                                        :class="
                                            selectedTemplate === t.value
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                        "
                                        @click="selectedTemplate = t.value; previewKey++"
                                    >
                                        {{ t.label }}
                                    </button>
                                </div>
                            </div>

                            <!-- Colors -->
                            <div>
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Дэвсгэр өнгө
                                </label>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <button
                                        v-for="c in presetColors"
                                        :key="c.value"
                                        class="w-7 h-7 rounded-full border-2 transition-all"
                                        :class="
                                            bgColor === c.value
                                                ? 'border-primary-500 scale-110'
                                                : 'border-gray-200 dark:border-gray-600'
                                        "
                                        :style="{ backgroundColor: c.value }"
                                        :title="c.label"
                                        @click="onPresetColor(c.value)"
                                    />
                                    <input
                                        type="color"
                                        :value="bgColor"
                                        class="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
                                        @input="onColorChange(($event.target as HTMLInputElement).value)"
                                    >
                                </div>
                            </div>

                            <!-- Background Images -->
                            <div v-if="backgrounds.length > 0 || true">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Дэвсгэр зураг
                                </label>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <button
                                        class="w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all"
                                        :class="
                                            !selectedBackground
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        "
                                        title="Өнгө ашиглах"
                                        @click="onBackgroundSelect(undefined)"
                                    >
                                        <UIcon name="i-lucide-ban" class="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        v-for="bg in backgrounds"
                                        :key="bg"
                                        class="w-10 h-10 rounded-lg border-2 overflow-hidden transition-all"
                                        :class="
                                            selectedBackground === bg
                                                ? 'border-primary-500 scale-105'
                                                : 'border-gray-200 dark:border-gray-700'
                                        "
                                        @click="onBackgroundSelect(bg)"
                                    >
                                        <img :src="bg" class="w-full h-full object-cover">
                                    </button>
                                    <button
                                        class="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
                                        :disabled="uploadingBg"
                                        @click="bgFileRef?.click()"
                                    >
                                        <UIcon
                                            v-if="!uploadingBg"
                                            name="i-lucide-plus"
                                            class="w-4 h-4 text-gray-400"
                                        />
                                        <UIcon
                                            v-else
                                            name="i-lucide-loader-2"
                                            class="w-4 h-4 animate-spin text-gray-400"
                                        />
                                    </button>
                                    <input
                                        ref="bgFileRef"
                                        type="file"
                                        accept="image/*"
                                        class="hidden"
                                        @change="handleBgUpload"
                                    >
                                </div>
                            </div>

                            <!-- Watch Comments -->
                            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary-500" />
                                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Коммент хянах
                                    </span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <USelect
                                        v-if="watchComments"
                                        v-model="commentMode"
                                        :items="[
                                            { label: 'Бүх коммент', value: 'all' },
                                            { label: 'Түлхүүр үг', value: 'keywords' }
                                        ]"
                                        size="xs"
                                        class="w-32"
                                    />
                                    <USwitch v-model="watchComments" />
                                </div>
                            </div>

                            <!-- Divider -->
                            <div class="border-t border-gray-200 dark:border-gray-700" />

                            <!-- Product List with Captions -->
                            <div>
                                <div class="flex items-center justify-between mb-3">
                                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Бараанууд ({{ products.length }})
                                    </label>
                                    <UButton
                                        size="xs"
                                        variant="soft"
                                        icon="i-lucide-sparkles"
                                        :loading="generatingCaptionFor !== null"
                                        @click="generateAllCaptions"
                                    >
                                        Бүх тайлбар AI-р үүсгэх
                                    </UButton>
                                </div>

                                <div class="space-y-3">
                                    <div
                                        v-for="(product, index) in products"
                                        :key="product.id"
                                        class="border rounded-lg transition-all cursor-pointer"
                                        :class="
                                            activeProductIndex === index
                                                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        "
                                        @click="activeProductIndex = index"
                                    >
                                        <div class="flex items-center gap-3 p-3">
                                            <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                                                <img
                                                    v-if="product.images?.length"
                                                    :src="product.images[0]"
                                                    :alt="product.name"
                                                    class="w-full h-full object-cover"
                                                />
                                                <div v-else class="w-full h-full flex items-center justify-center">
                                                    <UIcon name="i-lucide-package" class="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p class="text-sm font-medium text-[var(--text-heading)] truncate">
                                                    {{ product.name }}
                                                </p>
                                                <p class="text-xs text-gray-500">
                                                    {{ product.price?.toLocaleString() }}₮
                                                    <span v-if="product.keyword" class="ml-1 text-gray-400">
                                                        · {{ product.keyword }}
                                                    </span>
                                                </p>
                                            </div>
                                            <div class="flex items-center gap-1 shrink-0">
                                                <UIcon
                                                    v-if="captions[product.id]?.trim()"
                                                    name="i-lucide-check-circle"
                                                    class="w-4 h-4 text-primary-500"
                                                />
                                                <UIcon
                                                    v-else
                                                    name="i-lucide-circle"
                                                    class="w-4 h-4 text-gray-300"
                                                />
                                            </div>
                                        </div>

                                        <!-- Caption area (shown when active) -->
                                        <div
                                            v-if="activeProductIndex === index"
                                            class="px-3 pb-3 pt-0"
                                        >
                                            <div class="flex items-center gap-2 mb-1.5">
                                                <span class="text-xs text-gray-500">Тайлбар</span>
                                                <UButton
                                                    size="xs"
                                                    variant="ghost"
                                                    icon="i-lucide-sparkles"
                                                    :loading="generatingCaptionFor === product.id"
                                                    @click.stop="generateCaptionForProduct(product)"
                                                >
                                                    AI
                                                </UButton>
                                            </div>
                                            <UTextarea
                                                :model-value="captions[product.id] || ''"
                                                placeholder="Тайлбар бичих..."
                                                :rows="3"
                                                @update:model-value="captions[product.id] = $event"
                                                @click.stop
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Preview -->
                    <div class="w-[45%] flex flex-col bg-[var(--surface-inset)]">
                        <div class="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                            <div v-if="activeProduct" class="w-full max-w-sm">
                                <!-- Facebook Preview Card -->
                                <div class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-sm">
                                    <!-- Page header -->
                                    <div class="flex items-center gap-2.5 px-4 pt-3 pb-2">
                                        <div class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                            <UIcon name="i-lucide-store" class="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p class="text-sm font-semibold text-[var(--text-heading)]">
                                                {{ shop?.name || 'Таны дэлгүүр' }}
                                            </p>
                                            <p class="text-[11px] text-gray-500">Саяхан · 🌍</p>
                                        </div>
                                    </div>

                                    <!-- Caption preview -->
                                    <div v-if="captions[activeProduct.id]" class="px-4 pb-2">
                                        <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line line-clamp-4">
                                            {{ captions[activeProduct.id] }}
                                        </p>
                                    </div>
                                    <div v-else class="px-4 pb-2">
                                        <p class="text-sm text-gray-400 italic">Тайлбар бичнэ үү...</p>
                                    </div>

                                    <!-- Image preview -->
                                    <div class="bg-gray-100 dark:bg-gray-800 aspect-square">
                                        <img
                                            v-if="previewUrl"
                                            :key="previewKey"
                                            :src="previewUrl"
                                            class="w-full h-full object-contain"
                                        />
                                    </div>

                                    <!-- Engagement mockup -->
                                    <div class="px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                                        <span>👍❤️ 0</span>
                                        <span>0 сэтгэгдэл · 0 хуваалцсан</span>
                                    </div>
                                    <div class="grid grid-cols-3 border-t border-[var(--border-primary)]">
                                        <div class="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500">
                                            <UIcon name="i-lucide-thumbs-up" class="w-3.5 h-3.5" /> Таалагдсан
                                        </div>
                                        <div class="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500">
                                            <UIcon name="i-lucide-message-circle" class="w-3.5 h-3.5" /> Сэтгэгдэл
                                        </div>
                                        <div class="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500">
                                            <UIcon name="i-lucide-share" class="w-3.5 h-3.5" /> Хуваалцах
                                        </div>
                                    </div>
                                </div>

                                <!-- Product counter -->
                                <div class="flex items-center justify-center gap-2 mt-4">
                                    <UButton
                                        icon="i-lucide-chevron-left"
                                        variant="ghost"
                                        color="neutral"
                                        size="xs"
                                        :disabled="activeProductIndex <= 0"
                                        @click="activeProductIndex--"
                                    />
                                    <span class="text-sm text-gray-500">
                                        {{ activeProductIndex + 1 }} / {{ products.length }}
                                    </span>
                                    <UButton
                                        icon="i-lucide-chevron-right"
                                        variant="ghost"
                                        color="neutral"
                                        size="xs"
                                        :disabled="activeProductIndex >= products.length - 1"
                                        @click="activeProductIndex++"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
                >
                    <div class="text-sm text-gray-500">
                        <span v-if="posting">
                            {{ postingProgress }} / {{ products.length }} нийтэлж байна...
                        </span>
                        <span v-else>
                            {{ products.filter(p => captions[p.id]?.trim()).length }} / {{ products.length }} тайлбартай
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="isOpen = false"
                        >
                            Болих
                        </UButton>
                        <UButton
                            color="primary"
                            icon="i-lucide-send"
                            :loading="posting"
                            :disabled="!allCaptionsReady || posting"
                            @click="handleBulkPost"
                        >
                            {{ products.length }} бараа нийтлэх
                        </UButton>
                    </div>
                </div>

                <!-- Progress bar -->
                <div v-if="posting" class="h-1 bg-gray-200 dark:bg-gray-800">
                    <div
                        class="h-full bg-primary-500 transition-all duration-300"
                        :style="{ width: `${(postingProgress / products.length) * 100}%` }"
                    />
                </div>
            </div>
        </template>
    </UModal>
</template>
