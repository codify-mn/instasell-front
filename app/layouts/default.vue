<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const mainItems: NavigationMenuItem[] = [
    {
        label: 'Нүүр',
        icon: 'i-lucide-layout-grid',
        to: '/dashboard',
        onSelect: () => {
            open.value = false
        }
    },
    {
        label: 'Захиалга',
        icon: 'i-lucide-shopping-bag',
        to: '/dashboard/orders',
        onSelect: () => {
            open.value = false
        }
    },
    {
        label: 'Бараа',
        icon: 'i-lucide-package',
        to: '/dashboard/products',
        onSelect: () => {
            open.value = false
        }
    },
    {
        label: 'Хэрэглэгчид',
        icon: 'i-lucide-users',
        to: '/dashboard/customers',
        onSelect: () => {
            open.value = false
        }
    }
]

const liveItems: NavigationMenuItem[] = [
    {
        label: 'Facebook Live',
        icon: 'i-lucide-tv-minimal-play',
        to: '/dashboard/live',
        badge: 'Pro багц',
        onSelect: () => {
            open.value = false
        }
    },
    {
        label: 'Автоматжуулалт',
        icon: 'i-lucide-zap',
        to: '/dashboard/automation',
        onSelect: () => {
            open.value = false
        }
    }
]

const settingsItems: NavigationMenuItem[] = [
    // {
    //     label: 'Үйлчилгээний эрх',
    //     to: '/dashboard/billing',
    //     icon: 'i-lucide-credit-card',
    //     defaultOpen: false,
    //     type: 'trigger',
    //     children: [
    //         {
    //             label: 'Идэвхтэй багц',
    //             to: '/dashboard/billing',
    //             exact: true,
    //             onSelect: () => { open.value = false }
    //         },
    //         {
    //             label: 'Багц сонгох',
    //             to: '/dashboard/plans',
    //             onSelect: () => { open.value = false }
    //         },
    //         {
    //             label: 'Нэхэмжлэх',
    //             to: '/dashboard/history',
    //             onSelect: () => { open.value = false }
    //         }
    //     ]
    // },
    {
        label: 'Тохиргоо',
        to: '/dashboard/settings',
        icon: 'i-lucide-settings',
        onSelect: () => {
            open.value = false
        }
    }
]

const groups = computed(() => [
    {
        id: 'links',
        label: 'Хуудас',
        items: [...mainItems, ...liveItems, ...settingsItems]
    }
])
</script>

<template>
    <UDashboardGroup unit="%">
        <UDashboardSidebar
            id="default"
            v-model:open="open"
            collapsible
            :default-size="22.22"
            :min-size="22.22"
            :max-size="22.22"
            class="!bg-[var(--surface-card)] border-r border-[var(--border-primary)]"
            :ui="{
                header: 'mt-1',
                footer: 'lg:border-t lg:border-[var(--border-primary)]'
            }"
        >
            <template #header="{ collapsed }">
                <TeamsMenu :collapsed="collapsed" />
            </template>

            <template #default="{ collapsed }">
                <UDashboardSearchButton
                    label="Хайх..."
                    placeholder="Хайх..."
                    :collapsed="collapsed"
                    class="bg-[var(--surface-inset)] ring-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--border-primary)]"
                />

                <!-- Main nav items -->
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="[mainItems]"
                    orientation="vertical"
                    color="primary"
                    tooltip
                    popover
                    :ui="{
                        link: collapsed
                            ? 'py-2 text-sm text-[var(--text-body)] hover:before:bg-[var(--surface-inset)]'
                            : 'p-3 text-md text-[var(--text-body)] hover:before:bg-[var(--surface-inset)]',
                        linkLeadingIcon: 'text-[var(--text-body)]'
                    }"
                />

                <!-- Live section -->
                <div v-if="!collapsed" class="px-3 pt-3 pb-1">
                    <span
                        class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-placeholder)]"
                        >Шууд дамжуулалт</span
                    >
                </div>
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="[liveItems]"
                    orientation="vertical"
                    color="primary"
                    tooltip
                    popover
                    :ui="{
                        link: collapsed
                            ? 'py-2 text-sm text-[var(--text-body)] hover:before:bg-[var(--surface-inset)]'
                            : 'p-3 text-md text-[var(--text-body)] hover:before:bg-[var(--surface-inset)]',
                        linkLeadingIcon: 'text-[var(--text-body)]'
                    }"
                />

                <!-- Settings section -->
                <div v-if="!collapsed" class="px-3 pt-3 pb-1">
                    <span
                        class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-placeholder)]"
                        >Тохиргоо</span
                    >
                </div>
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="[settingsItems]"
                    orientation="vertical"
                    color="primary"
                    tooltip
                    popover
                    :ui="{
                        link: collapsed
                            ? 'py-2 text-sm text-[var(--text-body)] hover:before:bg-[var(--surface-inset)]'
                            : 'p-3 text-md text-[var(--text-body)] hover:before:bg-[var(--surface-inset)]',
                        linkLeadingIcon: 'text-[var(--text-body)]'
                    }"
                />
            </template>

            <template #footer="{ collapsed }">
                <UserMenu :collapsed="collapsed" />
            </template>
        </UDashboardSidebar>

        <UDashboardSearch :groups="groups" />

        <slot />
    </UDashboardGroup>
</template>
