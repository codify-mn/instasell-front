<script setup lang="ts">
import type { LiveSale } from '~/types'
import type { Product } from '~/composables/useProducts'
import type { OverlayLayout } from '~/composables/useCanvasStream'

const toast = useToast()
const config = useRuntimeConfig()
const route = useRoute()

const webrtc = useWebRTC()

const { data: live } = useLazyFetch<LiveSale>(
    `${config.public.apiUrl}/api/live-sales/${route.params.liveID}`,
    { credentials: 'include' }
)

provide('live', live)

const { data: liveProducts, refresh: refreshLiveProducts } = await useLazyFetch<Product[]>(
    `${config.public.apiUrl}/api/live-sales/${route.params.liveID}/products`,
    { credentials: 'include' }
)

const addedProducts = useState('addedProducts', () => liveProducts)

// WebSocket for real-time comments and stats
const liveSaleId = computed(() => live.value?.id)
const { comments, stats, activeProductId, connected } = useLiveWebSocket(liveSaleId)

// Initialize activeProductId from live data
watch(live, (l) => {
    if (l?.active_product_id && !activeProductId.value) {
        activeProductId.value = l.active_product_id
    }
}, { immediate: true })

provide('activeProductId', activeProductId)

const handleProductSelect = (product: Product) => {
    const imageUrl = product.images?.[0] || null
    webrtc.canvasStream.updateProduct({
        name: product.name,
        price: product.price,
        salePrice: product.sale_price,
        imageUrl
    })
}

provide('onProductSelect', handleProductSelect)

onBeforeUnmount(() => {
    webrtc.stopStream()
})

const overlayLayoutOptions = [
    { label: 'Banner', value: 'banner' as OverlayLayout },
    { label: 'Card', value: 'card' as OverlayLayout }
]

const selectedOverlayLayout = computed({
    get: () => webrtc.canvasStream.overlayLayout.value,
    set: (val: OverlayLayout) => {
        webrtc.canvasStream.overlayLayout.value = val
    }
})

const statusLabel = computed(() => {
    const labels: Record<string, string> = {
        idle: 'Offline',
        starting: 'Starting...',
        accessing_camera: 'Accessing Camera...',
        connecting: 'Connecting...',
        stopping: 'Stopping...',
        live: 'LIVE',
        error: 'Error'
    }
    return labels[webrtc.streamStatus.value] || webrtc.streamStatus.value
})

