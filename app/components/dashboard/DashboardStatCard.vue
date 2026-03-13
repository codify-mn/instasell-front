<script setup lang="ts">
interface Props {
    label: string
    value: string | number
    subtitle?: string
    delta?: number
    deltaLabel?: string
    icon?: string
    accent?: boolean
    warn?: boolean
    to?: string
}

const props = withDefaults(defineProps<Props>(), {
    accent: false,
    warn: false,
})

const isUp = computed(() => props.delta !== undefined && props.delta > 0)
const isDown = computed(() => props.delta !== undefined && props.delta < 0)

const topBarClass = computed(() => {
    if (props.accent) return 'bg-[var(--accent-green)]'
    if (props.warn) return 'bg-[var(--accent-warn)]'
    return 'bg-[var(--bar-neutral)]'
})

const valueClass = computed(() => {
    if (props.accent) return 'text-[var(--accent-green)]'
    if (props.warn) return 'text-[var(--accent-warn-dark)]'
    return 'text-[var(--text-heading)]'
})

const deltaClass = computed(() => {
    if (isUp.value) return 'text-[var(--accent-green)]'
    if (isDown.value) return 'text-[var(--accent-error)]'
    return 'text-[var(--text-muted)]'
})

const deltaSymbol = computed(() => {
    if (isUp.value) return '▲'
    if (isDown.value) return '▼'
    return '→'
})
</script>

<template>
    <component
        :is="to ? resolveComponent('NuxtLink') : 'div'"
        :to="to"
        class="relative block overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5 shadow-sm transition-all duration-150"
        :class="to ? 'cursor-pointer hover:border-[var(--border-strong)] hover:shadow-md' : ''"
    >
        <!-- Colored top bar -->
        <div class="absolute inset-x-0 top-0 h-[3px] rounded-t-xl" :class="topBarClass" />

        <div class="mb-3 flex items-start justify-between">
            <span class="text-xs font-bold uppercase tracking-[0.6px] text-[var(--text-muted)]">
                {{ label }}
            </span>
            <span v-if="icon" class="text-base leading-none">{{ icon }}</span>
        </div>

        <div class="text-2xl font-extrabold leading-none tracking-tight" :class="valueClass">
            {{ value }}
        </div>

        <div class="mt-2 flex items-center gap-1.5">
            <span v-if="delta !== undefined" class="text-xs font-bold" :class="deltaClass">
                {{ deltaSymbol }} {{ Math.abs(delta) }}%
            </span>
            <span v-if="subtitle || deltaLabel" class="text-xs text-[var(--text-placeholder)]">
                {{ deltaLabel || subtitle }}
            </span>
        </div>
    </component>
</template>
