<script setup lang="ts">
interface Props {
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hover?: boolean
    clickable?: boolean
}

withDefaults(defineProps<Props>(), {
    padding: 'md',
    hover: false,
    clickable: false
})

const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
}
</script>

<template>
    <div
        class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)]"
        style="box-shadow: var(--shadow-card)"
        :class="[
            paddingClasses[padding],
            hover && 'hover:shadow-md hover:border-[var(--border-strong)] transition-all duration-300',
            clickable && 'cursor-pointer'
        ]"
    >
        <slot />
    </div>
</template>
