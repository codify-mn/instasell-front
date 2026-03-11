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
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            "
        >
            <span
                class="w-1.5 h-1.5 rounded-full"
                :class="isRegistered ? 'bg-primary-500' : 'bg-amber-500'"
            />
            {{ isRegistered ? 'Бүртгэлтэй' : 'Бүртгэлгүй' }}
        </span>
        <span
            v-if="isRegistered && merchantType"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        >
            {{ merchantType === 'company' ? 'Компани' : 'Хувь хүн' }}
        </span>
    </div>
</template>
