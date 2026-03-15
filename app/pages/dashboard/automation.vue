<script setup lang="ts">
import { useShopSettings } from '~/composables/useShopSettings'

useSeoMeta({ title: 'Автоматжуулалт - Instasell' })

const { shop, isLoading, isSaving, fetchShop, updateShop } = useShopSettings()
const { subscription, fetchSubscription } = useSubscription()
const toast = useToast()

const hasAutomationFeature = computed(() =>
    subscription.value?.plan?.features?.automation ?? false
)

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
let stopWatcher: (() => void) | undefined

onBeforeRouteLeave(() => {
    if (hasChanges.value) {
        return window.confirm('Хадгалаагүй өөрчлөлт байна. Гарах уу?')
    }
})

onMounted(async () => {
    await Promise.all([fetchShop(), fetchSubscription()])
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
    stopWatcher = watch(state, () => { hasChanges.value = true }, { deep: true })
})

onUnmounted(() => {
    stopWatcher?.()
})

// Validation
const validationWarnings = computed(() => {
    const warnings: string[] = []
    if (state.automation_enabled && state.trigger_keywords.length === 0) {
        warnings.push('Түлхүүр үг нэмээгүй байна — автоматжуулалт ажиллахгүй')
    }
    if (state.auto_comment_enabled && !state.auto_comment_text.trim()) {
        warnings.push('Нийтэд хариулт идэвхтэй боловч текст хоосон байна')
    }
    if (state.private_reply_enabled && !state.private_reply_message.trim()) {
        warnings.push('Хувийн мессеж идэвхтэй боловч текст хоосон байна')
    }
    return warnings
})

