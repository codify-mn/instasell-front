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
</script>

<template>
    <div class="w-full h-full overflow-y-auto">
        <UDashboardPanel id="automation">
            <UDashboardNavbar>
                <template #title>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-zap" class="w-5 h-5" />
                        <span>Автоматжуулалт</span>
                    </div>
                </template>
                <template #right>
                    <UButton
                        color="primary"
                        icon="i-lucide-check"
                        :loading="isSaving"
                        @click="save"
                    >
                        Хадгалах
                    </UButton>
                </template>
            </UDashboardNavbar>

            <div v-if="isLoading" class="flex justify-center py-20">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
            </div>

            <div v-else class="p-4 lg:p-8 max-w-3xl mx-auto space-y-0">

                <!-- Master toggle + status -->
                <div class="flex items-center justify-between p-4 mb-6 rounded-2xl border transition-colors"
                    :class="state.automation_enabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'"
                >
                    <div class="flex items-center gap-3">
                        <span :class="['w-2.5 h-2.5 rounded-full shrink-0', state.automation_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400']" />
                        <div>
                            <p class="text-sm font-semibold"
                                :class="state.automation_enabled ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-600 dark:text-gray-400'"
                            >
                                {{ state.automation_enabled ? 'Автоматжуулалт идэвхтэй' : 'Автоматжуулалт унтраалттай' }}
                            </p>
                            <p class="text-xs mt-0.5"
                                :class="state.automation_enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'"
                            >
                                <template v-if="state.automation_enabled">
                                    {{ activeSteps === 0 ? 'Захиалга үүсгэнэ, нэмэлт үйлдэл тохируулаагүй' : `Захиалга үүсгэнэ + ${activeSteps} нэмэлт үйлдэл` }}
                                </template>
                                <template v-else>
                                    Facebook комментоос захиалга үүсгэхгүй
                                </template>
                            </p>
                        </div>
                    </div>
                    <USwitch v-model="state.automation_enabled" />
                </div>

                <div class="space-y-0 transition-opacity duration-200" :class="{ 'opacity-40 pointer-events-none': !state.automation_enabled }">

                    <!-- Step 1: Trigger -->
                    <div class="relative">
                        <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                            <div class="flex items-start gap-4">
                                <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center shrink-0">
                                    <UIcon name="i-lucide-message-square" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-3 mb-1">
                                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Алхам 1</p>
                                        <span class="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Үргэлж идэвхтэй</span>
                                    </div>
                                    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-1">Facebook коммент илрүүлэх</h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        Хэрэглэгч доорх үгсийн аль нэгийг комментлоход захиалга автоматаар үүснэ
                                    </p>

                                    <!-- Keyword tags -->
                                    <div class="flex flex-wrap gap-2 mb-3 min-h-[28px]">
                                        <button
                                            v-for="kw in state.trigger_keywords"
                                            :key="kw"
                                            type="button"
                                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-sm font-medium border border-primary-200 dark:border-primary-800/50 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-800/50 dark:hover:text-red-400 transition-colors group"
                                            @click="removeKeyword(kw)"
                                        >
                                            {{ kw }}
                                            <UIcon name="i-lucide-x" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <span v-if="state.trigger_keywords.length === 0" class="text-sm text-gray-400 italic">
                                            Түлхүүр үг байхгүй байна...
                                        </span>
                                    </div>

                                    <!-- Add keyword -->
                                    <div class="flex gap-2 max-w-sm">
                                        <UInput
                                            v-model="keywordInput"
                                            placeholder="авах, buy, захиалах..."
                                            @keydown="onKeywordKeydown"
                                        />
                                        <UButton color="primary" variant="soft" @click="addKeyword">Нэмэх</UButton>
                                    </div>
                                    <p class="text-xs text-gray-400 mt-2">Enter дарах эсвэл "Нэмэх" товч. Устгахдаа үгэн дээр дарна уу.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Connector line + label -->
                        <div class="flex items-center gap-3 py-2 px-6">
                            <div class="w-px h-8 bg-gray-200 dark:bg-gray-700 ml-4" />
                            <span class="text-xs text-gray-400">дараа нь</span>
                        </div>
                    </div>

                    <!-- Step 2: Core action (locked) -->
                    <div class="relative">
                        <div class="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/50 p-6">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                                    <UIcon name="i-lucide-shopping-bag" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-1">
                                        <p class="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Алхам 2</p>
                                        <UIcon name="i-lucide-lock" class="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <h3 class="text-base font-semibold text-emerald-800 dark:text-emerald-200">Захиалга автоматаар үүснэ</h3>
                                    <p class="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">Энэ үйлдэл үргэлж явагдана — унтраах боломжгүй</p>
                                </div>
                                <div class="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-800/50 flex items-center justify-center shrink-0">
                                    <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        <!-- Connector -->
                        <div class="flex items-center gap-3 py-2 px-6">
                            <div class="w-px h-8 bg-gray-200 dark:bg-gray-700 ml-4" />
                            <span class="text-xs text-gray-400">мөн нэмэлтээр...</span>
                        </div>
                    </div>

                    <!-- Step 3: Follow-up actions -->
                    <div>
                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Алхам 3 — Нэмэлт үйлдлүүд</p>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

                            <!-- Like -->
                            <div
                                class="rounded-2xl border-2 p-5 transition-all cursor-pointer"
                                :class="state.like_comments
                                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20 dark:border-primary-700'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'"
                                @click="state.like_comments = !state.like_comments"
                            >
                                <div class="flex items-start justify-between mb-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                                        :class="state.like_comments ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'"
                                    >
                                        <UIcon name="i-lucide-thumbs-up" class="w-5 h-5"
                                            :class="state.like_comments ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
                                        />
                                    </div>
                                    <USwitch
                                        :model-value="state.like_comments"
                                        @click.stop
                                        @update:model-value="state.like_comments = $event"
                                    />
                                </div>
                                <h4 class="text-sm font-semibold mb-1"
                                    :class="state.like_comments ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                                >
                                    Like дарах
                                </h4>
                                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Захиалга илрүүлсэн комментод автоматаар 👍 дарна
                                </p>
                            </div>

                            <!-- Public reply -->
                            <div
                                class="rounded-2xl border-2 p-5 transition-all"
                                :class="state.auto_comment_enabled
                                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20 dark:border-primary-700'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'"
                            >
                                <div class="flex items-start justify-between mb-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                                        :class="state.auto_comment_enabled ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'"
                                    >
                                        <UIcon name="i-lucide-message-circle" class="w-5 h-5"
                                            :class="state.auto_comment_enabled ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
                                        />
                                    </div>
                                    <USwitch v-model="state.auto_comment_enabled" />
                                </div>
                                <h4 class="text-sm font-semibold mb-1"
                                    :class="state.auto_comment_enabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                                >
                                    Нийтэд хариулах
                                </h4>
                                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                                    Комментод нийтэд харагдах хариулт илгээнэ
                                </p>
                                <div v-if="state.auto_comment_enabled">
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

                            <!-- Private message -->
                            <div
                                class="rounded-2xl border-2 p-5 transition-all"
                                :class="state.private_reply_enabled
                                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20 dark:border-primary-700'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'"
                            >
                                <div class="flex items-start justify-between mb-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                                        :class="state.private_reply_enabled ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'"
                                    >
                                        <UIcon name="i-lucide-send" class="w-5 h-5"
                                            :class="state.private_reply_enabled ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
                                        />
                                    </div>
                                    <USwitch v-model="state.private_reply_enabled" />
                                </div>
                                <h4 class="text-sm font-semibold mb-1"
                                    :class="state.private_reply_enabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                                >
                                    Хувийн мессеж
                                </h4>
                                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                                    Хэрэглэгчид checkout линктэй хувийн мессеж илгээнэ
                                </p>
                                <div v-if="state.private_reply_enabled" class="space-y-2">
                                    <UTextarea
                                        id="private-reply-textarea"
                                        v-model="state.private_reply_message"
                                        :rows="3"
                                        autoresize
                                        size="sm"
                                        class="w-full"
                                        placeholder="Захиалга #{order_number} бүртгэгдлээ! Төлбөр: {checkout_link}"
                                    />
                                    <div class="flex flex-wrap gap-1">
                                        <button
                                            v-for="v in ['{order_number}', '{checkout_link}', '{customer_name}']"
                                            :key="v"
                                            type="button"
                                            class="px-2 py-0.5 text-xs rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-mono cursor-pointer border border-gray-200 dark:border-gray-700"
                                            @click="insertVariable('private_reply_message', v)"
                                        >{{ v }}</button>
                                    </div>
                                </div>
                            </div>
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
        </UDashboardPanel>
    </div>
</template>
