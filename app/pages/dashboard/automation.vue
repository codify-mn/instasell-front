<script setup lang="ts">
import { useShopSettings } from '~/composables/useShopSettings'

useSeoMeta({ title: 'Автоматжуулалт - Instasell' })

const { shop, isLoading, isSaving, fetchShop, updateShop } = useShopSettings()
const toast = useToast()

const state = reactive({
    automation_enabled: true,
    trigger_keywords: [] as string[],
    like_comments: false,
    auto_comment_enabled: false,
    auto_comment_text: '',
    private_reply_enabled: false,
    private_reply_message: ''
})

const hasChanges = ref(false)
watch(state, () => { hasChanges.value = true }, { deep: true })

onBeforeRouteLeave(() => {
    if (hasChanges.value) {
        return window.confirm('Хадгалаагүй өөрчлөлт байна. Гарах уу?')
    }
})

onMounted(async () => {
    await fetchShop()
    if (shop.value?.settings) {
        const s = shop.value.settings
        state.automation_enabled = s.automation_enabled ?? true
        state.trigger_keywords = s.trigger_keywords || []
        state.like_comments = s.like_comments || false
        state.auto_comment_enabled = s.auto_comment_enabled || false
        state.auto_comment_text = s.auto_comment_text || ''
        state.private_reply_enabled = s.private_reply_enabled || false
        state.private_reply_message = s.private_reply_message || ''
    }
    await nextTick()
    hasChanges.value = false
})

async function save() {
    await updateShop({
        settings: {
            ...shop.value?.settings,
            automation_enabled: state.automation_enabled,
            trigger_keywords: state.trigger_keywords,
            like_comments: state.like_comments,
            auto_comment_enabled: state.auto_comment_enabled,
            auto_comment_text: state.auto_comment_text,
            private_reply_enabled: state.private_reply_enabled,
            private_reply_message: state.private_reply_message
        }
    })
    hasChanges.value = false
}

// Keywords
const keywordInput = ref('')
function addKeyword() {
    const kw = keywordInput.value.trim()
    if (kw && !state.trigger_keywords.includes(kw)) {
        state.trigger_keywords.push(kw)
    }
    keywordInput.value = ''
}
function removeKeyword(kw: string) {
    const idx = state.trigger_keywords.indexOf(kw)
    if (idx !== -1) state.trigger_keywords.splice(idx, 1)
}
function onKeywordKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword() }
}

// Template variable insertion
function insertVariable(field: 'auto_comment_text' | 'private_reply_message', variable: string) {
    const selector = field === 'auto_comment_text' ? '#auto-comment-textarea' : '#private-reply-textarea'
    const el = document.querySelector(selector) as HTMLTextAreaElement | null
    if (!el) {
        state[field] = (state[field] || '') + variable
        return
    }
    const start = el.selectionStart ?? state[field].length
    const end = el.selectionEnd ?? state[field].length
    const current = state[field] || ''
    state[field] = current.slice(0, start) + variable + current.slice(end)
    nextTick(() => {
        el.focus()
        const pos = start + variable.length
        el.setSelectionRange(pos, pos)
    })
}

const activeSteps = computed(() => {
    let count = 0
    if (state.like_comments) count++
    if (state.auto_comment_enabled) count++
    if (state.private_reply_enabled) count++
    return count
})

const previewKeyword = computed(() =>
    state.trigger_keywords.length > 0 ? state.trigger_keywords[0] : 'авах'
)

function renderPreview(template: string): string {
    return template
        .replace(/\{order_number\}/g, '1234')
        .replace(/\{checkout_link\}/g, 'instasell.mn/pay/abc')
        .replace(/\{customer_name\}/g, 'Бат')
}

