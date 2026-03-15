<script setup lang="ts">
defineProps<{
    previewKeyword: string
    likeComments: boolean
    autoCommentEnabled: boolean
    autoCommentText: string
    privateReplyEnabled: boolean
    privateReplyMessage: string
}>()

function renderPreview(template: string): string {
    return template
        .replace(/\{order_number\}/g, '1234')
        .replace(/\{checkout_link\}/g, 'instasell.mn/pay/abc')
        .replace(/\{customer_name\}/g, 'Бат')
}
</script>

<template>
    <div class="space-y-4">
        <!-- Facebook Comment Preview -->
        <div class="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
            <div class="px-3 py-2 border-b border-[var(--border-primary)] flex items-center gap-2">
                <UIcon name="i-lucide-facebook" class="w-3.5 h-3.5 text-blue-500" />
                <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Facebook коммент</span>
            </div>
            <div class="p-3 space-y-3">
                <!-- User's comment -->
                <div class="flex gap-2">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                        <span class="text-white text-[10px] font-bold">Б</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-1.5">
                            <p class="text-[11px] font-semibold text-[var(--text-heading)]">Бат-Эрдэнэ</p>
                            <p class="text-xs text-gray-700 dark:text-gray-300">{{ previewKeyword }}</p>
                        </div>
                        <div class="flex items-center gap-3 mt-1 pl-2">
                            <span class="text-[10px] text-gray-400">2 мин</span>
                            <span
                                class="text-[10px] font-semibold transition-colors"
                                :class="likeComments ? 'text-blue-500' : 'text-gray-400'"
                            >
                                {{ likeComments ? '👍 Таалагдсан' : 'Like' }}
                            </span>
                            <span class="text-[10px] text-gray-400 font-semibold">Хариулах</span>
                        </div>
                    </div>
                </div>

                <!-- Bot's public reply -->
                <div v-if="autoCommentEnabled" class="flex gap-2 pl-9">
                    <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                        <UIcon name="i-lucide-store" class="w-3 h-3 text-white" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-1.5">
                            <p class="text-[10px] font-semibold text-[var(--text-heading)]">Таны дэлгүүр</p>
                            <p class="text-[11px] text-gray-700 dark:text-gray-300">{{ autoCommentText || 'Баярлалаа! Мессежээр мэдэгдэлэе.' }}</p>
                        </div>
                        <div class="flex items-center gap-3 mt-1 pl-2">
                            <span class="text-[10px] text-gray-400">Дөнгөж сая</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- System action badge -->
        <div class="flex items-center justify-center gap-2 py-1">
            <div class="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span class="text-[10px] font-medium bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 px-2.5 py-0.5 rounded-full border border-primary-200 dark:border-primary-800/50 whitespace-nowrap">
                ✓ Захиалга #1234 үүслээ
            </span>
            <div class="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        </div>

        <!-- Messenger Preview -->
        <div v-if="privateReplyEnabled" class="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
            <div class="px-3 py-2 border-b border-[var(--border-primary)] flex items-center gap-2">
                <UIcon name="i-lucide-message-circle" class="w-3.5 h-3.5 text-blue-500" />
                <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Messenger хувийн мессеж</span>
            </div>
            <div class="p-3 space-y-2">
                <div class="flex gap-2">
                    <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                        <UIcon name="i-lucide-store" class="w-3 h-3 text-white" />
                    </div>
                    <div class="space-y-1.5 flex-1 min-w-0">
                        <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2">
                            <p class="text-[11px] text-gray-800 dark:text-gray-200 leading-relaxed">
                                {{ renderPreview(privateReplyMessage || 'Захиалга #{order_number} бүртгэгдлээ! Төлбөр: {checkout_link}') }}
                            </p>
                        </div>
                        <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            <div class="bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                <p class="text-[10px] text-gray-400">instasell.mn</p>
                                <p class="text-[11px] font-medium text-gray-700 dark:text-gray-300">Төлбөр төлөх</p>
                            </div>
                            <div class="border-t border-gray-200 dark:border-gray-700 px-3 py-1.5 text-center">
                                <span class="text-[11px] font-semibold text-blue-500">Төлбөр төлөх →</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer hint -->
        <p class="text-[10px] text-gray-400 dark:text-gray-600 text-center">
            Тохиргоо өөрчлөхөд энд шууд харагдана
        </p>
    </div>
</template>
