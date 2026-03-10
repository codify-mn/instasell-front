<script setup lang="ts">
defineProps<{
    class?: string
    size?: 'sm' | 'md' | 'lg'
    hideText?: boolean
    variant?: 'default' | 'light'
}>()

const colorMode = useColorMode()
</script>

<template>
    <NuxtLink to="/" class="flex items-center group" :class="$props.class">
        <img
            :src="variant === 'light' || colorMode.value === 'dark' ? '/instasell_ondark.svg' : '/instasell.svg'"
            alt="InstaSell"
            :class="{
                'w-32 p-4': size === 'sm',
                'w-40 p-5': size === 'md' || !size,
                'w-48 p-6': size === 'lg'
            }"
        >
    </NuxtLink>
</template>
