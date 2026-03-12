<script setup lang="ts">
interface Props {
    name: string
    subtitle?: string
}

defineProps<Props>()

const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Өглөөний мэнд'
    if (hour < 18) return 'Өдрийн мэнд'
    return 'Оройн мэнд'
})

const greetingIcon = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'i-lucide-sunrise'
    if (hour < 18) return 'i-lucide-sun'
    return 'i-lucide-moon'
})

const today = computed(() => {
    return new Date().toLocaleDateString('mn-MN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
})
</script>

<template>
    <div data-tour-greeting class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div
                class="w-12 h-12 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] dark:bg-green-900/20 dark:border-green-800/40 flex items-center justify-center flex-shrink-0"
            >
                <UIcon :name="greetingIcon" class="w-6 h-6 text-[#16a34a]" />
            </div>

            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ greeting }}, {{ name }}
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ subtitle || today }}
                </p>
            </div>
        </div>
    </div>
</template>
