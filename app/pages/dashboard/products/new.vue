<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { VariantData } from '~/components/products/ProductVariantForm.vue'

useSeoMeta({
    title: 'Бараа нэмэх - Instasell'
})

const { createProduct } = useProducts()
const toast = useToast()
const router = useRouter()

const loading = ref(false)
const images = ref<string[]>([])
const variants = ref<VariantData[]>([])
const activeTabIndex = ref(0)

const schema = z.object({
    name: z.string().min(1, 'Нэр оруулна уу'),
    category: z.string().optional(),
    price: z.number().min(0, 'Үнэ 0-ээс бага байж болохгүй'),
    status: z.string().default('active'),
    track_inventory: z.boolean().default(true),
    has_variants: z.boolean().default(false),

    // Quantity-based discount
    bulk_discount_enabled: z.boolean().default(false),
    bulk_discount_quantity: z.number().default(3),
    bulk_discount_price: z.number().optional().nullable(),

    // Time-limited sale
    timed_sale_enabled: z.boolean().default(false),
    timed_sale_start: z.string().optional().nullable(),
    timed_sale_end: z.string().optional().nullable(),
    timed_sale_price: z.number().optional().nullable(),

    // Featured product
    is_featured: z.boolean().default(false)
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
    name: '',
    category: '',
    price: 0,
    status: 'active',
    track_inventory: true,
    has_variants: false,
    bulk_discount_enabled: false,
    bulk_discount_quantity: 3,
    bulk_discount_price: null,
    timed_sale_enabled: false,
    timed_sale_start: null,
    timed_sale_end: null,
    timed_sale_price: null,
    is_featured: false
})

watch(
    () => state.bulk_discount_enabled,
    (newVal) => {
        if (newVal) {
            state.bulk_discount_price = state.price
        }
    }
)

watch(
    () => state.timed_sale_enabled,
    (newVal) => {
        if (newVal) {
            state.timed_sale_price = state.price
        }
    }
)

// Computed: Check if timed sale will activate immediately (no dates set)
const timedSaleActivatesImmediately = computed(() => {
    return state.timed_sale_enabled && !state.timed_sale_start && !state.timed_sale_end
})

// Computed: Calculate discount percent for timed sale
const timedSaleDiscountPercent = computed(() => {
    if (state.timed_sale_price && state.price && state.price > 0) {
        return Math.round(((state.price - state.timed_sale_price) / state.price) * 100)
    }
    return 0
})

// Computed: Calculate discount percent for bulk
const bulkDiscountPercent = computed(() => {
    if (state.bulk_discount_price && state.price && state.price > 0) {
        return Math.round(((state.price - state.bulk_discount_price) / state.price) * 100)
    }
    return 0
})

// Variant management
const createEmptyVariant = (): VariantData => ({
    name: '',
    keyword: '',
    sku: '',
    barcode: null,
    stock_quantity: 0,
    low_stock_alert: 10,
    is_active: true,
    images: []
})

const addVariant = () => {
    variants.value.push(createEmptyVariant())
    state.has_variants = true
    activeTabIndex.value = variants.value.length - 1
}

const removeVariant = (index: number) => {
    if (variants.value.length <= 1) {
        toast.add({
            title: 'Анхааруулга',
            description: 'Бараа дор хаяж нэг төрөлтэй байх ёстой',
            color: 'warning'
        })
        return
    }

    if (activeTabIndex.value === index) {
        if (index > 0) {
            activeTabIndex.value = index - 1
        } else if (variants.value.length > 1) {
            activeTabIndex.value = 0
        }
    } else if (activeTabIndex.value > index) {
        activeTabIndex.value--
    }

    variants.value.splice(index, 1)
}

const duplicateVariant = (index: number) => {
    const original = variants.value[index]
    const copy = JSON.parse(JSON.stringify(original))
    delete copy.id
    if (copy.sku) copy.sku = `${copy.sku}-COPY`
    if (copy.barcode) copy.barcode = `${copy.barcode}-COPY`

    variants.value.splice(index + 1, 0, copy)
    activeTabIndex.value = index + 1
}

const handleVariantUpdate = (index: number, data: VariantData) => {
    variants.value[index] = data
}

const currentVariant = computed(() => {
    if (variants.value.length > 0 && activeTabIndex.value < variants.value.length) {
        return variants.value[activeTabIndex.value]
    }
    return null
})

