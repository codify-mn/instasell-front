<script setup lang="ts">
import NumberFlow, { continuous } from '@number-flow/vue'

interface Props {
    label: string
    value: number
    prefix?: string
    suffix?: string
    subtitle?: string
    icon?: string
    iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'info'
    trend?: number
}

withDefaults(defineProps<Props>(), {
    iconColor: 'primary'
})

const iconColorClasses = {
    primary:
        'text-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/20',
    success:
        'text-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/20',
    warning:
        'text-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20',
    error: 'text-red-500 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20',
    info: 'text-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20'
}

function useCycle<T>(options: T[]) {
    const index = ref(0)

    const next = () => {
        index.value = (index.value + 1) % options.length
    }

    const value = computed(() => options[index.value])

    return { value, next }
}

function useRootClick(cb: () => void) {
    onMounted(() => {
        document.documentElement.addEventListener('click', cb)
    })
    onUnmounted(() => {
        document.documentElement.removeEventListener('click', cb)
    })
}

const { value, next } = useCycle([0, 10, 909])
useRootClick(next)
</script>

<template>
    <DashboardCard padding="md" hover>
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <p
                    class="text-xs truncate font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                    {{ label }}
                </p>
                <div
                    v-if="icon"
                    class="w-10 h-10 rounded-xl flex items-center justify-center"
                    :class="iconColorClasses[iconColor]"
                >
                    <UIcon :name="icon" class="w-5 h-5 m-2" />
                </div>
            </div>

            <div class="flex items-end gap-2">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                    <NumberFlow
                        v-if="typeof value === 'number'"
                        :plugins="[continuous]"
                        :format="{ notation: 'compact' }"
                        :prefix="prefix"
                        :suffix="suffix"
                        :value="value"
                    />

                    <span v-else>{{ value }}</span>
                </span>
                <span
                    v-if="trend !== undefined && trend !== 0"
                    class="text-xs font-medium mb-1 flex items-center gap-0.5"
                    :class="trend > 0 ? 'text-primary-500' : 'text-red-500'"
                >
                    <UIcon
                        :name="trend > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                        class="w-3.5 h-3.5"
                    />
                    {{ Math.abs(trend) }}%
                </span>
            </div>

            <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400">
                {{ subtitle }}
            </p>
        </div>
    </DashboardCard>
</template>
