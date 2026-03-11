<script setup lang="ts">
interface Props {
    label: string
    value: string | number
    subtitle?: string
    icon?: string
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray'
    to?: string
    trend?: number
}

const props = withDefaults(defineProps<Props>(), {
    color: 'gray'
})

const colorClasses = {
    primary:
        'bg-primary-50/60 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20 group-hover:shadow-primary-200/50 dark:group-hover:shadow-primary-900/30',
    success:
        'bg-primary-50/60 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20 group-hover:shadow-green-200/50 dark:group-hover:shadow-primary-900/30',
    warning:
        'bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 group-hover:shadow-amber-200/50 dark:group-hover:shadow-amber-900/30',
    error: 'bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 group-hover:shadow-red-200/50 dark:group-hover:shadow-red-900/30',
    info: 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 group-hover:shadow-blue-200/50 dark:group-hover:shadow-blue-900/30',
    gray: 'bg-white/60 dark:bg-gray-900/60 hover:bg-white/80 dark:hover:bg-gray-900/80 group-hover:shadow-gray-200/50 dark:group-hover:shadow-gray-900/30'
}

const iconClasses = {
    primary: 'text-primary-500 bg-primary-100/80 dark:bg-primary-800/30',
    success: 'text-primary-500 bg-primary-100/80 dark:bg-primary-800/30',
    warning: 'text-amber-500 bg-amber-100/80 dark:bg-amber-800/30',
    error: 'text-red-500 bg-red-100/80 dark:bg-red-800/30',
    info: 'text-blue-500 bg-blue-100/80 dark:bg-blue-800/30',
    gray: 'text-gray-500 bg-gray-100/80 dark:bg-gray-700/50'
}
</script>

<template>
    <NuxtLink
        v-if="to"
        :to="to"
        class="group relative p-5 rounded-2xl backdrop-blur-sm border border-transparent transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
        :class="[
            colorClasses[color],
            color === 'gray'
                ? 'border-white/20 dark:border-gray-700/30 hover:border-white/30 dark:hover:border-gray-700/40'
                : ''
        ]"
    >
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <p
                    class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                    {{ label }}
                </p>
                <div
                    v-if="icon"
                    class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    :class="iconClasses[color]"
                >
                    <UIcon :name="icon" class="w-5 h-5" />
                </div>
            </div>

            <div class="space-y-1">
                <div class="flex items-end gap-2">
                    <span class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {{ typeof value === 'number' ? value.toLocaleString() : value }}
                    </span>
                    <span
                        v-if="trend !== undefined && trend !== 0"
                        class="text-xs font-bold mb-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                        :class="
                            trend > 0
                                ? 'text-primary-600 bg-primary-100 dark:bg-primary-900/30'
                                : 'text-red-600 bg-red-100 dark:bg-red-900/30'
                        "
                    >
                        <UIcon
                            :name="trend > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                            class="w-3 h-3"
                        />
                        {{ Math.abs(trend) }}%
                    </span>
                </div>

                <p v-if="subtitle" class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {{ subtitle }}
                </p>
            </div>
        </div>
    </NuxtLink>

    <div
        v-else
        class="group relative p-5 rounded-2xl backdrop-blur-sm border border-transparent transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        :class="[
            colorClasses[color],
            color === 'gray'
                ? 'border-white/20 dark:border-gray-700/30 hover:border-white/30 dark:hover:border-gray-700/40'
                : ''
        ]"
    >
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <p
                    class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                    {{ label }}
                </p>
                <div
                    v-if="icon"
                    class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    :class="iconClasses[color]"
                >
                    <UIcon :name="icon" class="w-5 h-5" />
                </div>
            </div>

            <div class="space-y-1">
                <div class="flex items-end gap-2">
                    <span class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {{ typeof value === 'number' ? value.toLocaleString() : value }}
                    </span>
                    <span
                        v-if="trend !== undefined && trend !== 0"
                        class="text-xs font-bold mb-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                        :class="
                            trend > 0
                                ? 'text-primary-600 bg-primary-100 dark:bg-primary-900/30'
                                : 'text-red-600 bg-red-100 dark:bg-red-900/30'
                        "
                    >
                        <UIcon
                            :name="trend > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                            class="w-3 h-3"
                        />
                        {{ Math.abs(trend) }}%
                    </span>
                </div>

                <p v-if="subtitle" class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {{ subtitle }}
                </p>
            </div>
        </div>
    </div>
</template>
