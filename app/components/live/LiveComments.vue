<script setup lang="ts">
import type { LiveComment } from '~/composables/useLiveWebSocket'

const props = defineProps<{
    comments: LiveComment[]
    isStreaming: boolean
}>()

const scrollContainer = ref<HTMLElement | null>(null)
const isAutoScroll = ref(true)

function scrollToBottom() {
    if (!scrollContainer.value || !isAutoScroll.value) return
    nextTick(() => {
        if (scrollContainer.value) {
            scrollContainer.value.scrollTop = 0
        }
    })
}

watch(() => props.comments.length, () => {
    scrollToBottom()
})

function getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?'
}

const avatarColors = [
    'bg-blue-500', 'bg-primary-500', 'bg-purple-500', 'bg-pink-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500'
]

function getAvatarColor(senderId: string): string {
    let hash = 0
    for (let i = 0; i < senderId.length; i++) {
        hash = senderId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash) % avatarColors.length] ?? 'bg-blue-500'
}
</script>

<template>
    <div
        ref="scrollContainer"
        class="flex-1 overflow-y-auto p-2 border border-(--border-primary) mx-2 rounded-lg"
    >
        <template v-if="comments.length === 0">
            <div class="flex flex-col items-center justify-center h-full gap-2">
                <UIcon name="i-lucide-message-circle" class="w-8 h-8 text-gray-300 dark:text-gray-600" />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ isStreaming ? 'Сэтгэгдэл хүлээж байна...' : 'Сэтгэгдэл байхгүй' }}
                </p>
            </div>
        </template>
        <template v-else>
            <div class="space-y-1.5">
                <div
                    v-for="comment in comments"
                    :key="comment.id"
                    class="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <div
                        class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        :class="getAvatarColor(comment.sender_id)"
                    >
                        {{ getInitial(comment.sender_name) }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {{ comment.sender_name }}
                        </span>
                        <p class="text-sm text-gray-600 dark:text-gray-400 wrap-break-word">
                            {{ comment.text }}
                        </p>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
