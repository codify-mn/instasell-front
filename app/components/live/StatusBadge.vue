<script setup lang="ts">
const props = defineProps<{ status: string }>()

const statusColor = (status: string) => {
    const map: Record<string, string> = {
        live_now: 'error',
        ended: 'secondary',
        vod: 'secondary',
        scheduled: 'info'
    }
    return map[status] || 'neutral'
}

const statusLabel = (status: string) => {
    const map: Record<string, string> = {
        live_now: 'Live',
        ended: 'Өндөрлөсөн',
        vod: 'Өндөрлөсөн',
        scheduled: 'Товлогдсон'
    }
    return map[status] || status
}
</script>

<template>
    <UBadge
        :color="statusColor(props.status) as any"
        :variant="props.status === 'live_now' ? 'solid' : 'subtle'"
        size="md"
        class="italic"
    >
        <UIcon
            v-if="props.status === 'ended' || props.status === 'vod'"
            name="i-lucide-circle-check-big"
        />
        <span
            v-if="props.status === 'live_now'"
            class="inline-block w-1.5 h-1.5 rounded-full bg-primary-600 mr-1 animate-pulse"
        />
        {{ statusLabel(props.status) }}
    </UBadge>
</template>
