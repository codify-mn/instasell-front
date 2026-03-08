<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import type { ProductPostStats, PostComment } from '~/composables/useProductPosts'
const route = useRoute()
const router = useRouter()
const toast = useToast()

const { fetchProduct, deleteProduct } = useProducts()
const { fetchProductPosts, fetchPostComments, refreshPostStats } = useProductPosts()

const productId = computed(() => Number(route.params.id))

const loading = ref(true)
const product = ref<Product | null>(null)

useSeoMeta({
    title: () => (product.value ? `${product.value.name} - Instasell` : 'Бүтээгдэхүүн - Instasell')
})

const loadProduct = async () => {
    loading.value = true
    try {
        product.value = await fetchProduct(productId.value)
    } catch {
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

// Facebook Posts
const posts = ref<ProductPostStats[]>([])
const postsLoading = ref(false)
const selectedPost = ref<ProductPostStats | null>(null)
const comments = ref<PostComment[]>([])
const commentsTotal = ref(0)
const commentsLoading = ref(false)
const commentsPage = ref(1)
const commentsSize = 20
const refreshingStats = ref<number | null>(null)

const commentsTotalPages = computed(() => Math.ceil(commentsTotal.value / commentsSize))

const loadPosts = async () => {
    postsLoading.value = true
    try {
        posts.value = await fetchProductPosts(productId.value)
        if (posts.value.length > 0 && !selectedPost.value) {
            selectedPost.value = posts.value[0] ?? null
            await loadComments()
        }
    } catch {
        // silent
    } finally {
        postsLoading.value = false
    }
}

const loadComments = async () => {
    if (!selectedPost.value) return
    commentsLoading.value = true
    try {
        const res = await fetchPostComments(
            productId.value,
            selectedPost.value.id,
            commentsPage.value,
            commentsSize
        )
        comments.value = res.comments || []
        commentsTotal.value = res.total
    } catch {
        // silent
    } finally {
        commentsLoading.value = false
    }
}

const selectPost = async (post: ProductPostStats) => {
    selectedPost.value = post
    commentsPage.value = 1
    await loadComments()
}

const refreshStats = async (post: ProductPostStats) => {
    refreshingStats.value = post.id
    try {
        const updated = await refreshPostStats(productId.value, post.id)
        const idx = posts.value.findIndex((p) => p.id === post.id)
        if (idx !== -1) {
            posts.value[idx] = updated
        }
        if (selectedPost.value?.id === post.id) {
            selectedPost.value = updated
        }
        toast.add({ title: 'Амжилттай', description: 'Статистик шинэчлэгдлээ', color: 'success' })
    } catch {
        toast.add({
            title: 'Алдаа',
            description: 'Статистик шинэчлэхэд алдаа гарлаа',
            color: 'error'
        })
    } finally {
        refreshingStats.value = null
    }
}

const prevCommentsPage = () => {
    if (commentsPage.value > 1) {
        commentsPage.value--
        loadComments()
    }
}

const nextCommentsPage = () => {
    if (commentsPage.value < commentsTotalPages.value) {
        commentsPage.value++
        loadComments()
    }
}

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const timeAgo = (dateStr: string) => {
    const now = new Date()
    const d = new Date(dateStr)
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    const diffWeek = Math.floor(diffDay / 7)

    if (diffMin < 1) return 'Саяхан'
    if (diffMin < 60) return `${diffMin} мин`
    if (diffHour < 24) return `${diffHour} цаг`
    if (diffDay < 7) return `${diffDay} өдөр`
    if (diffWeek < 4) return `${diffWeek} долоо хоног`
    return formatDate(dateStr)
}

const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
}

const purposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
        sale: 'Хямдрал',
        new_arrival: 'Шинэ бараа',
        normal: 'Энгийн'
    }
    return labels[purpose] || purpose
}

