<script setup lang="ts">
defineProps<{
    class?: string
    size?: 'sm' | 'md' | 'lg'
    hideText?: boolean
    variant?: 'default' | 'light'
}>()
</script>

<template>
    <NuxtLink to="/" class="flex items-center gap-2.5 group" :class="$props.class">
        <span
            v-if="!hideText"
            class="font-bold tracking-tight"
            :class="[
                variant === 'light' ? 'text-white' : 'text-gray-900 dark:text-white',
                {
                    'text-sm': size === 'sm',
                    'text-lg': size === 'md' || !size,
                    'text-xl': size === 'lg'
                }
            ]"
        >
            Codify<span
                class="font-light mx-0.5"
                :class="variant === 'light' ? 'text-white/60' : 'text-primary-400'"
                >/</span
            >Insta<span
                :class="variant === 'light' ? 'text-white' : 'text-gradient'"
                class="font-extrabold"
                >Sell</span
            >
        </span>
    </NuxtLink>
</template>
