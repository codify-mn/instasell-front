<script setup lang="ts">
import type { LiveSaleDestination } from '~/types'

const config = useRuntimeConfig()
const toast = useToast()
const route = useRoute()
const destinations = ref<LiveSaleDestination[]>([])
const loading = ref(false)
const addingFacebook = ref(false)
const customRtmpOpen = ref(false)
const customForm = reactive({
    name: '',
    server_url: '',
    stream_key: ''
})

const liveSaleID = computed(() => route.params.liveID)

const fetchDestinations = async () => {
    loading.value = true
    try {
        destinations.value = await $fetch<LiveSaleDestination[]>(
            `${config.public.apiUrl}/api/live-sales/${liveSaleID.value}/destinations`,
            { credentials: 'include' }
        )
    } catch {
        destinations.value = []
    } finally {
        loading.value = false
    }
}

const addFacebookDestination = async () => {
    addingFacebook.value = true
    try {
        const dest = await $fetch<LiveSaleDestination>(
            `${config.public.apiUrl}/api/live-sales/${liveSaleID.value}/destinations`,
            {
                method: 'POST',
                body: { platform: 'facebook' },
                credentials: 'include'
            }
        )
        destinations.value.push(dest)
        toast.add({
            title: 'Facebook Live нэмэгдлээ',
            description: 'RTMP URL амжилттай үүслээ',
            color: 'primary'
        })
    } catch {
        toast.add({
            title: 'Алдаа',
            description: 'Facebook destination нэмэхэд алдаа гарлаа',
            color: 'error'
        })
    } finally {
        addingFacebook.value = false
    }
}

const addCustomDestination = async () => {
    if (!customForm.server_url) {
        toast.add({ title: 'Алдаа', description: 'Server URL оруулна уу', color: 'error' })
        return
    }
    try {
        const dest = await $fetch<LiveSaleDestination>(
            `${config.public.apiUrl}/api/live-sales/${liveSaleID.value}/destinations`,
            {
                method: 'POST',
                body: {
                    platform: 'custom',
                    name: customForm.name || 'Custom RTMP',
                    server_url: customForm.server_url,
                    stream_key: customForm.stream_key
                },
                credentials: 'include'
            }
        )
        destinations.value.push(dest)
        customRtmpOpen.value = false
        customForm.name = ''
        customForm.server_url = ''
        customForm.stream_key = ''
        toast.add({ title: 'RTMP destination нэмэгдлээ', color: 'primary' })
    } catch {
        toast.add({ title: 'Алдаа', description: 'Destination нэмэхэд алдаа гарлаа', color: 'error' })
    }
}

const removeDestination = async (dest: LiveSaleDestination) => {
    try {
        await $fetch(
            `${config.public.apiUrl}/api/live-sales/${liveSaleID.value}/destinations/${dest.id}`,
            { method: 'DELETE', credentials: 'include' }
        )
        destinations.value = destinations.value.filter(d => d.id !== dest.id)
    } catch {
        toast.add({ title: 'Алдаа', description: 'Устгахад алдаа гарлаа', color: 'error' })
    }
}

const statusColor = (status: string) => {
    switch (status) {
        case 'live': return 'success'
        case 'ended': return 'neutral'
        case 'error': return 'error'
        default: return 'warning'
    }
}

const platformIcon = (platform: string) => {
    switch (platform) {
        case 'facebook': return 'i-simple-icons-facebook'
        case 'instagram': return 'i-simple-icons-instagram'
        default: return 'i-lucide-radio'
    }
}

onMounted(() => {
    fetchDestinations()
})
</script>

<template>
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Destinations
            </h4>
            <div class="flex gap-1.5">
                <UButton
                    size="xs"
                    color="primary"
                    variant="soft"
                    icon="i-simple-icons-facebook"
                    :loading="addingFacebook"
                    @click="addFacebookDestination"
                >
                    Facebook
                </UButton>
                <UButton
                    size="xs"
                    variant="soft"
                    icon="i-lucide-plus"
                    @click="customRtmpOpen = true"
                >
                    Custom
                </UButton>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center py-4">
            <UIcon name="i-lucide-loader" class="animate-spin text-gray-400" />
        </div>

        <div v-else-if="destinations.length === 0" class="text-xs text-gray-400 text-center py-3">
            Destination нэмэгдээгүй байна
        </div>

        <div v-else class="space-y-2">
            <div
                v-for="dest in destinations"
                :key="dest.id"
                class="flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
                <UIcon :name="platformIcon(dest.platform)" class="text-lg shrink-0" />
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ dest.name }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ dest.rtmp_url }}</p>
                </div>
                <UBadge :color="statusColor(dest.status)" size="xs">
                    {{ dest.status }}
                </UBadge>
                <UButton
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    size="xs"
                    @click="removeDestination(dest)"
                />
            </div>
        </div>

        <!-- Custom RTMP Modal -->
        <UModal v-model:open="customRtmpOpen">
            <template #header>
                <h3 class="text-base font-semibold">Custom RTMP Destination</h3>
            </template>
            <template #body>
                <div class="space-y-3">
                    <UFormField label="Нэр">
                        <UInput v-model="customForm.name" placeholder="My RTMP Server" />
                    </UFormField>
                    <UFormField label="Server URL" required>
                        <UInput v-model="customForm.server_url" placeholder="rtmp://..." />
                    </UFormField>
                    <UFormField label="Stream Key">
                        <UInput v-model="customForm.stream_key" placeholder="Stream key" />
                    </UFormField>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="ghost" @click="customRtmpOpen = false">Болих</UButton>
                    <UButton color="primary" @click="addCustomDestination">Нэмэх</UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>
