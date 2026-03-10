<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

useSeoMeta({
    title: 'Бараа нэмэх - Instasell'
})

const { createProduct } = useProducts()
const toast = useToast()
const router = useRouter()

const loading = ref(false)
const images = ref<string[]>([])

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

    loading.value = true

    try {
        const { keyword, stock_quantity, ...productData } = event.data
        const product = await createProduct({
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
                        <div class="flex items-center gap-2.5">
                            <span :class="['w-2 h-2 rounded-full flex-shrink-0', statusDotColor]" />
                            <div>
                                <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    Бараа нэмэх
                                </h1>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ statusLabel }}
                                </p>
                            </div>
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
                <div class="bg-gray-50 dark:bg-gray-950/60 min-h-full p-6 overflow-y-auto">
                    <UForm id="product-form" :schema="schema" :state="state" @submit="onSubmit">
                        <div class="space-y-5 max-w-7xl mx-auto">

                            <!-- TOP CARD: [Image Gallery] | [Product Info] -->
                            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

                                    <!-- Left: Image Gallery (big + thumbnails) -->
                                    <ProductImageUpload v-model="images" />

                                    <!-- Right: Product Info -->
                                    <div class="space-y-4">
                                        <!-- Name -->
                                        <UFormField name="name" required>
                                            <UInput
                                                v-model="state.name"
                                                placeholder="Барааны нэр"
                                                size="xl"
                                                variant="none"
                                                class="text-2xl font-bold px-0"
                                            />
                                        </UFormField>

                                        <!-- Price + Status side by side -->
                                        <div class="flex items-start gap-6 flex-wrap">
                                            <div>
                                                <p class="text-xs text-gray-400 dark:text-gray-500 mb-1">Үндсэн үнэ</p>
                                                <div class="flex items-baseline gap-1">
                                                    <span class="text-xl font-light text-gray-400">₮</span>
                                                    <input
                                                        v-model.number="state.price"
                                                        type="number"
                                                        placeholder="0"
                                                        class="text-3xl font-bold text-gray-900 dark:text-white bg-transparent outline-none border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 transition-colors pb-0.5 w-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-400 dark:text-gray-500 mb-1">Status Badge</p>
                                                <div
                                                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                                                    :class="{
                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300': state.status === 'active',
                                                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400': state.status === 'draft',
                                                        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300': state.status === 'out_of_stock'
                                                    }"
                                                >
                                                    <span :class="['w-1.5 h-1.5 rounded-full', statusDotColor]" />
                                                    {{ statusLabel }}
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Status + Category row -->
                                        <div class="grid grid-cols-2 gap-4">
                                            <UFormField label="Ангилал">
                                                <UInput
                                                    v-model="state.category"
                                                    placeholder="Эмэгтэй хувцас, Гэр ахуй..."
                                                    size="lg"
                                                />
                                            </UFormField>
                                            <UFormField label="Төлөв" required>
                                                <USelect v-model="state.status" :items="statusOptions" size="lg" />
                                            </UFormField>
                                        </div>

                                        <!-- Keyword -->
                                        <UFormField label="Түлхүүр үг" name="keyword" required>
                                            <UTooltip text="Хэрэглэгч Facebook коммент дээр энэ үгийг бичихэд захиалга автоматаар үүснэ. Жишээ: 'цамц-улаан'" :popper="{ placement: 'top' }">
                                                <template #default="{ open }">
                                                    <UTextarea
                                                        v-model="state.keyword"
                                                        placeholder="Барааны мэдээлэл, тайлбар..."
                                                        :rows="3"
                                                        @update:model-value="keywordDirty = true"
                                                    />
                                                </template>
                                            </UTooltip>
                                            <UInput
                                                v-model="state.keyword"
                                                placeholder="жишээ нь: цамц-улаан"
                                                size="lg"
                                                class="mt-0"
                                                @update:model-value="keywordDirty = true"
                                            >
                                                <template #trailing>
                                                    <UTooltip text="Хэрэглэгч Facebook коммент дээр энэ үгийг бичихэд захиалга автоматаар үүснэ.">
                                                        <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-gray-400 cursor-help" />
                                                    </UTooltip>
                                                </template>
                                            </UInput>
                                        </UFormField>
                                    </div>
                                </div>
                            </div>

                            <!-- BOTTOM: 2-col grid -->
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

                                <!-- Left (2/3): Variants + Discounts -->
                                <div class="lg:col-span-2 space-y-5">

                                    <!-- Variant Table Card -->
                                    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                        <div class="flex items-center justify-between mb-4">
                                            <div class="flex items-center gap-2">
                                                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Variant Table</h3>
                                                <UTooltip text="Барааны хэмжээ, өнгө эсвэл бусад ялгааг нэм. Сонголт нэмсэн үед тус бүрд үлдэгдэл тохируулна." :popper="{ placement: 'top' }">
                                                    <UIcon name="i-lucide-help-circle" class="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                                </UTooltip>
                                            </div>
                                        </div>

                                        <!-- No variants: stock field -->
                                        <UFormField v-if="options.length === 0" label="Үлдэгдэл" name="stock_quantity" class="mb-4">
                                            <UInput v-model.number="state.stock_quantity" type="number" placeholder="0" size="lg">
                                                <template #trailing><span class="text-gray-400 text-sm">ш</span></template>
                                            </UInput>
                                        </UFormField>

                                        <!-- Variant table -->
                                        <div v-if="options.length > 0" class="mb-4">
                                            <table class="w-full text-sm">
                                                <thead>
                                                    <tr class="border-b border-gray-100 dark:border-gray-800">
                                                        <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4">Нэр / Хэмжээ</th>
                                                        <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-4 w-28">Үлдэгдэл</th>
                                                        <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 w-8" />
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-gray-50 dark:divide-gray-800/50">
                                                    <tr v-for="(option, index) in options" :key="index" class="group">
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

                                        <!-- Quick-add chips -->
                                        <div class="space-y-1.5 mb-4">
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

                                        <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" @click="addOption()">
                                            Шинэ сонголт нэмэх
                                        </UButton>
                                    </div>

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
                                                <UFormField label="Эхлэх"><UInput v-model="state.timed_sale_start" type="datetime-local" size="sm" /></UFormField>
                                                <UFormField label="Дуусах"><UInput v-model="state.timed_sale_end" type="datetime-local" size="sm" /></UFormField>
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

                                <!-- Right (1/3): Live Preview + Settings -->
                                <div class="space-y-5">

                                    <!-- Live Preview Card -->
                                    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Live Preview</h3>
                                        <div class="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                                            <div class="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50">
                                                <!-- Thumbnail -->
                                                <div class="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 relative">
                                                    <img v-if="images.length > 0" :src="images[0]" class="w-full h-full object-cover" alt="" />
                                                    <UIcon v-else name="i-lucide-image" class="w-6 h-6 text-gray-400 absolute inset-0 m-auto" />
                                                    <div v-if="state.timed_sale_enabled && state.timed_sale_price && timedSaleDiscountPercent > 0" class="absolute top-1 left-1">
                                                        <span class="text-xs bg-rose-500 text-white font-bold px-1 rounded">-{{ timedSaleDiscountPercent }}%</span>
                                                    </div>
                                                </div>
                                                <!-- Info -->
                                                <div class="flex-1 min-w-0">
                                                    <p class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1">
                                                        {{ state.name || 'Барааны нэр...' }}
                                                    </p>
                                                    <div class="flex items-baseline gap-1.5">
                                                        <span class="text-lg font-bold" :class="state.timed_sale_enabled && state.timed_sale_price ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'">
                                                            {{ (state.timed_sale_enabled && state.timed_sale_price ? state.timed_sale_price : state.price || 0).toLocaleString() }}₮
                                                        </span>
                                                        <span v-if="state.timed_sale_enabled && state.timed_sale_price && state.price" class="text-xs text-gray-400 line-through">{{ state.price.toLocaleString() }}₮</span>
                                                    </div>
                                                    <!-- Variant chips -->
                                                    <div v-if="options.length > 0" class="flex flex-wrap gap-1 mt-2">
                                                        <span class="text-xs text-gray-500 dark:text-gray-400 mr-1">Хэмжээ</span>
                                                        <span
                                                            v-for="(opt, i) in options.slice(0, 6)"
                                                            :key="i"
                                                            class="px-2 py-0.5 text-xs rounded border"
                                                            :class="i === 0 ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'"
                                                        >{{ opt.name }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="px-3 pb-3 pt-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                                                <div class="w-full py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold text-center">
                                                    Сагсанд нэмэх
                                                </div>
                                            </div>
                                        </div>
                                    </div>

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
                        </div>
                    </UForm>
                </div>
            </template>
        </UDashboardPanel>
    </div>
</template>
