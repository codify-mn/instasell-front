<script setup lang="ts">
import type { LiveStatsData } from '~/composables/useLiveWebSocket'

const props = defineProps<{
    isStreaming: boolean
    stats: LiveStatsData
}>()

const duration = ref('00:00:00')
let timerInterval: NodeJS.Timeout | null = null
let startTime: number | null = null

const updateTimer = () => {
    if (!startTime) return
    const now = Date.now()
    const diff = Math.floor((now - startTime) / 1000)

    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60

    duration.value = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':')
}

watch(
    () => props.isStreaming,
    (streaming) => {
        if (streaming) {
            startTime = Date.now()
            timerInterval = setInterval(updateTimer, 1000)
        } else {
            if (timerInterval) {
                clearInterval(timerInterval)
                timerInterval = null
            }
        }
    },
    { immediate: true }
)

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 flex-1">
        <LiveStatCard
            label="Захиалга"
            :value="stats.orders"
            icon="i-lucide-shopping-cart"
            icon-color="warning"
        />
        <LiveStatCard
            label="Нийт"
            prefix="₮"
            :value="stats.revenue"
            icon="i-lucide-piggy-bank"
            icon-color="primary"
        />
        <LiveStatCard label="Үзэгч" :value="stats.viewers" icon="i-lucide-users" icon-color="info" />
        <LiveStatCard
            label="Сэтгэгдэл"
            :value="stats.comments"
            icon="i-lucide-message-circle"
            icon-color="primary"
        />
    </div>
</template>
