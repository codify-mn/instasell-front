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

const borderClasses = {
    primary: 'border-l-[3px] border-l-primary-500',
    success: 'border-l-[3px] border-l-green-500',
    warning: 'border-l-[3px] border-l-amber-500',
    error: 'border-l-[3px] border-l-red-500',
    info: 'border-l-[3px] border-l-blue-500',
    gray: 'border-l-[3px] border-l-[#e2e8f0] dark:border-l-[#334155]'
}

const iconClasses = {
    primary: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
    success: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    gray: 'text-gray-500 bg-gray-100 dark:bg-gray-700/50'
}

const tag = computed(() => (props.to ? resolveComponent('NuxtLink') : 'div'))
</script>

<template>
    <component
        :is="tag"
        v-bind="to ? { to } : {}"
        class="group relative p-5 rounded-[10px] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] transition-all duration-300 hover:shadow-md"
        style="box-shadow: var(--shadow-card)"
        :class="[borderClasses[color], to && 'cursor-pointer hover:scale-[1.01]']"
    >
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <p class="text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider">
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
                                ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
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

                <p v-if="subtitle" class="text-sm font-medium text-[#64748b] dark:text-gray-400">
                    {{ subtitle }}
                </p>
            </div>
        </div>
    </component>
</template>
