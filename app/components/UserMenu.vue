<script setup lang="ts">
defineProps<{
    collapsed?: boolean
}>()

const colorMode = useColorMode()
const { user: authUser, logout } = useAuth()

const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (val: boolean) => {
        colorMode.preference = val ? 'dark' : 'light'
    }
})

const user = computed(() => ({
    name: authUser.value
        ? `${authUser.value.first_name} ${authUser.value.last_name}`.trim() || authUser.value.email
        : 'Guest',
    avatar: authUser.value?.picture || '',
    initials: authUser.value?.first_name?.[0] || 'U'
}))

const dropdownOpen = ref(false)
</script>

<template>
    <UPopover
        v-model:open="dropdownOpen"
        :content="{ align: collapsed ? 'center' : 'start', side: 'top', sideOffset: 8, collisionPadding: 12 }"
    >
        <button
            class="flex items-center gap-2.5 w-full rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface-inset)] cursor-pointer"
            :class="[collapsed ? 'justify-center' : '', dropdownOpen ? 'bg-[var(--surface-inset)]' : '']"
        >
            <UAvatar
                :src="user.avatar"
                :alt="user.name"
                size="sm"
                class="shrink-0"
            />
            <template v-if="!collapsed">
                <span class="flex-1 text-left text-sm font-medium text-[var(--text-heading)] truncate">
                    {{ user.name }}
                </span>
                <UIcon
                    name="i-lucide-ellipsis"
                    class="size-4 text-[var(--text-muted)] shrink-0"
                />
            </template>
        </button>

        <template #content>
            <div class="w-72 p-2">
                <!-- User info -->
                <div class="flex items-center gap-3 px-2 py-2.5 mb-1">
                    <UAvatar
                        :src="user.avatar"
                        :alt="user.name"
                        size="md"
                    />
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-[var(--text-heading)] truncate">{{ user.name }}</p>
                        <p v-if="authUser?.email" class="text-xs text-[var(--text-muted)] truncate">{{ authUser.email }}</p>
                    </div>
                </div>

                <USeparator class="my-1" />

                <!-- Theme toggle -->
                <div class="flex items-center justify-between px-2 py-1.5">
                    <div class="flex items-center gap-2.5">
                        <UIcon
                            :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
                            class="size-4 text-[var(--text-muted)] transition-transform duration-300"
                            :class="isDark ? 'rotate-0' : 'rotate-0'"
                        />
                        <span class="text-sm text-[var(--text-body)]">{{ isDark ? 'Бараан' : 'Цайвар' }}</span>
                    </div>
                    <button
                        class="theme-toggle"
                        :class="isDark ? 'theme-toggle--active' : ''"
                        role="switch"
                        :aria-checked="isDark"
                        @click="isDark = !isDark"
                    >
                        <span class="theme-toggle__track">
                            <span class="theme-toggle__icons">
                                <UIcon name="i-lucide-sun" class="theme-toggle__icon theme-toggle__icon--light" />
                                <UIcon name="i-lucide-moon" class="theme-toggle__icon theme-toggle__icon--dark" />
                            </span>
                            <span class="theme-toggle__thumb" />
                        </span>
                    </button>
                </div>

                <USeparator class="my-1" />

                <!-- Logout -->
                <button
                    class="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    @click="logout(); dropdownOpen = false"
                >
                    <UIcon name="i-lucide-log-out" class="size-4" />
                    Гарах
                </button>
            </div>
        </template>
    </UPopover>
</template>

<style scoped>
.theme-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    border-radius: 9999px;
    background: var(--surface-inset);
    border: 1px solid var(--border-primary);
    cursor: pointer;
    transition: background 0.3s ease, border-color 0.3s ease;
    padding: 0;
}

.theme-toggle--active {
    background: var(--color-primary-500);
    border-color: var(--color-primary-500);
}

.theme-toggle__track {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
}

.theme-toggle__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 9999px;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle--active .theme-toggle__thumb {
    transform: translateX(20px);
}

.theme-toggle__icons {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
}

.theme-toggle__icon {
    width: 12px;
    height: 12px;
    transition: opacity 0.2s ease, transform 0.3s ease;
}

.theme-toggle__icon--light {
    color: var(--text-muted);
    opacity: 1;
}

.theme-toggle__icon--dark {
    color: white;
    opacity: 0;
}

.theme-toggle--active .theme-toggle__icon--light {
    opacity: 0;
}

.theme-toggle--active .theme-toggle__icon--dark {
    opacity: 1;
}
</style>
