<script setup lang="ts">
defineProps<{
    collapsed?: boolean
}>()

const shop = useShop()
</script>

<template>
    <div class="flex items-center gap-3 py-1.5 w-full" :class="collapsed ? 'justify-center' : ''">
        <div
            class="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] dark:bg-green-900/20 dark:border-green-800/40 flex items-center justify-center shrink-0"
        >
            <img
                v-if="shop?.picture"
                :src="shop.picture"
                :alt="shop?.name"
                class="w-full h-full rounded-xl object-cover"
            >
            <UIcon v-else name="i-lucide-store" class="w-4.5 h-4.5 text-[#16a34a]" />
        </div>

        <div v-if="!collapsed" class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ shop?.name || 'Миний дэлгүүр' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">Үнэгүй багц</p>
        </div>
    </div>
</template>
