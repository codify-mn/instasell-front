<script setup lang="ts">
interface Props {
    totalRevenue?: number
    data?: { label: string; value: number }[]
}

const props = withDefaults(defineProps<Props>(), {
    totalRevenue: 0,
    data: () => []
})

const dayNames = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя']

// Generate last 7 days labels in Mongolian
const last7Days = computed(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        // Use YYYY-MM-DD for stable comparison
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        days.push({
            label: dayNames[date.getDay()],
            date: dateStr,
            value: 0
        })
    }
    return days
})

// Use provided data or generate placeholder
const chartData = computed(() => {
    const defaultDays = last7Days.value.map((day) => ({ ...day }))

    if (props.data && props.data.length > 0) {
        // Map backend data to our last7Days buckets
        props.data.forEach((item) => {
            if (!item) return
            const index = defaultDays.findIndex((d) => d.date === item.label)
            if (index !== -1) {
                defaultDays[index]!.value = item.value || 0
            }
        })
        return defaultDays
    }

    // Placeholder data when no real data
    return defaultDays.map((day) => ({
        ...day,
        value: Math.floor(Math.random() * 50000) + 10000
    }))
})

const maxValue = computed(() => Math.max(...chartData.value.map((d) => d.value), 1))

const formatCompact = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}сая`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}мян`
    return value.toString()
}
</script>

<template>
    <DashboardCard padding="lg">
        <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <p
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                        Энэ долоо хоногийн орлого
                    </p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {{ new Intl.NumberFormat('mn-MN').format(totalRevenue) }}₮
                    </p>
                </div>
                <div
                    class="w-10 h-10 rounded-xl bg-[#f0fdf4] dark:bg-green-900/20 flex items-center justify-center"
                >
                    <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-[#16a34a]" />
                </div>
            </div>

            <!-- Simple Bar Chart -->
            <div class="flex items-end gap-2 h-24">
                <div
                    v-for="(item, index) in chartData"
                    :key="index"
                    class="flex-1 flex flex-col items-center gap-1"
                >
                    <!-- Bar -->
                    <div class="w-full relative group">
                        <!-- Tooltip -->
                        <div
                            class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <div
                                class="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg"
                            >
                                {{ formatCompact(item.value) }}₮
                            </div>
                        </div>
                        <!-- Bar itself -->
                        <div
                            class="w-full rounded-t-lg bg-gradient-to-t from-[#16a34a] to-[#22c55e] dark:from-[#15803d] dark:to-[#16a34a] transition-all duration-300 hover:from-[#15803d] hover:to-[#16a34a]"
                            :style="{ height: `${Math.max((item.value / maxValue) * 64, 4)}px` }"
                        />
                    </div>
                    <!-- Label -->
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {{ item.label }}
                    </span>
                </div>
            </div>
        </div>
    </DashboardCard>
</template>
