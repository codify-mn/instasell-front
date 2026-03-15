<script setup lang="ts">
interface Props {
    title: string
    description?: string
    icon?: string
    to?: string
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'gray'
}

withDefaults(defineProps<Props>(), {
    color: 'blue'
})

const colorClasses = {
    blue: 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    green: 'bg-primary-50/60 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20',
    purple: 'bg-purple-50/60 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    orange: 'bg-orange-50/60 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20',
    pink: 'bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    gray: 'bg-gray-50/60 dark:bg-gray-800/30 hover:bg-gray-100/60 dark:hover:bg-gray-800/50'
}

const iconClasses = {
    blue: 'text-blue-500 bg-blue-100/80 dark:bg-blue-800/30',
    green: 'text-primary-500 bg-primary-100/80 dark:bg-primary-800/30',
    purple: 'text-purple-500 bg-purple-100/80 dark:bg-purple-800/30',
    orange: 'text-orange-500 bg-orange-100/80 dark:bg-orange-800/30',
    pink: 'text-indigo-500 bg-indigo-100/80 dark:bg-indigo-800/30',
    gray: 'text-gray-500 bg-gray-200/80 dark:bg-gray-700/50'
}

const glowClasses = {
    blue: 'group-hover:shadow-blue-200/50 dark:group-hover:shadow-blue-900/30',
    green: 'group-hover:shadow-primary-200/50 dark:group-hover:shadow-primary-900/30',
    purple: 'group-hover:shadow-purple-200/50 dark:group-hover:shadow-purple-900/30',
    orange: 'group-hover:shadow-orange-200/50 dark:group-hover:shadow-orange-900/30',
    pink: 'group-hover:shadow-indigo-200/50 dark:group-hover:shadow-indigo-900/30',
    gray: 'group-hover:shadow-gray-200/50 dark:group-hover:shadow-gray-900/30'
}
</script>

<template>
    <NuxtLink
        v-if="to"
        :to="to"
        class="group block p-4 rounded-2xl backdrop-blur-sm border border-transparent hover:border-white/20 dark:hover:border-gray-700/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        :class="[colorClasses[color], glowClasses[color]]"
    >
        <div
            v-if="icon"
            class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
            :class="iconClasses[color]"
        >
            <UIcon :name="icon" class="w-5 h-5" />
        </div>

        <h4 class="font-semibold text-[var(--text-heading)] text-sm">
            {{ title }}
        </h4>
        <p v-if="description" class="text-xs text-[var(--text-muted)] mt-0.5">
            {{ description }}
        </p>
    </NuxtLink>

    <div
        v-else
        class="group p-4 rounded-2xl backdrop-blur-sm border border-transparent hover:border-white/20 dark:hover:border-gray-700/30 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        :class="[colorClasses[color], glowClasses[color]]"
    >
        <div
            v-if="icon"
            class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
            :class="iconClasses[color]"
        >
            <UIcon :name="icon" class="w-5 h-5" />
        </div>

        <h4 class="font-semibold text-[var(--text-heading)] text-sm">
            {{ title }}
        </h4>
        <p v-if="description" class="text-xs text-[var(--text-muted)] mt-0.5">
            {{ description }}
        </p>
    </div>
</template>
