<script setup lang="ts">
const props = defineProps<{
    page: number
    total: number
    pageSize: number
}>()

const emit = defineEmits<{
    'update:page': [page: number]
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
const startItem = computed(() => (props.page - 1) * props.pageSize + 1)
const endItem = computed(() => Math.min(props.page * props.pageSize, props.total))

const visiblePages = computed(() => {
    const pages: number[] = []
    const tp = totalPages.value
    const cp = props.page

    if (tp <= 5) {
        for (let i = 1; i <= tp; i++) pages.push(i)
    } else {
        pages.push(1)
        if (cp > 3) pages.push(-1) // ellipsis
        const start = Math.max(2, cp - 1)
        const end = Math.min(tp - 1, cp + 1)
        for (let i = start; i <= end; i++) pages.push(i)
        if (cp < tp - 2) pages.push(-2) // ellipsis
        pages.push(tp)
    }
    return pages
})
</script>

<template>
    <div v-if="total > 0" class="px-4 sm:px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <span class="text-xs text-[var(--text-muted)]">
            {{ startItem }}–{{ endItem }} / {{ total }}
        </span>

        <div class="flex items-center gap-1">
            <!-- Prev -->
            <button
                class="size-8 flex items-center justify-center rounded-md text-[var(--text-muted)] transition-colors"
                :class="page <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--surface-inset)] hover:text-[var(--text-heading)]'"
                :disabled="page <= 1"
                @click="emit('update:page', page - 1)"
            >
                <UIcon name="i-lucide-chevron-left" class="size-4" />
            </button>

            <!-- Page numbers -->
            <template v-for="p in visiblePages" :key="p">
                <span v-if="p < 0" class="size-8 flex items-center justify-center text-xs text-[var(--text-placeholder)]">...</span>
                <button
                    v-else
                    class="size-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors"
                    :class="p === page
                        ? 'bg-primary-500 text-white'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-heading)]'"
                    @click="emit('update:page', p)"
                >
                    {{ p }}
                </button>
            </template>

            <!-- Next -->
            <button
                class="size-8 flex items-center justify-center rounded-md text-[var(--text-muted)] transition-colors"
                :class="page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--surface-inset)] hover:text-[var(--text-heading)]'"
                :disabled="page >= totalPages"
                @click="emit('update:page', page + 1)"
            >
                <UIcon name="i-lucide-chevron-right" class="size-4" />
            </button>
        </div>
    </div>
</template>
