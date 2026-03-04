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
        class="relative overflow-hidden h-full rounded-2xl bg-linear-to-br from-primary-500 via-primary-600 to-accent-600 p-6 space-y-7"
    >
        <!-- Background decoration -->
        <div
            class="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-sm"
        />
        <div
            class="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-sm"
        />
        <div class="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full" />

        <div class="relative flex items-center gap-4">
            <!-- Logo -->
            <div
                class="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg shadow-black/10"
            >
                <img
                    v-if="logoUrl"
                    :src="logoUrl"
                    :alt="shopName"
                    class="w-10 h-10 object-contain rounded-lg"
                >
                <UIcon v-else name="i-lucide-store" class="w-7 h-7 text-primary-600" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-white text-lg truncate">
                    {{ shopName }}
                </h3>

                <a
                    v-if="shopUrl"
                    :href="shopUrl"
                    target="_blank"
                    class="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mt-1 transition-colors"
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
                class="text-white/70 hover:text-white hover:bg-white/10 shrink-0"
            />
        </div>
        <div v-if="requiredActions" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="col-span-full text-white">Шаардлагатай үйлдлүүд</div>
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
