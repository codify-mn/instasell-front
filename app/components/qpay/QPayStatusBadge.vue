<script setup lang="ts">
defineProps<{
    isRegistered: boolean
    merchantType?: string
}>()
</script>

<template>
    <div class="flex items-center gap-2">
        <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
            :class="
                isRegistered
                    ? 'bg-[var(--accent-green-light)] text-[var(--accent-green)]'
                    : 'bg-[var(--accent-warn-light)] text-[var(--accent-warn-dark)]'
            "
        >
            <span
                class="w-1.5 h-1.5 rounded-full"
                :class="isRegistered ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-warn)]'"
            />
            {{ isRegistered ? 'Бүртгэлтэй' : 'Бүртгэлгүй' }}
        </span>
        <span
            v-if="isRegistered && merchantType"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-[var(--surface-inset)] text-[var(--text-muted)]"
        >
            {{ merchantType === 'company' ? 'Компани' : 'Хувь хүн' }}
        </span>
    </div>
</template>
