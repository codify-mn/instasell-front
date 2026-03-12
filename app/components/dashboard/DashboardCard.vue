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
        class="bg-white dark:bg-[#1e293b] rounded-[10px] border border-[#e2e8f0] dark:border-[#334155]"
        style="box-shadow: var(--shadow-card)"
        :class="[
            paddingClasses[padding],
            hover && 'hover:shadow-md dark:hover:border-[#475569] transition-all duration-300',
            clickable && 'cursor-pointer'
        ]"
    >
        <slot />
    </div>
</template>