async function save() {
    if (validationWarnings.value.length > 0) {
        const proceed = window.confirm(
            validationWarnings.value.join('\n') + '\n\nҮргэлжлүүлэх үү?'
        )
        if (!proceed) return
    }

    try {
        await updateShop({
            settings: {
                ...shop.value!.settings,
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
    } catch {
        // toast already shown by composable
    }
}

// Keywords
const keywordInput = ref('')
const removedKeyword = ref<{ keyword: string; index: number } | null>(null)
const undoTimeout = ref<ReturnType<typeof setTimeout>>()

function addKeyword() {
    const kw = keywordInput.value.trim()
    if (kw && !state.trigger_keywords.includes(kw)) {
        state.trigger_keywords.push(kw)
    }
    keywordInput.value = ''
}
function removeKeyword(kw: string) {
    const idx = state.trigger_keywords.indexOf(kw)
    if (idx === -1) return

    state.trigger_keywords.splice(idx, 1)
    removedKeyword.value = { keyword: kw, index: idx }

    clearTimeout(undoTimeout.value)
    undoTimeout.value = setTimeout(() => {
        removedKeyword.value = null
    }, 4000)
}
function undoRemoveKeyword() {
    if (!removedKeyword.value) return
    const { keyword, index } = removedKeyword.value
    if (!state.trigger_keywords.includes(keyword)) {
        state.trigger_keywords.splice(Math.min(index, state.trigger_keywords.length), 0, keyword)
    }
    removedKeyword.value = null
    clearTimeout(undoTimeout.value)
}
function onKeywordKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword() }
}

// Template variable insertion via template refs
const autoCommentRef = ref<{ textarea: HTMLTextAreaElement } | null>(null)
const privateReplyRef = ref<{ textarea: HTMLTextAreaElement } | null>(null)

function insertVariable(field: 'auto_comment_text' | 'private_reply_message', variable: string) {
    const textareaWrapper = field === 'auto_comment_text' ? autoCommentRef.value : privateReplyRef.value
    const el = textareaWrapper?.textarea
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

const templateVariables = ['{order_number}', '{checkout_link}', '{customer_name}'] as const

const previewKeyword = computed((): string =>
    state.trigger_keywords.length > 0 ? state.trigger_keywords[0]! : 'авах'
)

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
                    <div v-if="hasAutomationFeature" class="flex items-center gap-3">
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

            <!-- Upgrade gate: automation not available on current plan -->
            <div v-else-if="!hasAutomationFeature" class="flex flex-col items-center justify-center py-24 px-4 text-center empty-state-enter">
                <div class="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6">
                    <UIcon name="i-lucide-lock" class="w-10 h-10 text-amber-500" />
                </div>
                <h3 class="text-lg font-semibold text-[var(--text-heading)] mb-2">Автоматжуулалт Pro боломж</h3>
                <p class="text-sm text-[var(--text-muted)] max-w-md mb-6">
                    Коммент автомат уншиж захиалга үүсгэх, хариулт илгээх зэрэг боломжийг Стандарт эсвэл Pro багцаар ашиглаарай.
                </p>
                <UButton to="/dashboard/plans" color="primary" icon="i-lucide-arrow-up-right" size="lg">
                    Багц сонгох
                </UButton>
            </div>

            <div v-else>
                <!-- Disabled overlay -->
                <div v-if="!state.automation_enabled" class="px-4 lg:px-8 pt-6 lg:pt-8">
                    <div class="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <UIcon name="i-lucide-pause-circle" class="w-5 h-5 text-gray-400 shrink-0" />
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Автоматжуулалт унтраасан байна</p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Дээрх товчийг идэвхжүүлж тохиргоогоо засварлана уу</p>
                        </div>
                    </div>
                </div>

                <!-- Split layout -->
                <div
                    class="p-4 lg:p-8 transition-opacity duration-200"
                    :class="{ 'opacity-40 pointer-events-none': !state.automation_enabled }"
                    :inert="!state.automation_enabled"
                >
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
                                                :aria-label="`${kw} устгах`"
                                                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-800/50 dark:hover:text-red-400 focus:bg-red-50 focus:border-red-200 focus:text-red-600 dark:focus:bg-red-950/20 dark:focus:border-red-800/50 dark:focus:text-red-400 transition-colors group cursor-pointer"
                                                @click="removeKeyword(kw)"
                                            >
                                                {{ kw }}
                                                <UIcon name="i-lucide-x" class="w-3 h-3 opacity-50 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" />
                                            </button>
                                            <span v-if="state.trigger_keywords.length === 0" class="text-xs text-gray-400 italic">
                                                Түлхүүр үг байхгүй байна...
                                            </span>
                                        </div>

                                        <!-- Undo banner -->
                                        <Transition
                                            enter-active-class="transition duration-200 ease-out"
                                            enter-from-class="opacity-0 -translate-y-1"
                                            enter-to-class="opacity-100 translate-y-0"
                                            leave-active-class="transition duration-150 ease-in"
                                            leave-from-class="opacity-100 translate-y-0"
                                            leave-to-class="opacity-0 -translate-y-1"
                                        >
                                            <div
                                                v-if="removedKeyword"
                                                class="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs"
                                            >
                                                <UIcon name="i-lucide-undo-2" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                <span class="text-amber-700 dark:text-amber-400">
                                                    "<strong>{{ removedKeyword.keyword }}</strong>" устгагдлаа
                                                </span>
                                                <button
                                                    type="button"
                                                    class="ml-auto text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                                                    @click="undoRemoveKeyword"
                                                >
                                                    Буцаах
                                                </button>
                                            </div>
                                        </Transition>

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
                                <div v-if="state.auto_comment_enabled" class="mt-4 pt-4 border-t border-[var(--border-primary)] pl-12 space-y-2">
                                    <UTextarea
                                        ref="autoCommentRef"
                                        v-model="state.auto_comment_text"
                                        :rows="2"
                                        autoresize
                                        size="sm"
                                        class="w-full"
                                        placeholder="Баярлалаа! Мессежээр мэдэгдэлэе."
                                    />
                                    <div class="flex flex-wrap gap-1.5">
                                        <button
                                            v-for="v in templateVariables"
                                            :key="v"
                                            type="button"
                                            class="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-mono border border-gray-200 dark:border-gray-700 cursor-pointer"
                                            @click="insertVariable('auto_comment_text', v)"
                                        >{{ v }}</button>
                                    </div>
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
                                        ref="privateReplyRef"
                                        v-model="state.private_reply_message"
                                        :rows="3"
                                        autoresize
                                        size="sm"
                                        class="w-full"
                                        placeholder="Захиалга #{order_number} бүртгэгдлээ! Төлбөр: {checkout_link}"
                                    />
                                    <div class="flex flex-wrap gap-1.5">
                                        <button
                                            v-for="v in templateVariables"
                                            :key="v"
                                            type="button"
                                            class="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-mono border border-gray-200 dark:border-gray-700 cursor-pointer"
                                            @click="insertVariable('private_reply_message', v)"
                                        >{{ v }}</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Validation warnings -->
                            <Transition
                                enter-active-class="transition duration-200 ease-out"
                                enter-from-class="opacity-0 translate-y-1"
                                enter-to-class="opacity-100 translate-y-0"
                                leave-active-class="transition duration-150 ease-in"
                                leave-from-class="opacity-100 translate-y-0"
                                leave-to-class="opacity-0 translate-y-1"
                            >
                                <div v-if="validationWarnings.length > 0" class="mt-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                                    <div class="flex items-start gap-2.5">
                                        <UIcon name="i-lucide-triangle-alert" class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div class="space-y-1">
                                            <p
                                                v-for="(warning, i) in validationWarnings"
                                                :key="i"
                                                class="text-xs text-amber-700 dark:text-amber-400"
                                            >
                                                {{ warning }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Transition>

                            <!-- Bottom save -->
                            <div class="flex justify-end pt-8">
                                <UButton color="primary" icon="i-lucide-check" size="lg" :loading="isSaving" @click="save">
                                    Хадгалах
                                </UButton>
                            </div>
                        </div>

                        <!-- Right column: Preview -->
                        <div class="hidden lg:block w-80 shrink-0">
                            <div class="sticky top-4">
                                <AutomationPreview
                                    :preview-keyword="previewKeyword"
                                    :like-comments="state.like_comments"
                                    :auto-comment-enabled="state.auto_comment_enabled"
                                    :auto-comment-text="state.auto_comment_text"
                                    :private-reply-enabled="state.private_reply_enabled"
                                    :private-reply-message="state.private_reply_message"
                                />
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
                        <div class="p-4">
                            <AutomationPreview
                                :preview-keyword="previewKeyword"
                                :like-comments="state.like_comments"
                                :auto-comment-enabled="state.auto_comment_enabled"
                                :auto-comment-text="state.auto_comment_text"
                                :private-reply-enabled="state.private_reply_enabled"
                                :private-reply-message="state.private_reply_message"
                            />
                        </div>
                    </template>
                </USlideover>
            </div>
        </UDashboardPanel>
    </div>
</template>
