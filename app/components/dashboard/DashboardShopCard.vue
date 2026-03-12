<script setup lang="ts">
interface Props {
    shopName: string
    shopUrl?: string
    logoUrl?: string
    requiredActions?: {
        title: string
        description: string
        icon: string
        to: string
    }[]
}

defineProps<Props>()
</script>

<template>
    <div
        class="h-full rounded-[10px] bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] p-6 space-y-7"
        style="box-shadow: var(--shadow-card)"
    >
        <div class="flex items-center gap-4">
            <!-- Logo -->
            <div
                class="w-14 h-14 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] dark:bg-green-900/20 dark:border-green-800/40 flex items-center justify-center shrink-0"
            >
                <img
                    v-if="logoUrl"
                    :src="logoUrl"
                    :alt="shopName"
                    class="w-10 h-10 object-contain rounded-lg"
                >
                <UIcon v-else name="i-lucide-store" class="w-7 h-7 text-[#16a34a]" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-900 dark:text-white text-lg truncate">
                    {{ shopName }}
                </h3>

                <a
                    v-if="shopUrl"
                    :href="shopUrl"
                    target="_blank"
                    class="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#16a34a] mt-1 transition-colors"
                >
                    <span class="truncate">{{ shopUrl.replace(/^https?:\/\//, '') }}</span>
                    <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5 shrink-0" />
                </a>
            </div>

            <UButton
                to="/dashboard/settings"
                variant="ghost"
                icon="i-lucide-settings"
                size="sm"
                color="neutral"
                class="shrink-0"
            />
        </div>
        <div v-if="requiredActions" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="col-span-full text-sm font-semibold text-gray-900 dark:text-white">Шаардлагатай үйлдлүүд</div>
            <DashboardActionCard
                v-for="action in requiredActions"
                :key="action.title"
                :title="action.title"
                :description="action.description"
                :icon="action.icon"
                :to="action.to"
            />
        </div>
    </div>
</template>
