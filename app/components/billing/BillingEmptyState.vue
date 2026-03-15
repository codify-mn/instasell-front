<script setup lang="ts">
defineProps<{
    title?: string
    description?: string
    icon?: string
    actionLabel?: string
    actionTo?: string
}>()

const emit = defineEmits<{
    action: []
}>()
</script>

<template>
    <div class="flex flex-col items-center justify-center py-16 text-center">
        <UIcon :name="icon || 'i-lucide-receipt'" class="size-10 text-[var(--text-placeholder)] mb-3" />
        <h3 class="text-sm font-semibold text-[var(--text-heading)] mb-1">
            {{ title || 'Түүх байхгүй' }}
        </h3>
        <p class="text-sm text-[var(--text-muted)] max-w-sm mb-5">
            {{ description || 'Одоогоор ямар нэгэн төлбөр хийгээгүй байна.' }}
        </p>
        <UButton v-if="actionLabel" color="primary" size="sm" :to="actionTo" @click="emit('action')">
            {{ actionLabel }}
        </UButton>
    </div>
</template>
