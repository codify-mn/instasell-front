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

                <div v-else-if="product" class="min-h-full p-4 lg:p-6">
                    <UForm id="product-form" :schema="schema" :state="state" @submit="onSubmit">
                        <div class="flex flex-col lg:flex-row gap-5 max-w-7xl mx-auto lg:items-start">

                            <!-- Left: Image + Info + Variants + Discounts -->
                            <div class="flex-1 min-w-0 space-y-5">

                                <!-- Image + Product Info Card -->
                                <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                    <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">

                                        <!-- Column 1: Image Gallery -->
                                        <div>
                                            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Зураг</h3>
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
                                                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                                    Хэрэглэгч энэ үгийг комментлоход захиалга автоматаар үүснэ
                                                </p>
                                            </UFormField>

                                            <UFormField label="Ангилал">
                                                <UInput
                                                    v-model="state.category"
                                                    placeholder="Эмэгтэй хувцас, Гэр ахуй..."
                                                    size="lg"
                                                />
                                            </UFormField>

                                            <!-- Price + Status inline -->
                                            <div class="grid grid-cols-2 gap-4">
                                                <UFormField label="Үндсэн үнэ" name="price" required>
                                                    <UInput
                                                        v-model.number="state.price"
                                                        type="number"
                                                        placeholder="0"
                                                        size="lg"
                                                    >
                                                        <template #leading>
                                                            <span class="text-gray-400 font-medium">₮</span>
                                                        </template>
                                                    </UInput>
                                                </UFormField>

                                                <div>
                                                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Төлөв</p>
                                                    <UDropdownMenu :items="statusOptions.map(o => ({ label: o.label, onSelect: () => { state.status = o.value } }))">
                                                        <div
                                                            class="flex items-center gap-2 px-3 py-2 h-10 rounded-lg border cursor-pointer transition-colors select-none text-sm"
                                                            :class="{
                                                                'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300': state.status === 'active',
                                                                'bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700 text-gray-600 dark:text-gray-400': state.status === 'draft',
                                                                'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/60 text-red-700 dark:text-red-300': state.status === 'out_of_stock'
                                                            }"
                                                        >
                                                            <span :class="['w-2 h-2 rounded-full flex-shrink-0', statusDotColor]" />
                                                            <span class="font-medium flex-1">{{ statusLabel }}</span>
                                                            <UIcon name="i-lucide-chevrons-up-down" class="w-3 h-3 opacity-40" />
                                                        </div>
                                                    </UDropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Variants Card -->
                                <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                    <div class="flex items-center justify-between mb-4">
                                        <div class="flex items-center gap-2">
                                            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Хэмжээ / Сонголтууд</h3>
                                            <UTooltip text="Барааны хэмжээ, өнгө эсвэл бусад ялгааг нэм. Сонголт нэмсэн үед тус бүрд үлдэгдэл тохируулна." :popper="{ placement: 'top' }">
                                                <UIcon name="i-lucide-help-circle" class="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                            </UTooltip>
                                        </div>
                                        <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addOption()">
                                            Сонголт нэмэх
                                        </UButton>
                                    </div>

                                    <!-- No variants: show stock field -->
                                    <UFormField v-if="options.length === 0" label="Үлдэгдэл" name="stock_quantity" class="mb-4">
                                        <UInput v-model.number="state.stock_quantity" type="number" placeholder="0" size="lg">
                                            <template #trailing><span class="text-gray-400 text-sm">ш</span></template>
                                        </UInput>
                                    </UFormField>

                                    <!-- Variant rows -->
                                    <div v-if="options.length > 0" class="mb-4">
                                        <table class="w-full text-sm">
                                            <thead>
                                                <tr class="border-b border-gray-100 dark:border-gray-800">
                                                    <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4">Нэр / Хэмжээ</th>
                                                    <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4 w-28">Үлдэгдэл</th>
                                                    <th class="w-8" />
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-gray-50 dark:divide-gray-800/50">
                                                <tr v-for="(option, index) in options" :key="index">
                                                    <td class="py-2 pr-4">
                                                        <UInput
                                                            v-model="option.name"
                                                            placeholder="жишээ нь: S, M, XL, Улаан"
                                                            size="sm"
                                                            :ui="{ base: !option.name.trim() ? 'ring-red-500' : '' }"
                                                        />
                                                    </td>
                                                    <td class="py-2 pr-4">
                                                        <UInput v-model.number="option.stock" type="number" placeholder="0" size="sm">
                                                            <template #trailing><span class="text-gray-400 text-xs">ш</span></template>
                                                        </UInput>
                                                    </td>
                                                    <td class="py-2">
                                                        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="removeOption(index)" />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <!-- Quick add chips -->
                                    <div class="space-y-1.5">
                                        <div v-for="group in quickVariants" :key="group.label" class="flex flex-wrap items-center gap-1.5">
                                            <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0 min-w-[5rem]">{{ group.label }}:</span>
                                            <button
                                                v-for="item in group.items"
                                                :key="item"
                                                type="button"
                                                class="px-2 py-0.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                                                @click="addOption(item)"
                                            >{{ item }}</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Discounts Card -->
                                <ProductFormCard title="Хямдрал ба урамшуулал">
                                    <div class="grid grid-cols-2 gap-3 mb-4">
                                        <!-- Timed sale toggle -->
                                        <div
                                            class="p-3 rounded-lg border-2 transition-all cursor-pointer"
                                            :class="state.timed_sale_enabled ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'"
                                            @click="state.timed_sale_enabled = !state.timed_sale_enabled"
                                        >
                                            <div class="flex items-start justify-between gap-2">
                                                <div class="flex items-center gap-2">
                                                    <UIcon name="i-lucide-tag" class="w-4 h-4 mt-0.5" :class="state.timed_sale_enabled ? 'text-primary-600' : 'text-gray-400'" />
                                                    <div>
                                                        <span class="text-sm font-medium block" :class="state.timed_sale_enabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'">Хямдрал</span>
                                                        <span v-if="state.timed_sale_enabled && state.timed_sale_price" class="text-xs text-primary-500 font-medium">
                                                            {{ state.timed_sale_price.toLocaleString() }}₮ · -{{ timedSaleDiscountPercent }}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <USwitch :model-value="state.timed_sale_enabled" size="xs" @click.stop @update:model-value="state.timed_sale_enabled = $event" />
                                            </div>
                                        </div>

                                        <!-- Bulk discount toggle -->
                                        <div
                                            class="p-3 rounded-lg border-2 transition-all cursor-pointer"
                                            :class="state.bulk_discount_enabled ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'"
                                            @click="state.bulk_discount_enabled = !state.bulk_discount_enabled"
                                        >
                                            <div class="flex items-start justify-between gap-2">
                                                <div class="flex items-center gap-2">
                                                    <UIcon name="i-lucide-boxes" class="w-4 h-4 mt-0.5" :class="state.bulk_discount_enabled ? 'text-primary-600' : 'text-gray-400'" />
                                                    <div>
                                                        <span class="text-sm font-medium block" :class="state.bulk_discount_enabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'">Олноор авахад</span>
                                                        <span v-if="state.bulk_discount_enabled && state.bulk_discount_price" class="text-xs text-primary-500 font-medium">
                                                            {{ state.bulk_discount_quantity }}+ ш · -{{ bulkDiscountPercent }}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <USwitch :model-value="state.bulk_discount_enabled" size="xs" @click.stop @update:model-value="state.bulk_discount_enabled = $event" />
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Timed sale config -->
                                    <div v-if="state.timed_sale_enabled" class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 mb-3">
                                        <div v-if="timedSaleActivatesImmediately" class="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-800/50">
                                            <UIcon name="i-lucide-zap" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                            <span class="text-xs font-medium text-amber-700 dark:text-amber-300">Хугацаа тохируулаагүй тул шууд идэвхжинэ</span>
                                        </div>
                                        <div class="grid grid-cols-3 gap-3">
                                            <UFormField label="Хямдралын үнэ" required>
                                                <UInput v-model.number="state.timed_sale_price" type="number" placeholder="0" size="sm">
                                                    <template #leading><span class="text-gray-400">₮</span></template>
                                                </UInput>
                                            </UFormField>
                                            <UFormField label="Эхлэх"><UInput v-model="state.timed_sale_start" type="datetime-local" size="sm" /></UFormField>
                                            <UFormField label="Дуусах"><UInput v-model="state.timed_sale_end" type="datetime-local" size="sm" /></UFormField>
                                        </div>
                                    </div>

                                    <!-- Bulk config -->
                                    <div v-if="state.bulk_discount_enabled" class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div class="grid grid-cols-2 gap-3">
                                            <UFormField label="Дор хаяж (ширхэг)">
                                                <UInput v-model.number="state.bulk_discount_quantity" type="number" placeholder="3" size="sm">
                                                    <template #trailing><span class="text-gray-400 text-xs">ш</span></template>
                                                </UInput>
                                            </UFormField>
                                            <UFormField label="Нэгж үнэ">
                                                <UInput v-model.number="state.bulk_discount_price" type="number" placeholder="0" size="sm">
                                                    <template #leading><span class="text-gray-400">₮</span></template>
                                                </UInput>
                                            </UFormField>
                                        </div>
                                    </div>
                                </ProductFormCard>
                            </div>

                            <!-- Right sidebar: Preview + Settings -->
                            <div class="w-full lg:w-72 lg:shrink-0 space-y-5 lg:sticky lg:top-6">

                                <!-- Live Preview Card -->
                                <ProductFormCard>
                                    <template #title>
                                        <UIcon name="i-lucide-eye" class="w-3.5 h-3.5 text-gray-400" />
                                        <span>Харилцагчид харагдах байдал</span>
                                    </template>

                                    <div class="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <div class="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center relative overflow-hidden">
                                            <img v-if="images.length > 0" :src="images[0]" class="w-full h-full object-cover absolute inset-0" alt="" />
                                            <UIcon v-else name="i-lucide-image" class="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                            <div v-if="state.timed_sale_enabled && state.timed_sale_price && timedSaleDiscountPercent > 0" class="absolute top-2 left-2">
                                                <span class="inline-flex items-center gap-1 px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shadow">
                                                    -{{ timedSaleDiscountPercent }}%
                                                </span>
                                            </div>
                                        </div>

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
                                                Сагсанд нэмэх
                                            </div>
                                        </div>
                                    </div>
                                </ProductFormCard>

                                <!-- Settings Card -->
                                <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-1">
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
                            </div>
                        </div>

                        <!-- Bottom Save Button -->
                        <div class="flex justify-end pt-2 max-w-7xl mx-auto">
                            <UButton
                                type="submit"
                                color="primary"
                                icon="i-lucide-check"
                                size="lg"
                                :loading="saving"
                            >
                                Хадгалах
                            </UButton>
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