const statusOptions = [
    { label: 'Идэвхтэй', value: 'active' },
    { label: 'Ноорог', value: 'draft' },
    { label: 'Дууссан', value: 'out_of_stock' }
]

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
    if (state.has_variants && variants.value.length > 0) {
        const invalidVariants = variants.value.filter((v) => !v.name || !v.keyword)
        if (invalidVariants.length > 0) {
            toast.add({
                title: 'Алдаа',
                description: 'Бүх төрлийн нэр болон Түлхүүр үг оруулна уу',
                color: 'error'
            })
            return
        }
    }

    loading.value = true

    try {
        const product = await createProduct({
            ...event.data,
            images: images.value,
            variants: variants.value,
            timed_sale_start: event.data.timed_sale_start
                ? new Date(event.data.timed_sale_start).toISOString()
                : null,
            timed_sale_end: event.data.timed_sale_end
                ? new Date(event.data.timed_sale_end).toISOString()
                : null
        })

        toast.add({
            title: 'Амжилттай',
            description: 'Бүтээгдэхүүн үүсгэгдлээ',
            color: 'success'
        })

        router.push(`/dashboard/products/${product.id}`)
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Бүтээгдэхүүн үүсгэхэд алдаа гарлаа',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    addVariant()
})
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="new-product">
            <template #header>
                <UDashboardNavbar>
                    <template #leading>
                        <UButton
                            to="/dashboard/products"
                            icon="i-lucide-arrow-left"
                            color="neutral"
                            variant="ghost"
                        />
                    </template>

                    <template #title>
                        <div>
                            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Бараа нэмэх
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                Бараа бүтээгдэхүүний мэдээллийг оруулан шинээр нэмэх
                            </p>
                        </div>
                    </template>

                    <template #right>
                        <UButton
                            type="submit"
                            form="product-form"
                            color="primary"
                            icon="i-lucide-check"
                            :loading="loading"
                        >
                            Бараа нэмэх
                        </UButton>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <div class="p-6 overflow-y-auto">
                    <UForm id="product-form" :schema="schema" :state="state" @submit="onSubmit">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <!-- Left Column - Main Form -->
                            <div class="lg:col-span-2 space-y-6">
                                <!-- Product Info: Title + Price Combined -->
                                <ProductFormCard title="Барааны мэдээлэл" required>
                                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                        <!-- Left: Inputs -->
                                        <div class="lg:col-span-3 space-y-4">
                                            <UFormField label="Барааны нэр" required>
                                                <UInput
                                                    v-model="state.name"
                                                    placeholder="Барааны гарчгийг оруулна уу"
                                                    size="lg"
                                                />
                                            </UFormField>

                                            <UFormField label="Үндсэн үнэ" required>
                                                <UInput
                                                    v-model.number="state.price"
                                                    type="number"
                                                    placeholder="0"
                                                    size="lg"
                                                >
                                                    <template #leading>
                                                        <span
                                                            class="text-gray-500 dark:text-gray-400 font-medium"
                                                            >₮</span
                                                        >
                                                    </template>
                                                </UInput>
                                            </UFormField>

                                            <!-- Sale Options Row -->
                                            <div class="grid grid-cols-2 gap-3">
                                                <!-- Timed Sale Toggle Card -->
                                                <div
                                                    class="p-3 rounded-lg border-2 transition-all cursor-pointer"
                                                    :class="
                                                        state.timed_sale_enabled
                                                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    "
                                                    @click="
                                                        state.timed_sale_enabled =
                                                            !state.timed_sale_enabled
                                                    "
                                                >
                                                    <div
                                                        class="flex items-center justify-between gap-2"
                                                    >
                                                        <div class="flex items-center gap-2">
                                                            <UIcon
                                                                name="i-lucide-tag"
                                                                class="w-4 h-4"
                                                                :class="
                                                                    state.timed_sale_enabled
                                                                        ? 'text-rose-600'
                                                                        : 'text-gray-400'
                                                                "
                                                            />
                                                            <span
                                                                class="text-sm font-medium"
                                                                :class="
                                                                    state.timed_sale_enabled
                                                                        ? 'text-rose-700 dark:text-rose-300'
                                                                        : 'text-gray-700 dark:text-gray-300'
                                                                "
                                                            >
                                                                Хямдрал
                                                            </span>
                                                        </div>
                                                        <USwitch
                                                            :model-value="state.timed_sale_enabled"
                                                            size="xs"
                                                            @click.stop
                                                            @update:model-value="
                                                                state.timed_sale_enabled = $event
                                                            "
                                                        />
                                                    </div>
                                                </div>

                                                <!-- Bulk Discount Toggle Card -->
                                                <div
                                                    class="p-3 rounded-lg border-2 transition-all cursor-pointer"
                                                    :class="
                                                        state.bulk_discount_enabled
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    "
                                                    @click="
                                                        state.bulk_discount_enabled =
                                                            !state.bulk_discount_enabled
                                                    "
                                                >
                                                    <div
                                                        class="flex items-center justify-between gap-2"
                                                    >
                                                        <div class="flex items-center gap-2">
                                                            <UIcon
                                                                name="i-lucide-boxes"
                                                                class="w-4 h-4"
                                                                :class="
                                                                    state.bulk_discount_enabled
                                                                        ? 'text-primary-600'
                                                                        : 'text-gray-400'
                                                                "
                                                            />
                                                            <span
                                                                class="text-sm font-medium"
                                                                :class="
                                                                    state.bulk_discount_enabled
                                                                        ? 'text-primary-700 dark:text-primary-300'
                                                                        : 'text-gray-700 dark:text-gray-300'
                                                                "
                                                            >
                                                                Олноор авахад
                                                            </span>
                                                        </div>
                                                        <USwitch
                                                            :model-value="
                                                                state.bulk_discount_enabled
                                                            "
                                                            size="xs"
                                                            @click.stop
                                                            @update:model-value="
                                                                state.bulk_discount_enabled = $event
                                                            "
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Timed Sale Expanded -->
                                            <div
                                                v-if="state.timed_sale_enabled"
                                                class="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/50 space-y-3"
                                            >
                                                <!-- Immediate activation notice -->
                                                <div
                                                    v-if="timedSaleActivatesImmediately"
                                                    class="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-md"
                                                >
                                                    <UIcon
                                                        name="i-lucide-zap"
                                                        class="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                                                    />
                                                    <span
                                                        class="text-xs font-medium text-emerald-700 dark:text-emerald-300"
                                                    >
                                                        Хугацаа оруулаагүй бол шууд идэвхжинэ
                                                    </span>
                                                </div>

                                                <div class="grid grid-cols-3 gap-3">
                                                    <UFormField label="Хямдралын үнэ" required>
                                                        <UInput
                                                            v-model.number="state.timed_sale_price"
                                                            type="number"
                                                            placeholder="0"
                                                            size="sm"
                                                        >
                                                            <template #leading>
                                                                <span class="text-rose-500">₮</span>
                                                            </template>
                                                        </UInput>
                                                    </UFormField>
                                                    <UFormField label="Эхлэх">
                                                        <UInput
                                                            v-model="state.timed_sale_start"
                                                            type="datetime-local"
                                                            size="sm"
                                                        />
                                                    </UFormField>
                                                    <UFormField label="Дуусах">
                                                        <UInput
                                                            v-model="state.timed_sale_end"
                                                            type="datetime-local"
                                                            size="sm"
                                                        />
                                                    </UFormField>
                                                </div>
                                            </div>

                                            <!-- Bulk Discount Expanded -->
                                            <div
                                                v-if="state.bulk_discount_enabled"
                                                class="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-lg border border-primary-200 dark:border-primary-900/50 space-y-3"
                                            >
                                                <div class="grid grid-cols-2 gap-3">
                                                    <UFormField label="Дор хаяж (ширхэг)">
                                                        <UInput
                                                            v-model.number="
                                                                state.bulk_discount_quantity
                                                            "
                                                            type="number"
                                                            placeholder="3"
                                                            size="sm"
                                                        >
                                                            <template #trailing>
                                                                <span
                                                                    class="text-primary-500 text-xs"
                                                                    >ш</span
                                                                >
                                                            </template>
                                                        </UInput>
                                                    </UFormField>
                                                    <UFormField label="Нэгж үнэ">
                                                        <UInput
                                                            v-model.number="
                                                                state.bulk_discount_price
                                                            "
                                                            type="number"
                                                            placeholder="0"
                                                            size="sm"
                                                        >
                                                            <template #leading>
                                                                <span class="text-primary-500"
                                                                    >₮</span
                                                                >
                                                            </template>
                                                        </UInput>
                                                    </UFormField>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Right: Live Preview -->
                                        <div class="lg:col-span-2">
                                            <div class="sticky top-0">
                                                <span
                                                    class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block"
                                                    >Харагдах байдал</span
                                                >
                                                <div
                                                    class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700"
                                                >
                                                    <!-- Product Name Preview -->
                                                    <p
                                                        class="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2"
                                                    >
                                                        {{ state.name || 'Барааны нэр...' }}
                                                    </p>

                                                    <!-- Price Display -->
                                                    <div class="space-y-2">
                                                        <div
                                                            class="flex items-baseline gap-2 flex-wrap"
                                                        >
                                                            <span
                                                                class="text-2xl font-bold"
                                                                :class="
                                                                    state.timed_sale_enabled &&
                                                                    state.timed_sale_price
                                                                        ? 'text-rose-600 dark:text-rose-400'
                                                                        : 'text-gray-900 dark:text-white'
                                                                "
                                                            >
                                                                {{
                                                                    (state.timed_sale_enabled &&
                                                                    state.timed_sale_price
                                                                        ? state.timed_sale_price
                                                                        : state.price || 0
                                                                    ).toLocaleString()
                                                                }}₮
                                                            </span>
                                                            <span
                                                                v-if="
                                                                    state.timed_sale_enabled &&
                                                                    state.timed_sale_price &&
                                                                    state.price
                                                                "
                                                                class="text-sm text-gray-400 line-through"
                                                            >
                                                                {{ state.price.toLocaleString() }}₮
                                                            </span>
                                                        </div>

                                                        <!-- Sale Badge -->
                                                        <div
                                                            v-if="
                                                                state.timed_sale_enabled &&
                                                                state.timed_sale_price &&
                                                                state.price &&
                                                                timedSaleDiscountPercent > 0
                                                            "
                                                            class="flex items-center gap-2"
                                                        >
                                                            <span
                                                                class="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-full"
                                                            >
                                                                <UIcon
                                                                    name="i-lucide-arrow-down"
                                                                    class="w-3 h-3"
                                                                />
                                                                {{ timedSaleDiscountPercent }}%
                                                            </span>
                                                            <span
                                                                class="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                                                            >
                                                                {{
                                                                    (
                                                                        state.price -
                                                                        state.timed_sale_price
                                                                    ).toLocaleString()
                                                                }}₮ хэмнэлт
                                                            </span>
                                                        </div>

                                                        <!-- Bulk Discount Badge -->
                                                        <div
                                                            v-if="
                                                                state.bulk_discount_enabled &&
                                                                state.bulk_discount_price &&
                                                                state.price
                                                            "
                                                            class="pt-2 border-t border-gray-200 dark:border-gray-700"
                                                        >
                                                            <span
                                                                class="inline-flex items-center gap-1.5 px-2 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-md"
                                                            >
                                                                <UIcon
                                                                    name="i-lucide-boxes"
                                                                    class="w-3.5 h-3.5"
                                                                />
                                                                {{ state.bulk_discount_quantity }}+
                                                                авахад
                                                                {{
                                                                    state.bulk_discount_price.toLocaleString()
                                                                }}₮
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ProductFormCard>

                                <!-- Variants Section -->
                                <ProductFormCard title="Барааны төрлүүд">
                                    <div v-if="variants.length > 0">
                                        <!-- Chrome-style Tabs -->
                                        <div class="chrome-tabs">
                                            <div
                                                class="flex items-end gap-0.5 px-2 pt-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-x-auto"
                                            >
                                                <div
                                                    v-for="(variant, index) in variants"
                                                    :key="`tab-${index}`"
                                                    class="chrome-tab group"
                                                    :class="
                                                        activeTabIndex === index ? 'active' : ''
                                                    "
                                                    @click="activeTabIndex = index"
                                                >
                                                    <div class="tab-content">
                                                        <UIcon
                                                            name="i-lucide-layers"
                                                            class="w-3.5 h-3.5 flex-shrink-0"
                                                            :class="
                                                                activeTabIndex === index
                                                                    ? 'text-primary-600 dark:text-primary-400'
                                                                    : 'text-gray-400'
                                                            "
                                                        />
                                                        <span class="tab-title">
                                                            {{
                                                                variant.name || `Төрөл ${index + 1}`
                                                            }}
                                                        </span>
                                                        <button
                                                            v-if="variants.length > 1"
                                                            type="button"
                                                            class="tab-close"
                                                            @click.stop="removeVariant(index)"
                                                        >
                                                            <UIcon
                                                                name="i-lucide-x"
                                                                class="w-3 h-3"
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                <!-- Add Tab Button -->
                                                <button
                                                    type="button"
                                                    class="flex items-center justify-center w-7 h-7 mb-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                                                    @click="addVariant"
                                                >
                                                    <UIcon name="i-lucide-plus" class="w-4 h-4" />
                                                </button>
                                            </div>

                                            <!-- Tab Content -->
                                            <div class="tab-panel">
                                                <ProductVariantForm
                                                    v-if="currentVariant"
                                                    :model-value="currentVariant"
                                                    :index="activeTabIndex"
                                                    :product-name="state.name"
                                                    :can-remove="variants.length > 0"
                                                    @update:model-value="
                                                        handleVariantUpdate(activeTabIndex, $event)
                                                    "
                                                    @remove="removeVariant(activeTabIndex)"
                                                    @duplicate="duplicateVariant(activeTabIndex)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </ProductFormCard>
                            </div>

                            <!-- Right Column - Sidebar -->
                            <div class="space-y-6">
                                <ProductFormCard title="Барааны төлөв" required>
                                    <USelect
                                        v-model="state.status"
                                        :items="statusOptions"
                                        size="lg"
                                    />
                                </ProductFormCard>

                                <ProductFormCard title="Ангилал">
                                    <UInput
                                        v-model="state.category"
                                        placeholder="Эмэгтэй хувцас, Гэр ахуй..."
                                        size="lg"
                                    />
                                </ProductFormCard>

                                <ProductFormCard title="Барааны тохиргоо">
                                    <div class="divide-y divide-gray-100 dark:divide-gray-800">
                                        <ProductSettingToggle
                                            v-model="state.track_inventory"
                                            label="Үлдэгдэл автоматаар тооцох"
                                            description="Захиалга хийгдсэн үед тухайн барааны үлдэгдэлээс хасна."
                                        />
                                        <ProductSettingToggle
                                            v-model="state.is_featured"
                                            label="Checkout-д санал болгох"
                                            description="Checkout хуудас дээр харилцагчид санал болгох бараа."
                                        />
                                    </div>
                                </ProductFormCard>
                            </div>
                        </div>
                    </UForm>
                </div>
            </template>
        </UDashboardPanel>
    </div>
