<script setup lang="ts">
interface Props {
    title?: string
    description?: string
    required?: boolean
}

defineProps<Props>()
</script>

<template>
    <div
        class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5"
    >
        <div v-if="title || $slots.title" class="mb-4">
            <h3 class="text-sm font-medium text-[var(--text-heading)] flex items-center gap-1.5">
                <slot name="title">{{ title }}</slot>
                <span v-if="required" class="text-red-500">*</span>
            </h3>
            <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ description }}
            </p>
        </div>
        <slot />
    </div>
</template>
