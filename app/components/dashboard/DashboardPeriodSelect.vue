<script setup lang="ts">
export type Period = 'today' | '7d' | '30d' | 'all'

const props = defineProps<{
    modelValue: Period
}>()

const emit = defineEmits<{
    'update:modelValue': [value: Period]
}>()

const options: { label: string; value: Period }[] = [
    { label: 'Өнөөдөр', value: 'today' },
    { label: '7 хоног', value: '7d' },
    { label: '30 хоног', value: '30d' },
    { label: 'Нийт', value: 'all' },
]
</script>

<template>
    <div class="flex items-center gap-0.5 bg-[var(--surface-inset)] border border-[var(--border-primary)] rounded-lg p-1">
        <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            class="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 focus:outline-none"
            :class="
                modelValue === opt.value
                    ? 'bg-[var(--surface-card)] text-[var(--text-heading)] font-semibold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
            "
            @click="emit('update:modelValue', opt.value)"
        >
            {{ opt.label }}
        </button>
    </div>
</template>