const showPreview = ref(false)
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="automation">
            <UDashboardNavbar>
                <template #title>
                    <div class="flex items-center gap-2.5">
                        <UIcon name="i-lucide-zap" class="w-5 h-5" />
                        <span>Автоматжуулалт</span>
                        <span
                            class="text-xs font-medium px-2.5 py-0.5 rounded-full border"
                            :class="state.automation_enabled
                                ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800/50'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'"
                        >
                            {{ state.automation_enabled ? 'Идэвхтэй' : 'Унтраасан' }}
                        </span>
                    </div>
                </template>
                <template #right>
                    <div class="flex items-center gap-3">
                        <USwitch v-model="state.automation_enabled" />
                        <UButton
                            color="primary"
                            icon="i-lucide-check"
                            :loading="isSaving"
                            @click="save"
                        >
                            Хадгалах
                        </UButton>
                    </div>
                </template>
            </UDashboardNavbar>

            <!-- Loading state -->
            <div v-if="isLoading" class="flex justify-center py-20">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
            </div>

            <div v-else>
                <!-- Split layout -->
                <div class="p-4 lg:p-8 transition-opacity duration-200" :inert="!state.automation_enabled" :class="{ 'opacity-40': !state.automation_enabled }">
                    <div class="flex gap-8">
                        <!-- Left column: Config cards -->
                        <div class="flex-1 max-w-2xl space-y-0">

                            <!-- Card 1: Trigger -->
                            <div class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5">
                                <div class="flex items-start gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shrink-0">
                                        <UIcon name="i-lucide-message-square" class="w-[18px] h-[18px] text-primary-500 dark:text-primary-400" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3 class="text-sm font-semibold text-[var(--text-heading)]">Триггер</h3>
                                        <p class="text-xs text-gray-500 mt-0.5">Эдгээр үгсийг агуулсан коммент илрүүлнэ</p>

                                        <div class="flex flex-wrap gap-2 mt-4 min-h-[28px]">
                                            <button
                                                v-for="kw in state.trigger_keywords"
                                                :key="kw"
                                                type="button"
                                                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-800/50 dark:hover:text-red-400 focus:bg-red-50 focus:border-red-200 focus:text-red-600 dark:focus:bg-red-950/20 dark:focus:border-red-800/50 dark:focus:text-red-400 transition-colors group"
                                                @click="removeKeyword(kw)"
                                            >
                                                {{ kw }}
                                                <UIcon name="i-lucide-x" class="w-3 h-3 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" />
                                            </button>
                                            <span v-if="state.trigger_keywords.length === 0" class="text-xs text-gray-400 italic">
                                                Түлхүүр үг байхгүй байна...
                                            </span>
                                        </div>

                                        <div class="flex gap-2 mt-3 max-w-sm">
                                            <UInput
                                                v-model="keywordInput"
                                                placeholder="авах, buy, захиалах..."
                                                size="sm"
                                                @keydown="onKeywordKeydown"
                                            />
                                            <UButton color="primary" variant="soft" size="sm" @click="addKeyword">Нэмэх</UButton>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Connector -->
                            <div class="flex justify-start pl-7">
                                <div class="w-px h-6 bg-gray-200 dark:bg-gray-800" />
                            </div>

                            <!-- Card 2: Create Order (locked) -->
                            <div class="bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-200 dark:border-primary-800/50 p-5">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0">
                                        <UIcon name="i-lucide-shopping-bag" class="w-[18px] h-[18px] text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-sm font-semibold text-primary-700 dark:text-primary-400">Захиалга үүсгэх</h3>
                                        <p class="text-xs text-primary-600 dark:text-primary-600 mt-0.5">Коммент илэрсэн үед автоматаар захиалга үүснэ</p>
                                    </div>
                                    <span class="text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-500 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800/50 shrink-0">
                                        Үргэлж идэвхтэй
                                    </span>
                                </div>
                            </div>

                            <!-- Connector -->
                            <div class="flex justify-start pl-7">
                                <div class="w-px h-6 bg-gray-200 dark:bg-gray-800" />
                            </div>

                            <!-- Card 3: Like Comment -->
                            <div
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5 transition-opacity"
                                :class="{ 'opacity-50': !state.like_comments }"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                        :class="state.like_comments ? 'bg-primary-50 dark:bg-primary-950/30' : 'bg-gray-100 dark:bg-gray-800'"
                                    >
                                        <UIcon name="i-lucide-thumbs-up" class="w-[18px] h-[18px]"
                                            :class="state.like_comments ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400'"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-sm font-semibold text-[var(--text-heading)]">Комментод Like дарах</h3>
                                        <p class="text-xs text-gray-500 mt-0.5">Захиалга илрүүлсэн комментод автоматаар Like дарна</p>
                                    </div>
                                    <USwitch v-model="state.like_comments" />
                                </div>
                            </div>

                            <!-- Connector -->
                            <div class="flex justify-start pl-7">
                                <div class="w-px h-6 bg-gray-200 dark:bg-gray-800" />
                            </div>

                            <!-- Card 4: Public Reply -->
                            <div
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5 transition-opacity"
                                :class="{ 'opacity-50': !state.auto_comment_enabled }"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                        :class="state.auto_comment_enabled ? 'bg-primary-50 dark:bg-primary-950/30' : 'bg-gray-100 dark:bg-gray-800'"
                                    >
                                        <UIcon name="i-lucide-message-circle" class="w-[18px] h-[18px]"
                                            :class="state.auto_comment_enabled ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400'"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-sm font-semibold text-[var(--text-heading)]">Нийтэд хариулт бичих</h3>
                                        <p class="text-xs text-gray-500 mt-0.5">Комментод нийтэд харагдах хариулт илгээнэ</p>
                                    </div>
                                    <USwitch v-model="state.auto_comment_enabled" />
                                </div>
                                <div v-if="state.auto_comment_enabled" class="mt-4 pt-4 border-t border-[var(--border-primary)] pl-12">
                                    <UTextarea
                                        id="auto-comment-textarea"
                                        v-model="state.auto_comment_text"
                                        :rows="2"
                                        autoresize
                                        size="sm"
                                        class="w-full"
                                        placeholder="Баярлалаа! Мессежээр мэдэгдэлэе."
                                    />
                                </div>
                            </div>

                            <!-- Connector -->
                            <div class="flex justify-start pl-7">
                                <div class="w-px h-6 bg-gray-200 dark:bg-gray-800" />
                            </div>

                            <!-- Card 5: Private Message -->
                            <div
                                class="bg-[var(--surface-card)] rounded-xl border border-[var(--border-primary)] p-5 transition-opacity"
                                :class="{ 'opacity-50': !state.private_reply_enabled }"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                        :class="state.private_reply_enabled ? 'bg-primary-50 dark:bg-primary-950/30' : 'bg-gray-100 dark:bg-gray-800'"
                                    >
                                        <UIcon name="i-lucide-send" class="w-[18px] h-[18px]"
                                            :class="state.private_reply_enabled ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400'"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-sm font-semibold text-[var(--text-heading)]">Хувийн мессеж илгээх</h3>
                                        <p class="text-xs text-gray-500 mt-0.5">Хэрэглэгчид checkout линктэй мессеж илгээнэ</p>
                                    </div>
                                    <USwitch v-model="state.private_reply_enabled" />
                                </div>
                                <div v-if="state.private_reply_enabled" class="mt-4 pt-4 border-t border-[var(--border-primary)] pl-12 space-y-2">
                                    <UTextarea
                                        id="private-reply-textarea"
                                        v-model="state.private_reply_message"
                                        :rows="3"
                                        autoresize
                                        size="sm"
                                        class="w-full"
                                        placeholder="Захиалга #{order_number} бүртгэгдлээ! Төлбөр: {checkout_link}"
                                    />
                                    <div class="flex flex-wrap gap-1.5">
                                        <button
                                            v-for="v in ['{order_number}', '{checkout_link}', '{customer_name}']"
                                            :key="v"
                                            type="button"
                                            class="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-mono border border-gray-200 dark:border-gray-700"
                                            @click="insertVariable('private_reply_message', v)"
                                        >{{ v }}</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Bottom save -->
                            <div class="flex justify-end pt-8">
                                <UButton color="primary" icon="i-lucide-check" size="lg" :loading="isSaving" @click="save">
                                    Хадгалах
                                </UButton>
                            </div>
                        </div>

                        <!-- Right column: Phone preview -->
                        <div class="hidden lg:block w-80 shrink-0">
                            <div class="sticky top-4 space-y-4">

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
                                                        :class="state.like_comments ? 'text-blue-500' : 'text-gray-400'"
                                                    >
                                                        {{ state.like_comments ? '👍 Таалагдсан' : 'Like' }}
                                                    </span>
                                                    <span class="text-[10px] text-gray-400 font-semibold">Хариулах</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Bot's public reply (as a reply to the comment) -->
                                        <div v-if="state.auto_comment_enabled" class="flex gap-2 pl-9">
                                            <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                                                <UIcon name="i-lucide-store" class="w-3 h-3 text-white" />
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-1.5">
                                                    <p class="text-[10px] font-semibold text-[var(--text-heading)]">Таны дэлгүүр</p>
                                                    <p class="text-[11px] text-gray-700 dark:text-gray-300">{{ state.auto_comment_text || 'Баярлалаа! Мессежээр мэдэгдэлэе.' }}</p>
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
                                <div v-if="state.private_reply_enabled" class="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                                    <div class="px-3 py-2 border-b border-[var(--border-primary)] flex items-center gap-2">
                                        <UIcon name="i-lucide-message-circle" class="w-3.5 h-3.5 text-blue-500" />
                                        <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Messenger хувийн мессеж</span>
                                    </div>
                                    <div class="p-3 space-y-2">
                                        <!-- Bot message -->
                                        <div class="flex gap-2">
                                            <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                                                <UIcon name="i-lucide-store" class="w-3 h-3 text-white" />
                                            </div>
                                            <div class="space-y-1.5 flex-1 min-w-0">
                                                <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2">
                                                    <p class="text-[11px] text-gray-800 dark:text-gray-200 leading-relaxed">
                                                        {{ renderPreview(state.private_reply_message || 'Захиалга #{order_number} бүртгэгдлээ! Төлбөр: {checkout_link}') }}
                                                    </p>
                                                </div>
                                                <!-- Checkout button template -->
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
                        </div>

                    </div>
                </div>

                <!-- Mobile: Preview button + Slideover -->
                <UButton
                    v-if="state.automation_enabled"
                    class="lg:hidden fixed bottom-6 right-6 z-50 shadow-lg"
                    color="primary"
                    icon="i-lucide-eye"
                    size="lg"
                    @click="showPreview = true"
                >
                    Урьдчилан харах
                </UButton>

                <USlideover v-model:open="showPreview">
                    <template #header>
                        <span class="text-sm font-semibold">Урьдчилан харах</span>
                    </template>
                    <template #body>
                        <div class="p-4 space-y-4">
                            <!-- Facebook Comment Preview -->
                            <div class="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                                <div class="px-3 py-2 border-b border-[var(--border-primary)] flex items-center gap-2">
                                    <UIcon name="i-lucide-facebook" class="w-3.5 h-3.5 text-blue-500" />
                                    <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Facebook коммент</span>
                                </div>
                                <div class="p-3 space-y-3">
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
                                                    :class="state.like_comments ? 'text-blue-500' : 'text-gray-400'"
                                                >
                                                    {{ state.like_comments ? '👍 Таалагдсан' : 'Like' }}
                                                </span>
                                                <span class="text-[10px] text-gray-400 font-semibold">Хариулах</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="state.auto_comment_enabled" class="flex gap-2 pl-9">
                                        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                                            <UIcon name="i-lucide-store" class="w-3 h-3 text-white" />
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-1.5">
                                                <p class="text-[10px] font-semibold text-[var(--text-heading)]">Таны дэлгүүр</p>
                                                <p class="text-[11px] text-gray-700 dark:text-gray-300">{{ state.auto_comment_text || 'Баярлалаа! Мессежээр мэдэгдэлэе.' }}</p>
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
                            <div v-if="state.private_reply_enabled" class="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
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
                                                    {{ renderPreview(state.private_reply_message || 'Захиалга #{order_number} бүртгэгдлээ! Төлбөр: {checkout_link}') }}
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
                        </div>
                    </template>
                </USlideover>
            </div>
        </UDashboardPanel>
    </div>
</template>