</template>

<style scoped>
/* Chrome-style Tabs */
.chrome-tabs {
    --tab-height: 36px;
    --tab-radius: 8px;
}

.chrome-tab {
    position: relative;
    height: var(--tab-height);
    min-width: 100px;
    max-width: 180px;
    padding: 0 4px;
    cursor: pointer;
    display: flex;
    align-items: flex-end;
}

.chrome-tab .tab-content {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: calc(var(--tab-height) - 4px);
    padding: 0 12px;
    background: linear-gradient(to bottom, #e5e7eb 0%, #d1d5db 100%);
    border-radius: var(--tab-radius) var(--tab-radius) 0 0;
    transition: all 0.15s ease;
}

:root.dark .chrome-tab .tab-content {
    background: linear-gradient(to bottom, #374151 0%, #1f2937 100%);
}

.chrome-tab:hover .tab-content {
    background: linear-gradient(to bottom, #f3f4f6 0%, #e5e7eb 100%);
}

:root.dark .chrome-tab:hover .tab-content {
    background: linear-gradient(to bottom, #4b5563 0%, #374151 100%);
}

.chrome-tab.active .tab-content {
    background: white;
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.08);
}

:root.dark .chrome-tab.active .tab-content {
    background: #111827;
}

.chrome-tab .tab-title {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #4b5563;
}

:root.dark .chrome-tab .tab-title {
    color: #9ca3af;
}

.chrome-tab.active .tab-title {
    color: #111827;
}

:root.dark .chrome-tab.active .tab-title {
    color: #f3f4f6;
}

.chrome-tab .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    opacity: 0;
    transition: all 0.15s ease;
    color: #6b7280;
    flex-shrink: 0;
}

.chrome-tab:hover .tab-close,
.chrome-tab.active .tab-close {
    opacity: 0.7;
}

.chrome-tab .tab-close:hover {
    opacity: 1;
    background: #e5e7eb;
}

:root.dark .chrome-tab .tab-close:hover {
    background: #374151;
}

.tab-panel {
    background: white;
    border-radius: 0 var(--tab-radius) var(--tab-radius) var(--tab-radius);
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-top: none;
}

:root.dark .tab-panel {
    background: #111827;
    border-color: #374151;
}

/* Hide scrollbar */
.chrome-tabs .flex {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.chrome-tabs .flex::-webkit-scrollbar {
    display: none;
}
</style>
