<script setup lang="ts">
import NumberFlow from '@number-flow/vue'

interface Props {
    label: string
    value: string | number
    subtitle?: string
    delta?: number
    deltaLabel?: string
    icon?: string
    accent?: boolean
    warn?: boolean
    topBar?: 'primary' | 'accent' | 'warn' | 'neutral'
    to?: string
}

const props = withDefaults(defineProps<Props>(), {
    accent: false,
    warn: false,
})

const isUp = computed(() => props.delta !== undefined && props.delta > 0)
const isDown = computed(() => props.delta !== undefined && props.delta < 0)

const topBarClass = computed(() => {
    if (props.topBar === 'primary') return 'bg-primary-500'
    if (props.topBar === 'accent' || props.accent) return 'bg-[var(--accent-green)]'
    if (props.topBar === 'warn' || props.warn) return 'bg-[var(--accent-warn)]'
    return 'bg-[var(--bar-neutral)]'
})

const valueClass = computed(() => {
    if (props.warn) return 'text-[var(--accent-warn-dark)]'
    return 'text-[var(--text-heading)]'
})

const iconClass = computed(() => {
    if (props.accent) return 'text-[var(--accent-green)]'
    if (props.warn) return 'text-[var(--accent-warn-dark)]'
    return 'text-[var(--text-muted)]'
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
        class="relative block overflow-hidden rounded-xl border border-(--border-primary) bg-(--surface-card) p-5 shadow-sm transition-all duration-150"
        :class="to ? 'cursor-pointer hover:border-(--border-strong) hover:shadow-md' : ''"
    >
        <!-- Colored top bar -->
        <div class="absolute inset-x-0 top-0 h-0.75 rounded-t-xl" :class="topBarClass" />

        <div class="mb-3 flex items-start justify-between">
            <span class="text-xs font-bold uppercase tracking-[0.6px] text-(--text-muted)">
                {{ label }}
            </span>
            <UIcon v-if="icon" :name="icon" class="size-4" :class="iconClass" />
        </div>

        <div class="text-2xl font-extrabold leading-none tracking-tight" :class="valueClass">
            <NumberFlow
                v-if="typeof value === 'number'"
                :value="value"
                :format="{ useGrouping: true }"
            />
            <template v-else>{{ value }}</template>
        </div>

        <div class="mt-2 flex items-center gap-1.5">
            <span v-if="delta !== undefined" class="text-xs font-bold" :class="deltaClass">
                {{ deltaSymbol }} {{ Math.abs(delta) }}%
            </span>
            <span v-if="subtitle || deltaLabel" class="text-xs text-(--text-placeholder)">
                {{ deltaLabel || subtitle }}
            </span>
        </div>
    </component>
</template>