const captionExpanded = ref<Record<number, boolean>>({})
const toggleCaption = (postId: number) => {
    captionExpanded.value[postId] = !captionExpanded.value[postId]
}
const isCaptionLong = (caption: string) => caption.length > 200

// Stats
const totalPostViews = computed(() => posts.value.reduce((acc, p) => acc + p.views_count, 0))
const totalPostReactions = computed(() =>
    posts.value.reduce((acc, p) => acc + p.reactions_count, 0)
)
const totalPostComments = computed(() => posts.value.reduce((acc, p) => acc + p.comments_count, 0))

onMounted(async () => {
    await loadProduct()
    await loadPosts()
})
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="product-overview">
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
                        <div v-if="product">
                            <h1
                                class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                            >
                                {{ product.name }}
                                <UBadge
                                    :color="
                                        product.status === 'active'
                                            ? 'success'
                                            : product.status === 'draft'
                                              ? 'neutral'
                                              : 'error'
                                    "
                                    variant="subtle"
                                    size="xs"
                                >
                                    {{
                                        product.status === 'active'
                                            ? 'Идэвхтэй'
                                            : product.status === 'draft'
                                              ? 'Ноорог'
                                              : 'Дууссан'
                                    }}
                                </UBadge>
                            </h1>
                        </div>
                        <div v-else>
                            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Уншиж байна...
                            </h1>
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
                                :to="`/dashboard/products/${productId}/edit`"
                                color="primary"
                                icon="i-lucide-pencil"
                            >
                                Засах
                            </UButton>
                        </div>
                    </template>
                </UDashboardNavbar>

                <UDashboardToolbar>
                    <UNavigationMenu
                        :items="[
                            [
                                {
                                    label: 'Тойм',
                                    icon: 'i-lucide-activity',
                                    to: `/dashboard/products/${productId}`,
                                    exact: true
                                },
                                {
                                    label: 'Засах',
                                    icon: 'i-lucide-pen-line',
                                    to: `/dashboard/products/${productId}/edit`
                                }
                            ]
                        ]"
                        highlight
                        class="-mx-1 flex-1"
                    />
                </UDashboardToolbar>
            </template>

            <template #body>
                <div v-if="loading" class="flex items-center justify-center p-20">
                    <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
                </div>

                <div v-else-if="product" class="p-6 overflow-y-auto max-w-6xl mx-auto space-y-8">
                    <!-- Product Info Summary -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Left: Main Image -->
                        <div
                            class="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden aspect-square border border-gray-100 dark:border-gray-800 flex items-center justify-center"
                        >
                            <img
                                v-if="product.images && product.images.length > 0"
                                :src="product.images[0]"
                                :alt="product.name"
                                class="w-full h-full object-cover"
                            />
                            <UIcon v-else name="i-lucide-image" class="w-16 h-16 text-gray-400" />
                        </div>

                        <!-- Right: Details -->
                        <div class="md:col-span-2 space-y-4">
                            <div
                                class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
                            >
                                <h3 class="text-sm font-medium text-gray-500 mb-4">
                                    Ерөнхий мэдээлэл
                                </h3>
                                <div class="grid grid-cols-2 gap-y-4 gap-x-6">
                                    <div>
                                        <p class="text-xs text-gray-500 mb-1">Үнэ</p>
                                        <p
                                            class="text-lg font-semibold text-gray-900 dark:text-white"
                                        >
                                            {{ product.price.toLocaleString() }}₮
                                        </p>
                                    </div>
                                    <div v-if="product.timed_sale_enabled">
                                        <p class="text-xs text-rose-500 mb-1">Хямдралтай үнэ</p>
                                        <p class="text-lg font-semibold text-rose-600">
                                            {{ product.timed_sale_price?.toLocaleString() || 0 }}₮
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500 mb-1">Үлдэгдэл</p>
                                        <p
                                            class="text-lg font-medium text-gray-900 dark:text-white"
                                        >
                                            {{
                                                product.has_variants
                                                    ? 'Хувилбартай'
                                                    : `${product.stock_quantity} ш`
                                            }}
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500 mb-1">Түлхүүр үг</p>
                                        <p
                                            class="text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 inline-block px-2 py-1 rounded"
                                        >
                                            {{ product.keyword }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Variants Summary (if any) -->
                            <div
                                v-if="product.has_variants && product.variants?.length > 0"
                                class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
                            >
                                <h3 class="text-sm font-medium text-gray-500 mb-3">Хувилбарууд</h3>
                                <div class="flex flex-wrap gap-2">
                                    <span
                                        v-for="v in product.variants"
                                        :key="v.id"
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                    >
                                        <span class="font-medium text-gray-900 dark:text-white">{{
                                            v.name
                                        }}</span>
                                        <span class="text-gray-400">|</span>
                                        <span class="text-gray-600 dark:text-gray-400"
                                            >{{ v.stock_quantity }} ш</span
                                        >
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Statistics Overview -->
                    <div v-if="posts.length > 0" class="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div
                            class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col"
                        >
                            <span class="text-gray-500 text-sm mb-1">Нийт нийтлэл</span>
                            <span class="text-2xl font-bold text-gray-900 dark:text-white">{{
                                posts.length
                            }}</span>
                        </div>
                        <div
                            class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col"
                        >
                            <span class="text-gray-500 text-sm mb-1">Нийт хариу үйлдэл</span>
                            <span class="text-2xl font-bold text-gray-900 dark:text-white">{{
                                formatCount(totalPostReactions)
                            }}</span>
                        </div>
                        <div
                            class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col"
                        >
                            <span class="text-gray-500 text-sm mb-1">Нийт коммент</span>
                            <span class="text-2xl font-bold text-gray-900 dark:text-white">{{
                                formatCount(totalPostComments)
                            }}</span>
                        </div>
                        <div
                            class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col"
                        >
                            <span class="text-gray-500 text-sm mb-1">Нийт хуваалцсан</span>
                            <span class="text-2xl font-bold text-gray-900 dark:text-white">{{
                                formatCount(posts.reduce((acc, p) => acc + p.shares_count, 0))
                            }}</span>
                        </div>
                        <div
                            class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col"
                        >
                            <span class="text-gray-500 text-sm mb-1">Нийт харагдсан</span>
                            <span class="text-2xl font-bold text-gray-900 dark:text-white">{{
                                formatCount(totalPostViews)
                            }}</span>
                        </div>
                    </div>

                    <!-- Facebook Posts Section -->
                    <div v-if="posts.length > 0" class="pt-4">
                        <div class="flex items-center justify-between mb-5">
                            <h2
                                class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                            >
                                <UIcon name="i-lucide-share-2" class="w-5 h-5 text-blue-500" />
                                Холбогдсон Facebook нийтлэлүүд
                            </h2>
                        </div>

                        <!-- Social Posts Feed -->
                        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div
                                v-for="post in posts"
                                :key="post.id"
                                class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                <!-- Post Header - Page info -->
                                <div class="flex items-center gap-3 px-4 pt-4 pb-3">
                                    <div
                                        class="w-10 h-10 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0"
                                    >
                                        <img
                                            v-if="post.page_picture"
                                            :src="post.page_picture"
                                            :alt="post.page_name"
                                            class="w-full h-full object-cover"
                                        />
                                        <UIcon
                                            v-else
                                            name="i-lucide-facebook"
                                            class="w-5 h-5 text-blue-600"
                                        />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="text-sm font-semibold text-gray-900 dark:text-white truncate"
                                            >
                                                {{ post.page_name || 'Facebook Page' }}
                                            </span>
                                            <UBadge
                                                :color="
                                                    post.purpose === 'sale'
                                                        ? 'error'
                                                        : post.purpose === 'new_arrival'
                                                          ? 'success'
                                                          : 'neutral'
                                                "
                                                variant="subtle"
                                                size="xs"
                                            >
                                                {{ purposeLabel(post.purpose) }}
                                            </UBadge>
                                        </div>
                                        <div
                                            class="flex items-center gap-1.5 text-xs text-gray-500"
                                        >
                                            <span>{{ timeAgo(post.created_at) }}</span>
                                            <span>·</span>
                                            <UIcon name="i-lucide-globe" class="w-3 h-3" />
                                        </div>
                                    </div>
                                    <UButton
                                        icon="i-lucide-refresh-cw"
                                        variant="ghost"
                                        color="neutral"
                                        size="xs"
                                        :loading="refreshingStats === post.id"
                                        @click="refreshStats(post)"
                                    />
                                </div>

                                <!-- Caption -->
                                <div v-if="post.caption" class="px-4 pb-3">
                                    <p
                                        class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line"
                                        :class="{
                                            'line-clamp-3':
                                                !captionExpanded[post.id] &&
                                                isCaptionLong(post.caption)
                                        }"
                                    >
                                        {{ post.caption }}
                                    </p>
                                    <button
                                        v-if="isCaptionLong(post.caption)"
                                        class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium mt-1"
                                        @click="toggleCaption(post.id)"
                                    >
                                        {{
                                            captionExpanded[post.id] ? 'Хураангуй' : 'Цааш унших...'
                                        }}
                                    </button>
                                </div>

                                <!-- Post Image -->
                                <div
                                    v-if="post.image_url"
                                    class="relative bg-gray-100 dark:bg-gray-800"
                                >
                                    <img
                                        :src="post.image_url"
                                        :alt="product?.name"
                                        class="w-full object-cover max-h-[400px]"
                                    />
                                    <!-- Watch badge overlay -->
                                    <div
                                        v-if="post.watch_comments"
                                        class="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white rounded-full text-[10px] font-medium backdrop-blur-sm"
                                    >
                                        <UIcon name="i-lucide-eye" class="w-3 h-3" />
                                        Автомат
                                    </div>
                                </div>

                                <!-- Engagement Stats Bar -->
                                <div
                                    class="px-4 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800"
                                >
                                    <div class="flex items-center gap-1.5">
                                        <div class="flex -space-x-1">
                                            <div
                                                class="w-[18px] h-[18px] rounded-full bg-blue-500 flex items-center justify-center"
                                            >
                                                <UIcon
                                                    name="i-lucide-thumbs-up"
                                                    class="w-2.5 h-2.5 text-white"
                                                />
                                            </div>
                                            <div
                                                class="w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center"
                                            >
                                                <UIcon
                                                    name="i-lucide-heart"
                                                    class="w-2.5 h-2.5 text-white"
                                                />
                                            </div>
                                        </div>
                                        <span class="text-xs text-gray-500">
                                            {{ formatCount(post.reactions_count) }}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-3 text-xs text-gray-500">
                                        <span
                                            >{{ formatCount(post.comments_count) }} сэтгэгдэл</span
                                        >
                                        <span>{{ formatCount(post.shares_count) }} хуваалцсан</span>
                                    </div>
                                </div>

                                <!-- Action Buttons (like FB) -->
                                <div
                                    class="grid grid-cols-3 border-b border-gray-100 dark:border-gray-800"
                                >
                                    <button
                                        class="flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <UIcon name="i-lucide-thumbs-up" class="w-4 h-4" />
                                        <span class="text-xs font-medium">{{
                                            formatCount(post.reactions_count)
                                        }}</span>
                                    </button>
                                    <button
                                        class="flex items-center justify-center gap-2 py-2.5 text-sm transition-colors"
                                        :class="
                                            selectedPost?.id === post.id
                                                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30'
                                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        "
                                        @click="selectPost(post)"
                                    >
                                        <UIcon name="i-lucide-message-circle" class="w-4 h-4" />
                                        <span class="text-xs font-medium">{{
                                            formatCount(post.comments_count)
                                        }}</span>
                                    </button>
                                    <button
                                        class="flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <UIcon name="i-lucide-share" class="w-4 h-4" />
                                        <span class="text-xs font-medium">{{
                                            formatCount(post.shares_count)
                                        }}</span>
                                    </button>
                                </div>

                                <!-- Views stat (subtle) -->
                                <div
                                    v-if="post.views_count > 0"
                                    class="px-4 py-1.5 flex items-center gap-1 text-[11px] text-gray-400 border-b border-gray-100 dark:border-gray-800"
                                >
                                    <UIcon name="i-lucide-eye" class="w-3 h-3" />
                                    {{ formatCount(post.views_count) }} харагдсан
                                </div>

                                <!-- Inline Comments (shown when this post is selected) -->
                                <div v-if="selectedPost?.id === post.id">
                                    <!-- Loading -->
                                    <div
                                        v-if="commentsLoading"
                                        class="flex items-center justify-center py-6"
                                    >
                                        <UIcon
                                            name="i-lucide-loader-2"
                                            class="w-5 h-5 animate-spin text-primary"
                                        />
                                    </div>

                                    <!-- Empty -->
                                    <div v-else-if="comments.length === 0" class="py-6 text-center">
                                        <p class="text-xs text-gray-400">Сэтгэгдэл байхгүй</p>
                                    </div>

                                    <!-- Comments -->
                                    <div v-else class="px-4 py-3 space-y-3">
                                        <div
                                            v-for="comment in comments"
                                            :key="comment.id"
                                            class="flex items-start gap-2.5"
                                        >
                                            <div
                                                class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0"
                                            >
                                                <UIcon
                                                    name="i-lucide-user"
                                                    class="w-3.5 h-3.5 text-gray-400"
                                                />
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div
                                                    class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2 inline-block max-w-full"
                                                >
                                                    <div class="flex items-center gap-2">
                                                        <span
                                                            class="text-[13px] font-semibold text-gray-900 dark:text-white"
                                                        >
                                                            {{ comment.sender_name || 'Хэрэглэгч' }}
                                                        </span>
                                                        <UBadge
                                                            v-if="comment.is_processed"
                                                            color="success"
                                                            variant="subtle"
                                                            size="xs"
                                                        >
                                                            Захиалга
                                                        </UBadge>
                                                    </div>
                                                    <p
                                                        class="text-[13px] text-gray-700 dark:text-gray-300 wrap-break-word"
                                                    >
                                                        {{ comment.text }}
                                                    </p>
                                                </div>
                                                <div class="flex items-center gap-3 mt-1 ml-3">
                                                    <span class="text-[11px] text-gray-400">{{
                                                        timeAgo(comment.created_at)
                                                    }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Pagination -->
                                    <div
                                        v-if="commentsTotal > commentsSize"
                                        class="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between"
                                    >
                                        <button
                                            v-if="commentsPage < commentsTotalPages"
                                            class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            @click="nextCommentsPage"
                                        >
                                            Өмнөх сэтгэгдлүүд...
                                        </button>
                                        <span v-else />
                                        <span class="text-[11px] text-gray-400">
                                            {{ (commentsPage - 1) * commentsSize + 1 }}-{{
                                                Math.min(commentsPage * commentsSize, commentsTotal)
                                            }}
                                            / {{ commentsTotal }}
                                        </span>
                                        <div class="flex items-center gap-1">
                                            <UButton
                                                icon="i-lucide-chevron-left"
                                                variant="ghost"
                                                color="neutral"
                                                size="xs"
                                                :disabled="commentsPage <= 1"
                                                @click="prevCommentsPage"
                                            />
                                            <UButton
                                                icon="i-lucide-chevron-right"
                                                variant="ghost"
                                                color="neutral"
                                                size="xs"
                                                :disabled="commentsPage >= commentsTotalPages"
                                                @click="nextCommentsPage"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
