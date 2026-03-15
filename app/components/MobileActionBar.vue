<script setup lang="ts">
defineProps<{
    count: number
    label?: string
}>()

defineEmits<{
    clear: []
}>()
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="translate-y-full opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="translate-y-full opacity-0"
        >
            <div
                v-if="count > 0"
                class="fixed bottom-0 inset-x-0 z-50 sm:hidden pb-[env(safe-area-inset-bottom)]"
            >
                <div
                    class="mx-3 mb-3 rounded-2xl border border-(--border-primary) px-4 py-3 backdrop-blur-xl bg-(--surface-card) shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
                >
                    <div class="flex items-center justify-between mb-2.5">
                        <span class="text-sm font-semibold text-(--text-heading)">
                            {{ count }} {{ label || 'сонгогдсон' }}
                        </span>
                        <button
                            type="button"
                            class="text-xs text-(--text-muted) hover:text-(--text-heading) transition-colors"
                            @click="$emit('clear')"
                        >
                            Цуцлах
                        </button>
                    </div>
                    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <slot />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
