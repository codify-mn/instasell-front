<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Product } from '~/composables/useProducts'
const route = useRoute()
const router = useRouter()
const toast = useToast()

const { fetchProduct, updateProduct, deleteProduct } = useProducts()

const productId = computed(() => Number(route.params.id))

const loading = ref(true)
const saving = ref(false)
const product = ref<Product | null>(null)
const images = ref<string[]>([])

useSeoMeta({
    title: () => (product.value ? `${product.value.name} - Instasell` : 'Бүтээгдэхүүн - Instasell')
})

const schema = z.object({
    name: z.string().min(1, 'Нэр оруулна уу'),
    category: z.string().optional(),
    price: z.number().min(0, 'Үнэ 0-ээс бага байж болохгүй'),
    status: z.string().default('active'),
    track_inventory: z.boolean().default(true),
    keyword: z.string().min(1, 'Түлхүүр үг оруулна уу'),
    stock_quantity: z.number().min(0).default(0),

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
    keyword: '',
    stock_quantity: 0,
    bulk_discount_enabled: false,
    bulk_discount_quantity: 3,
    bulk_discount_price: null,
    timed_sale_enabled: false,
    timed_sale_start: null,
    timed_sale_end: null,
    timed_sale_price: null,
    is_featured: false
})

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

const keywordDirty = ref(false)

const options = ref<{ name: string; stock: number }[]>([])

const addOption = () => {
    options.value.push({ name: '', stock: 0 })
}

const removeOption = (index: number) => {
    options.value.splice(index, 1)
}

const generateKeyword = (name: string) => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0400-\u04FF-]/g, '')
        .slice(0, 50)
}

watch(
    () => state.name,
    (newName) => {
        if (!keywordDirty.value) {
            state.keyword = generateKeyword(newName)
        }
    }
)

const loadProduct = async () => {
    loading.value = true
    try {
        product.value = await fetchProduct(productId.value)

        state.name = product.value.name
        state.category = product.value.category || ''
        state.status = product.value.status
        state.track_inventory = product.value.track_inventory

        // Pricing fields
        state.price = product.value.price
        state.bulk_discount_enabled = product.value.bulk_discount_enabled
        state.bulk_discount_quantity = product.value.bulk_discount_quantity
        state.bulk_discount_price = product.value.bulk_discount_price
        state.timed_sale_enabled = product.value.timed_sale_enabled
        state.timed_sale_start = product.value.timed_sale_start
            ? new Date(product.value.timed_sale_start).toISOString().slice(0, 16)
            : null
        state.timed_sale_end = product.value.timed_sale_end
            ? new Date(product.value.timed_sale_end).toISOString().slice(0, 16)
            : null
        state.timed_sale_price = product.value.timed_sale_price
        state.is_featured = product.value.is_featured || false

        // keyword and images live on the product itself
        state.keyword = product.value.keyword || ''
        state.stock_quantity = product.value.stock_quantity || 0
        images.value = product.value.images || []
        keywordDirty.value = true

        const variantList = product.value.variants || []
        if (variantList.length > 0) {
            // Variants mode
            options.value = variantList.map(v => ({
                name: v.name,
                stock: v.stock_quantity
            }))
            state.stock_quantity = 0
        } else {
            options.value = []
        }
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: 'Бүтээгдэхүүн олдсонгүй',
            color: 'error'
        })
        router.push('/dashboard/products')
    } finally {
        loading.value = false
    }
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
    if (options.value.length > 0) {
        const emptyOption = options.value.find(o => !o.name.trim())
        if (emptyOption) {
            toast.add({
                title: 'Алдаа',
                description: 'Бүх сонголтын нэрийг оруулна уу',
                color: 'error'
            })
            return
        }
    }

    saving.value = true
    try {
        const { keyword, stock_quantity, ...productData } = event.data
        await updateProduct(productId.value, {
            ...productData,
            has_variants: options.value.length > 0,
            keyword,
            stock_quantity: options.value.length > 0 ? 0 : stock_quantity,
            images: images.value,
            variants: options.value.length > 0
                ? options.value.map(o => ({
                    name: o.name.trim(),
                    stock_quantity: o.stock
                }))
                : [],
            timed_sale_start: productData.timed_sale_start
                ? new Date(productData.timed_sale_start).toISOString()
                : null,
            timed_sale_end: productData.timed_sale_end
                ? new Date(productData.timed_sale_end).toISOString()
                : null
        })
        toast.add({
            title: 'Амжилттай',
            description: 'Бүтээгдэхүүн шинэчлэгдлээ',
            color: 'success'
        })
        await loadProduct()
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Шинэчлэхэд алдаа гарлаа',
            color: 'error'
        })
    } finally {
        saving.value = false
    }
}

const statusOptions = [
    { label: 'Идэвхтэй', value: 'active' },
    { label: 'Ноорог', value: 'draft' },
    { label: 'Дууссан', value: 'out_of_stock' }
]

const deleteModalOpen = ref(false)
const deleting = ref(false)