// Mobile tab state
const mobileTab = ref('camera')
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="live-detail">
            <UDashboardNavbar :title="live?.title || 'Live'">
                <template #right>
                    <div class="flex items-center gap-2">
                        <UBadge
                            :color="webrtc.streamStatus.value === 'live' ? 'error' : 'neutral'"
                            :variant="webrtc.streamStatus.value === 'live' ? 'solid' : 'subtle'"
                            size="sm"
                        >
                            <span
                                v-if="webrtc.streamStatus.value === 'live'"
                                class="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"
                            />
                            {{ statusLabel }}
                        </UBadge>
                        <template v-if="!webrtc.isStreaming.value">
                            <UButton
                                color="primary"
                                icon="i-heroicons-play-solid"
                                size="sm"
                                @click="webrtc.startLive(live!)"
                            >
                                <span class="hidden sm:inline">Start Stream</span>
                            </UButton>
                        </template>
                        <template v-else>
                            <UButton
                                color="error"
                                icon="i-heroicons-stop-solid"
                                size="sm"
                                @click="webrtc.stopStream"
                            >
                                <span class="hidden sm:inline">Stop</span>
                            </UButton>
                        </template>
                    </div>
                </template>
            </UDashboardNavbar>

            <!-- Hidden canvas for stream compositing -->
            <canvas :ref="webrtc.canvasStream.canvasRef" class="hidden" />

            <!-- Mobile Tab Switcher -->
            <div class="md:hidden flex border-b border-(--border-primary)">
                <button
                    class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
                    :class="
                        mobileTab === 'camera'
                            ? 'text-primary-500 border-b-2 border-primary-500'
                            : 'text-gray-500 dark:text-gray-400'
                    "
                    @click="mobileTab = 'camera'"
                >
                    <UIcon name="i-lucide-video" class="mr-1.5 align-middle" />
                    Камер
                </button>
                <button
                    class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
                    :class="
                        mobileTab === 'products'
                            ? 'text-primary-500 border-b-2 border-primary-500'
                            : 'text-gray-500 dark:text-gray-400'
                    "
                    @click="mobileTab = 'products'"
                >
                    <UIcon name="i-lucide-package" class="mr-1.5 align-middle" />
                    Бараа
                </button>
                <button
                    class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
                    :class="
                        mobileTab === 'comments'
                            ? 'text-primary-500 border-b-2 border-primary-500'
                            : 'text-gray-500 dark:text-gray-400'
                    "
                    @click="mobileTab = 'comments'"
                >
                    <UIcon name="i-lucide-message-circle" class="mr-1.5 align-middle" />
                    Сэтгэгдэл
                </button>
            </div>

            <!-- Unified layout: single DOM, responsive + tab-controlled visibility -->
            <div
                class="flex flex-col md:flex-row h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)] md:gap-4 md:p-4"
            >
                <!-- Product List: always visible on desktop, tab-controlled on mobile -->
                <div
                    class="h-full md:w-1/3 md:max-w-sm md:shrink-0 md:flex! md:flex-col"
                    :class="mobileTab === 'products' ? 'flex flex-col flex-1' : 'hidden'"
                >
                    <ProductList />
                </div>

                <!-- Main Video Area: always visible on desktop, tab-controlled on mobile -->
                <div
                    class="flex flex-1 flex-col min-w-0 md:bg-gray-100 md:dark:bg-gray-800 md:rounded-lg md:p-3 gap-3 md:gap-4 md:flex!"
                    :class="mobileTab === 'camera' ? '' : 'hidden'"
                >
                    <!-- Facebook Live Info Header (desktop only) -->
                    <div
                        class="hidden md:flex items-center justify-between bg-(--surface-card) px-4 py-3 rounded-lg shadow-sm"
                    >
                        <div class="flex items-center gap-3 min-w-0">
                            <div
                                class="shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                            >
                                <UIcon
                                    name="i-simple-icons-facebook"
                                    class="text-blue-600 dark:text-blue-400 text-lg"
                                />
                            </div>
                            <div class="min-w-0">
                                <h2 class="font-semibold text-base truncate">
                                    {{ live?.title || 'Untitled Live' }}
                                </h2>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <UButton
                                v-if="live"
                                :to="live?.view_url"
                                target="_blank"
                                color="primary"
                                variant="soft"
                                icon="i-heroicons-arrow-top-right-on-square"
                                size="sm"
                            >
                                Open on Facebook
                            </UButton>
                        </div>
                    </div>

                    <!-- Video + Comments row -->
                    <div
                        class="flex-1 flex flex-col md:grid md:grid-cols-2 gap-2 min-h-0 overflow-hidden p-3 md:p-0"
                    >
                        <!-- Video Player -->
                        <div
                            class="bg-black relative rounded-lg overflow-hidden min-h-0 aspect-9/16 max-h-[55vh] md:aspect-auto md:max-h-none md:flex-1"
                        >
                            <video
                                :ref="webrtc.videoRef"
                                autoplay
                                muted
                                playsinline
                                class="w-full h-full object-contain"
                            />
                            <div
                                v-if="webrtc.streamStatus.value === 'live'"
                                class="absolute top-3 left-3 md:top-4 md:left-4 bg-red-600 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md text-white text-xs font-bold tracking-wide z-10 flex items-center gap-1.5"
                            >
                                <span
                                    class="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                                />
                                LIVE
                            </div>
                            <div
                                v-else-if="webrtc.streamStatus.value !== 'idle'"
                                class="absolute top-3 left-3 md:top-4 md:left-4 bg-black/60 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md text-white text-xs font-medium z-10"
                            >
                                {{ statusLabel }}
                            </div>
                        </div>

                        <!-- Comments: inline on desktop only (mobile has its own tab) -->
                        <div class="hidden md:flex flex-1">
                            <LiveComments :comments="comments" :is-streaming="webrtc.isStreaming.value" />
                        </div>
                    </div>

                    <!-- Destinations + Stats + Controls -->
                    <div class="px-3 md:px-0 space-y-2">
                        <div class="bg-(--surface-card) px-3 md:px-4 py-3 rounded-lg shadow-sm">
                            <DestinationList />
                        </div>
                        <LiveStats :is-streaming="webrtc.isStreaming.value" :stats="stats" />
                        <div
                            class="flex items-center justify-between bg-(--surface-card) px-3 md:px-4 py-2 md:py-3 rounded-lg shadow-sm"
                        >
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-500">Overlay:</span>
                                <USelect
                                    v-model="selectedOverlayLayout"
                                    :items="overlayLayoutOptions"
                                    value-key="value"
                                    size="xs"
                                    class="w-28"
                                />
                            </div>
                            <UButton
                                v-if="live?.view_url"
                                :to="live.view_url"
                                target="_blank"
                                color="primary"
                                variant="soft"
                                icon="i-heroicons-arrow-top-right-on-square"
                                size="xs"
                                class="md:hidden"
                            >
                                Facebook
                            </UButton>
                        </div>
                    </div>
                </div>

                <!-- Comments: mobile tab only (desktop uses the inline one above) -->
                <div
                    class="flex-1 min-h-0 md:hidden!"
                    :class="mobileTab === 'comments' ? '' : 'hidden'"
                >
                    <LiveComments :comments="comments" :is-streaming="webrtc.isStreaming.value" />
                </div>
            </div>
        </UDashboardPanel>
    </div>
</template>
