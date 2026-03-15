<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const route = useRoute()

// Search functionality
const searchQuery = ref('')
const isSearchOpen = ref(false)

// Mobile sidebar
const isMobileSidebarOpen = ref(false)

// Close mobile sidebar on route change
watch(
    () => route.path,
    () => {
        isMobileSidebarOpen.value = false
    }
)
</script>

<template>
    <div class="min-h-screen bg-white dark:bg-gray-950">
        <!-- Top Navigation -->
        <header
            class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-b border-(--border-primary)"
        >
            <div class="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <!-- Left: Logo & Mobile toggle -->
                    <div class="flex items-center gap-4">
                        <button
                            class="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            @click="isMobileSidebarOpen = !isMobileSidebarOpen"
                        >
                            <UIcon name="i-lucide-menu" class="w-5 h-5" />
                        </button>

                        <AppLogo size="sm" />

                        <span class="text-gray-300 dark:text-gray-700 hidden sm:block">/</span>

                        <span
                            class="text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:block"
                        >
                            Баримтжуулалт
                        </span>
                    </div>

                    <!-- Center: Search (Desktop) -->
                    <div class="hidden md:flex flex-1 max-w-md mx-8">
                        <div class="relative w-full">
                            <UIcon
                                name="i-lucide-search"
                                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            />
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="Хайх... (⌘K)"
                                class="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:bg-white dark:focus:bg-gray-900 transition-all"
                                @focus="isSearchOpen = true"
                            >
                        </div>
                    </div>

                    <!-- Right: Actions -->
                    <div class="flex items-center gap-2">
                        <button
                            class="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            @click="isSearchOpen = true"
                        >
                            <UIcon name="i-lucide-search" class="w-5 h-5" />
                        </button>

                        <UColorModeButton />

                        <UButton
                            to="https://github.com"
                            target="_blank"
                            icon="i-simple-icons-github"
                            color="neutral"
                            variant="ghost"
                            class="hidden sm:flex"
                        />

                        <UButton
                            to="/login"
                            label="Нэвтрэх"
                            size="sm"
                            class="hidden sm:flex bg-linear-to-r from-primary-500 to-primary-600 border-0"
                        />
                    </div>
                </div>
            </div>
        </header>

        <div class="max-w-360 mx-auto flex">
            <!-- Sidebar -->
            <aside
                class="fixed lg:sticky top-16 z-40 w-72 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
                :class="[
                    'lg:block transition-transform duration-300',
                    isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                ]"
            >
                <!-- Mobile overlay -->
                <div
                    v-if="isMobileSidebarOpen"
                    class="fixed inset-0 bg-black/50 lg:hidden -z-10"
                    @click="isMobileSidebarOpen = false"
                />

                <nav
                    class="bg-white dark:bg-gray-950 lg:bg-transparent h-full p-6 border-r border-(--border-primary) lg:border-0"
                >
                    <!-- Quick links -->
                    <div class="mb-8">
                        <h3
                            class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3"
                        >
                            Түргэн холбоос
                        </h3>
                        <div class="space-y-1">
                            <NuxtLink
                                to="/docs/getting-started"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <UIcon name="i-lucide-rocket" class="w-4 h-4 text-primary-500" />
                                Эхлэх заавар
                            </NuxtLink>
                            <NuxtLink
                                to="/docs/api"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <UIcon name="i-lucide-code-2" class="w-4 h-4 text-violet-500" />
                                API баримтжуулалт
                            </NuxtLink>
                            <NuxtLink
                                to="/pricing#faq"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <UIcon
                                    name="i-lucide-help-circle"
                                    class="w-4 h-4 text-indigo-500"
                                />
                                Түгээмэл асуултууд
                            </NuxtLink>
                        </div>
                    </div>

                    <!-- Navigation -->
                    <UContentNavigation
                        v-if="navigation"
                        :navigation="navigation"
                        highlight
                        :ui="{
                            link: 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors'
                        }"
                    />
                </nav>
            </aside>

            <!-- Main content -->
            <main class="flex-1 min-w-0">
                <UContainer class="py-10 px-6 lg:px-10">
                    <UPage>
                        <slot />

                        <!-- Feedback section -->
                        <template #bottom>
                            <div class="mt-16 pt-8 border-t border-(--border-primary)">
                                <div
                                    class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
                                >
                                    <p class="text-gray-500">Энэ хуудас танд тусалсан уу?</p>
                                    <div class="flex items-center gap-2">
                                        <UButton
                                            size="sm"
                                            color="neutral"
                                            variant="outline"
                                            icon="i-lucide-thumbs-up"
                                        >
                                            Тийм
                                        </UButton>
                                        <UButton
                                            size="sm"
                                            color="neutral"
                                            variant="outline"
                                            icon="i-lucide-thumbs-down"
                                        >
                                            Үгүй
                                        </UButton>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </UPage>
                </UContainer>
            </main>

            <!-- Table of contents (Desktop) -->
            <aside class="hidden xl:block w-64 shrink-0">
                <div class="sticky top-24 p-6">
                    <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Энэ хуудсанд
                    </h3>
                    <UContentToc
                        :ui="{
                            link: 'block text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors py-1'
                        }"
                    />
                </div>
            </aside>
        </div>

        <!-- Footer -->
        <footer
            class="border-t border-(--border-primary) bg-(--surface-inset)"
        >
            <div class="max-w-360 mx-auto px-6 py-8">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <NuxtLink to="/" class="flex items-center gap-2">
                            <div
                                class="w-7 h-7 rounded-lg bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center"
                            >
                                <UIcon name="i-lucide-zap" class="w-3.5 h-3.5 text-white" />
                            </div>
                            <span class="font-semibold text-sm text-(--text-heading)"
                                >Instasell</span
                            >
                        </NuxtLink>
                        <span class="text-gray-300 dark:text-gray-700">|</span>
                        <span class="text-sm text-gray-500">Баримтжуулалт</span>
                    </div>

                    <div class="flex items-center gap-6 text-sm">
                        <NuxtLink
                            to="/"
                            class="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Нүүр хуудас
                        </NuxtLink>
                        <NuxtLink
                            to="/pricing"
                            class="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Үнийн мэдээлэл
                        </NuxtLink>
                        <a
                            href="https://github.com"
                            target="_blank"
                            class="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* Custom scrollbar for sidebar */
.scrollbar-thin {
    scrollbar-width: thin;
}

.scrollbar-thumb-gray-300::-webkit-scrollbar {
    width: 6px;
}

.scrollbar-thumb-gray-300::-webkit-scrollbar-track {
    background: transparent;
}

.scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 3px;
}

.dark .scrollbar-thumb-gray-700::-webkit-scrollbar-thumb {
    background-color: #374151;
}
</style>