const confirmDelete = async () => {
    deleting.value = true
    try {
        await deleteProduct(productId.value)
        toast.add({ title: 'Амжилттай', description: 'Бүтээгдэхүүн устгагдлаа', color: 'success' })
        router.push('/dashboard/products')
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Устгахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        deleting.value = false
    }
}

onMounted(async () => {
    await loadProduct()
})
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="product-detail">
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
                                {{ product?.name || 'Бараа засах' }}
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                Бараа бүтээгдэхүүний мэдээллийг засварлах
                            </p>
                        </div>
                    </template>

                    <template #right>
                        <div class="flex items-center gap-2">
                            <UButton
                                icon="i-lucide-trash-2"
                                color="error"
                                variant="ghost"
                                @click="deleteModalOpen = true"
                            />
                            <UButton
                                type="submit"
                                form="product-form"
                                color="primary"
                                icon="i-lucide-check"
                                :loading="saving"
                            >
                                Хадгалах
                            </UButton>
                        </div>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <div v-if="loading" class="flex items-center justify-center p-20">
                    <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
                </div>

                <div v-else-if="product" class="p-6 overflow-y-auto">
                    <UForm id="product-form" :schema="schema" :state="state" @submit="onSubmit">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                                            <!-- Keyword (always visible) -->
                                            <UFormField label="Түлхүүр үг" name="keyword" required>
                                                <UInput
                                                    v-model="state.keyword"
                                                    placeholder="бараа-нэр"
                                                    size="lg"
                                                    @update:model-value="keywordDirty = true"
                                                >
                                                    <template #trailing>
                                                        <UTooltip text="Комментоос энэ үгийг ашиглан барааг таньдаг">
                                                            <UIcon name="i-lucide-wand-sparkles" class="w-4 h-4 text-primary-400" />
                                                        </UTooltip>
                                                    </template>
                                                </UInput>
                                            </UFormField>

                                            <!-- Stock (shown only when no options) -->
                                            <UFormField v-if="options.length === 0" label="Үлдэгдэл" name="stock_quantity">
                                                <UInput
                                                    v-model.number="state.stock_quantity"
                                                    type="number"
                                                    placeholder="0"
                                                    size="lg"
                                                >
                                                    <template #trailing>
                                                        <span class="text-gray-400 text-sm">ш</span>
                                                    </template>
                                                </UInput>
                                            </UFormField>

                                            <!-- Options list (shown when options exist) -->
                                            <div v-if="options.length > 0" class="space-y-2">
                                                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Сонголтууд</p>
                                                <div
                                                    v-for="(option, index) in options"
                                                    :key="index"
                                                    class="flex items-center gap-2"
                                                >
                                                    <UInput
                                                        v-model="option.name"
                                                        placeholder="S / M / L / XL"
                                                        class="flex-1"
                                                        :ui="{ base: !option.name.trim() ? 'ring-red-500' : '' }"
                                                    />
                                                    <UInput
                                                        v-model.number="option.stock"
                                                        type="number"
                                                        placeholder="0"
                                                        class="w-24"
                                                    >
                                                        <template #trailing>
                                                            <span class="text-gray-400 text-sm">ш</span>
                                                        </template>
                                                    </UInput>
                                                    <UButton
                                                        icon="i-lucide-x"
                                                        color="neutral"
                                                        variant="ghost"
                                                        size="sm"
                                                        @click="removeOption(index)"
                                                    />
                                                </div>
                                            </div>

                                            <!-- Add option button (always visible) -->
                                            <UButton
                                                icon="i-lucide-plus"
                                                color="neutral"
                                                variant="ghost"
                                                size="sm"
                                                @click="addOption"
                                            >
                                                Сонголт нэмэх
                                            </UButton>

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

                            </div>

                            <div class="space-y-6">
                                <ProductFormCard title="Зураг">
                                    <ProductImageUpload v-model="images" />
                                </ProductFormCard>

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
                                        placeholder="Ангилал..."
                                        size="lg"
                                    />
                                </ProductFormCard>
                                <ProductFormCard title="Барааны тохиргоо">
                                    <div class="divide-y divide-gray-100 dark:divide-gray-800">
                                        <ProductSettingToggle
                                            v-model="state.track_inventory"
                                            label="Үлдэгдэл тооцох"
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

                <UModal v-model:open="deleteModalOpen">
                    <template #content>
                        <UCard>
                            <p>
                                <strong>{{ product?.name }}</strong> устгахдаа итгэлтэй байна уу?
                            </p>
                            <template #footer>
                                <div class="flex justify-end gap-2">
                                    <UButton color="neutral" @click="deleteModalOpen = false">
                                        Болих
                                    </UButton>
                                    <UButton
                                        color="error"
                                        :loading="deleting"
                                        @click="confirmDelete"
                                    >
                                        Устгах
                                    </UButton>
                                </div>
                            </template>
                        </UCard>
                    </template>
                </UModal>
            </template>
        </UDashboardPanel>
    </div>
</template>

