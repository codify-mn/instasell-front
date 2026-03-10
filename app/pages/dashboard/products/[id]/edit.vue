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

const quickVariants = [
    { label: 'Хэмжээ', items: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'] },
    { label: 'Гутлын дугаар', items: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] },
    { label: 'Өнгө', items: ['Улаан', 'Цагаан', 'Хар', 'Цэнхэр', 'Ногоон', 'Шар', 'Ягаан', 'Саарал'] }
]

const addOption = (name = '') => {
    options.value.push({ name, stock: 0 })
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
            options.value = variantList.map((v) => ({
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
        const emptyOption = options.value.find((o) => !o.name.trim())
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
            variants:
                options.value.length > 0
                    ? options.value.map((o) => ({
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
        router.push(`/dashboard/products/${productId.value}`)
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

const statusDotColor = computed(() => {
    const map: Record<string, string> = {
        active: 'bg-emerald-500',
        draft: 'bg-gray-400',
        out_of_stock: 'bg-red-500'
    }
    return map[state.status] ?? 'bg-gray-400'
})

const statusLabel = computed(() => statusOptions.find(o => o.value === state.status)?.label ?? '')

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
                            :to="`/dashboard/products/${productId}`"
                            icon="i-lucide-arrow-left"
                            color="neutral"
                            variant="ghost"
                        />
                    </template>

                    <template #title>
                        <div class="flex items-center gap-2.5">
                            <span :class="['w-2 h-2 rounded-full flex-shrink-0', statusDotColor]" />
                            <div>
                                <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    {{ product?.name || 'Бараа засах' }}
                                </h1>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ statusLabel }}
                                </p>
                            </div>
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

                <div v-else-if="product" class="bg-gray-50 dark:bg-gray-950/60 min-h-full p-6 overflow-y-auto">
                    <UForm id="product-form" :schema="schema" :state="state" @submit="onSubmit">
                        <div class="space-y-5 max-w-7xl mx-auto">

                            <!-- TOP CARD: Images | Info | Price+Status -->
                            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr_220px] gap-6">

                                    <!-- Column 1: Image Gallery -->
                                    <div>
                                        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Зураг</p>
                                        <ProductImageUpload v-model="images" />
                                    </div>

                                    <!-- Column 2: Core Product Info -->
                                    <div class="space-y-4">
                                        <UFormField label="Барааны нэр" name="name" required>
                                            <UInput
                                                v-model="state.name"
                                                placeholder="Барааны гарчгийг оруулна уу"
                                                size="lg"
                                            />
                                        </UFormField>

                                        <UFormField label="Түлхүүр үг" name="keyword" required>
                                            <UInput
                                                v-model="state.keyword"
                                                placeholder="жишээ нь: цамц-улаан"
                                                size="lg"
                                                @update:model-value="keywordDirty = true"
                                            >
                                                <template #trailing>
                                                    <UTooltip text="Комментоос энэ үгийг ашиглан барааг таньдаг. Жишээ: хэрэглэгч 'цамц-улаан' гэж комментлоход захиалга автоматаар үүснэ.">
                                                        <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-gray-400 cursor-help" />
                                                    </UTooltip>
                                                </template>
                                            </UInput>
                                        </UFormField>

                                        <div class="grid grid-cols-2 gap-4">
                                            <UFormField label="Ангилал">
                                                <UInput
                                                    v-model="state.category"
                                                    placeholder="Эмэгтэй хувцас, Гэр ахуй..."
                                                    size="lg"
                                                />
                                            </UFormField>
                                            <UFormField label="Төлөв" required>
                                                <USelect
                                                    v-model="state.status"
                                                    :items="statusOptions"
                                                    size="lg"
                                                />
                                            </UFormField>
                                        </div>
                                    </div>

                                    <!-- Column 3: Price Display + Status Indicator -->
                                    <div class="flex flex-col gap-3">
                                        <div class="flex-1 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 rounded-xl border border-sky-100 dark:border-sky-900/50 p-4">
                                            <p class="text-xs font-semibold text-sky-500 dark:text-sky-400 uppercase tracking-wider mb-3">Үндсэн үнэ</p>
                                            <div class="flex items-baseline gap-1">
                                                <span class="text-2xl font-light text-sky-400 dark:text-sky-500">₮</span>
                                                <input
                                                    v-model.number="state.price"
                                                    type="number"
                                                    placeholder="0"
                                                    class="text-4xl font-bold text-gray-900 dark:text-white bg-transparent outline-none w-full border-b-2 border-sky-200 dark:border-sky-800 focus:border-sky-500 transition-colors pb-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                            <p class="text-xs text-sky-400 dark:text-sky-500 mt-2">Монгол төгрөг</p>
                                        </div>

                                        <div
                                            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors"
                                            :class="{
                                                'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/60': state.status === 'active',
                                                'bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700': state.status === 'draft',
                                                'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/60': state.status === 'out_of_stock'
                                            }"
                                        >
                                            <span :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', statusDotColor]" />
                                            <span
                                                class="text-sm font-medium"
                                                :class="{
                                                    'text-emerald-700 dark:text-emerald-300': state.status === 'active',
                                                    'text-gray-600 dark:text-gray-400': state.status === 'draft',
                                                    'text-red-700 dark:text-red-300': state.status === 'out_of_stock'
                                                }"
                                            >{{ statusLabel }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- BOTTOM: 2-col grid -->
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

                                <!-- Left (2/3): Variants + Discounts -->
                                <div class="lg:col-span-2 space-y-5">

                                    <!-- Variants Card -->
                                    <ProductFormCard>
                                        <template #title>
                                            <span>Хэмжээ / Сонголтууд</span>
                                            <UTooltip
                                                text="Барааны хэмжээ, өнгө эсвэл бусад ялгааг энд нэм. Жишээ: S, M, L, XL эсвэл Улаан, Цагаан, Хар. Сонголт нэмсэн үед тус бүрд үлдэгдэл тохируулна."
                                                :popper="{ placement: 'top' }"
                                            >
                                                <UIcon name="i-lucide-help-circle" class="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                            </UTooltip>
                                        </template>

                                        <UFormField v-if="options.length === 0" label="Үлдэгдэл" name="stock_quantity" class="mb-4">
                                            <UInput v-model.number="state.stock_quantity" type="number" placeholder="0" size="lg">
                                                <template #trailing>
                                                    <span class="text-gray-400 text-sm">ш</span>
                                                </template>
                                            </UInput>
                                        </UFormField>

                                        <div v-if="options.length > 0" class="mb-3 space-y-2">
                                            <div class="grid gap-2 mb-1" style="grid-template-columns: 1fr 6rem 2rem">
                                                <span class="text-xs text-gray-400 dark:text-gray-500 px-1">Нэр (хэмжээ, өнгө...)</span>
                                                <span class="text-xs text-gray-400 dark:text-gray-500 text-center">Үлдэгдэл</span>
                                                <span />
                                            </div>
                                            <div
                                                v-for="(option, index) in options"
                                                :key="index"
                                                class="grid gap-2 items-center"
                                                style="grid-template-columns: 1fr 6rem 2rem"
                                            >
                                                <UInput v-model="option.name" placeholder="жишээ нь: S, M, L, XL" :ui="{ base: !option.name.trim() ? 'ring-red-500' : '' }" />
                                                <UInput v-model.number="option.stock" type="number" placeholder="0">
                                                    <template #trailing><span class="text-gray-400 text-xs">ш</span></template>
                                                </UInput>
                                                <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="removeOption(index)" />
                                            </div>
                                        </div>

                                        <div class="space-y-2 mb-3">
                                            <div v-for="group in quickVariants" :key="group.label" class="flex flex-wrap items-center gap-1.5">
                                                <span class="text-xs text-gray-400 dark:text-gray-500 w-24 shrink-0">{{ group.label }}:</span>
                                                <button
                                                    v-for="item in group.items"
                                                    :key="item"
                                                    type="button"
                                                    class="px-2 py-0.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                                                    @click="addOption(item)"
                                                >{{ item }}</button>
                                            </div>
                                        </div>

                                        <UButton icon="i-lucide-plus" color="neutral" variant="ghost" size="sm" @click="addOption()">
                                            Өөр сонголт нэмэх
                                        </UButton>
                                    </ProductFormCard>

                                    <!-- Discounts Card -->
                                    <ProductFormCard title="Хямдрал ба урамшуулал">
                                        <div class="grid grid-cols-2 gap-3 mb-4">
                                            <div
                                                class="p-3 rounded-lg border-2 transition-all cursor-pointer"
                                                :class="state.timed_sale_enabled ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'"
                                                @click="state.timed_sale_enabled = !state.timed_sale_enabled"
                                            >
                                                <div class="flex items-center justify-between gap-2">
                                                    <div class="flex items-center gap-2">
                                                        <UIcon name="i-lucide-tag" class="w-4 h-4" :class="state.timed_sale_enabled ? 'text-rose-600' : 'text-gray-400'" />
                                                        <span class="text-sm font-medium" :class="state.timed_sale_enabled ? 'text-rose-700 dark:text-rose-300' : 'text-gray-700 dark:text-gray-300'">Хямдрал</span>
                                                    </div>
                                                    <USwitch :model-value="state.timed_sale_enabled" size="xs" @click.stop @update:model-value="state.timed_sale_enabled = $event" />
                                                </div>
                                            </div>

                                            <div
                                                class="p-3 rounded-lg border-2 transition-all cursor-pointer"
                                                :class="state.bulk_discount_enabled ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'"
                                                @click="state.bulk_discount_enabled = !state.bulk_discount_enabled"
                                            >
                                                <div class="flex items-center justify-between gap-2">
                                                    <div class="flex items-center gap-2">
                                                        <UIcon name="i-lucide-boxes" class="w-4 h-4" :class="state.bulk_discount_enabled ? 'text-primary-600' : 'text-gray-400'" />
                                                        <span class="text-sm font-medium" :class="state.bulk_discount_enabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'">Олноор авахад</span>
                                                    </div>
                                                    <USwitch :model-value="state.bulk_discount_enabled" size="xs" @click.stop @update:model-value="state.bulk_discount_enabled = $event" />
                                                </div>
                                            </div>
                                        </div>

                                        <div v-if="state.timed_sale_enabled" class="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/50 space-y-3 mb-3">
                                            <div v-if="timedSaleActivatesImmediately" class="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-md">
                                                <UIcon name="i-lucide-zap" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                <span class="text-xs font-medium text-emerald-700 dark:text-emerald-300">Хугацаа оруулаагүй бол шууд идэвхжинэ</span>
                                            </div>
                                            <div class="grid grid-cols-3 gap-3">
                                                <UFormField label="Хямдралын үнэ" required>
                                                    <UInput v-model.number="state.timed_sale_price" type="number" placeholder="0" size="sm">
                                                        <template #leading><span class="text-rose-500">₮</span></template>
                                                    </UInput>
                                                </UFormField>
                                                <UFormField label="Эхлэх">
                                                    <UInput v-model="state.timed_sale_start" type="datetime-local" size="sm" />
                                                </UFormField>
                                                <UFormField label="Дуусах">
                                                    <UInput v-model="state.timed_sale_end" type="datetime-local" size="sm" />
                                                </UFormField>
                                            </div>
                                        </div>

                                        <div v-if="state.bulk_discount_enabled" class="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-lg border border-primary-200 dark:border-primary-900/50">
                                            <div class="grid grid-cols-2 gap-3">
                                                <UFormField label="Дор хаяж (ширхэг)">
                                                    <UInput v-model.number="state.bulk_discount_quantity" type="number" placeholder="3" size="sm">
                                                        <template #trailing><span class="text-primary-500 text-xs">ш</span></template>
                                                    </UInput>
                                                </UFormField>
                                                <UFormField label="Нэгж үнэ">
                                                    <UInput v-model.number="state.bulk_discount_price" type="number" placeholder="0" size="sm">
                                                        <template #leading><span class="text-primary-500">₮</span></template>
                                                    </UInput>
                                                </UFormField>
                                            </div>
                                        </div>
                                    </ProductFormCard>
                                </div>

                                <!-- Right (1/3): Settings + Customer Preview -->
                                <div class="space-y-5">

                                    <!-- Settings Card -->
                                    <ProductFormCard title="Тохиргоо">
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
                                    </ProductFormCard>

                                    <!-- Customer View Preview Card -->
                                    <ProductFormCard>
                                        <template #title>
                                            <UIcon name="i-lucide-eye" class="w-3.5 h-3.5 text-gray-400" />
                                            <span>Харилцагчид харагдах байдал</span>
                                        </template>

                                        <div class="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <!-- Product image mock -->
                                            <div class="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center relative overflow-hidden">
                                                <img v-if="images.length > 0" :src="images[0]" class="w-full h-full object-cover absolute inset-0" alt="" />
                                                <UIcon v-else name="i-lucide-image" class="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                                <div v-if="state.timed_sale_enabled && state.timed_sale_price && timedSaleDiscountPercent > 0" class="absolute top-2 left-2">
                                                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shadow">
                                                        -{{ timedSaleDiscountPercent }}%
                                                    </span>
                                                </div>
                                            </div>

                                            <!-- Product details -->
                                            <div class="p-3.5 bg-white dark:bg-gray-900">
                                                <p class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 leading-snug">
                                                    {{ state.name || 'Барааны нэр...' }}
                                                </p>

                                                <div class="flex items-baseline gap-2 flex-wrap mb-2">
                                                    <span
                                                        class="text-xl font-bold"
                                                        :class="state.timed_sale_enabled && state.timed_sale_price ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'"
                                                    >
                                                        {{ (state.timed_sale_enabled && state.timed_sale_price ? state.timed_sale_price : state.price || 0).toLocaleString() }}₮
                                                    </span>
                                                    <span v-if="state.timed_sale_enabled && state.timed_sale_price && state.price" class="text-xs text-gray-400 line-through">
                                                        {{ state.price.toLocaleString() }}₮
                                                    </span>
                                                </div>

                                                <div v-if="state.bulk_discount_enabled && state.bulk_discount_price && state.price" class="mb-2">
                                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                                                        <UIcon name="i-lucide-boxes" class="w-3 h-3" />
                                                        {{ state.bulk_discount_quantity }}+ авахад {{ state.bulk_discount_price.toLocaleString() }}₮
                                                    </span>
                                                </div>

                                                <div class="w-full py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold text-center mt-1">
                                                    Захиалах
                                                </div>
                                            </div>
                                        </div>
                                    </ProductFormCard>
                                </div>
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
