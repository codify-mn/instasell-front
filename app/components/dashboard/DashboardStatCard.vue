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
    if (props.accent) return 'bg-[#059669]'
    if (props.warn) return 'bg-[#e47a00]'
    return 'bg-[#e3e8ee]'
})

const valueClass = computed(() => {
    if (props.accent) return 'text-[#059669]'
    if (props.warn) return 'text-[#b45309]'
    return 'text-[#1a1f36]'
})

const deltaClass = computed(() => {
    if (isUp.value) return 'text-[#059669]'
    if (isDown.value) return 'text-[#dc2626]'
    return 'text-[#697386]'
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
        class="relative block overflow-hidden rounded-xl border border-[#e3e8ee] bg-white p-5 transition-all duration-150"
        :class="to ? 'cursor-pointer hover:border-[#c8d0da] hover:shadow-sm' : ''"
    >
        <!-- Colored top bar -->
        <div class="absolute inset-x-0 top-0 h-[3px] rounded-t-xl" :class="topBarClass" />

        <div class="mb-3 flex items-start justify-between">
            <span class="text-[11px] font-bold uppercase tracking-[0.6px] text-[#697386]">
                {{ label }}
            </span>
            <span v-if="icon" class="text-base leading-none">{{ icon }}</span>
        </div>

        <div class="text-[26px] font-extrabold leading-none tracking-tight" :class="valueClass">
            {{ value }}
        </div>

        <div class="mt-2 flex items-center gap-1.5">
            <span v-if="delta !== undefined" class="text-[11px] font-bold" :class="deltaClass">
                {{ deltaSymbol }} {{ Math.abs(delta) }}%
            </span>
            <span v-if="subtitle || deltaLabel" class="text-[11px] text-[#9baacf]">
                {{ deltaLabel || subtitle }}
            </span>
        </div>
    </component>
</template>
