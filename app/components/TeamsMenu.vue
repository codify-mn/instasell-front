<script setup lang="ts">
defineProps<{
    collapsed?: boolean
}>()

const shop = useShop()
</script>

<template>
    <div class="flex items-center gap-3 py-1.5 w-full" :class="collapsed ? 'justify-center' : ''">
        <div
            class="w-9 h-9 rounded-xl bg-[var(--surface-inset)] border border-[var(--border-primary)] flex items-center justify-center shrink-0"
        >
            <img
                v-if="shop?.picture"
                :src="shop.picture"
                :alt="shop?.name"
                class="w-full h-full rounded-xl object-cover"
            >
            <UIcon v-else name="i-lucide-store" class="w-4.5 h-4.5 text-[var(--text-muted)]" />
        </div>

        <div v-if="!collapsed" class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-[var(--text-heading)] truncate">
                {{ shop?.name || 'Миний дэлгүүр' }}
            </p>
            <p class="text-xs text-[var(--text-muted)] truncate">Үнэгүй багц</p>
        </div>
    </div>
</template>
