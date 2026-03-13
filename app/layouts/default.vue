<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const mainItems: NavigationMenuItem[] = [
    {
        label: 'Нүүр',
        icon: 'i-lucide-layout-grid',
        to: '/dashboard',
        onSelect: () => { open.value = false }
    },
    {
        label: 'Захиалга',
        icon: 'i-lucide-shopping-bag',
        to: '/dashboard/orders',
        onSelect: () => { open.value = false }
    },
    {
        label: 'Бараа',
        icon: 'i-lucide-package',
        to: '/dashboard/products',
        onSelect: () => { open.value = false }
    },
    {
        label: 'Хэрэглэгчид',
        icon: 'i-lucide-users',
        to: '/dashboard/customers',
        onSelect: () => { open.value = false }
    },
]

const liveItems: NavigationMenuItem[] = [
    {
        label: 'Facebook Live',
        icon: 'i-lucide-tv-minimal-play',
        to: '/dashboard/live',
        badge: 'Pro багц',
        onSelect: () => { open.value = false }
    },
    {
        label: 'Автоматжуулалт',
        icon: 'i-lucide-zap',
        to: '/dashboard/automation',
        onSelect: () => { open.value = false }
    },
]

const settingsItems: NavigationMenuItem[] = [
    {
        label: 'Үйлчилгээний эрх',
        to: '/dashboard/billing',
        icon: 'i-lucide-credit-card',
        defaultOpen: false,
        type: 'trigger',
        children: [
            {
                label: 'Идэвхтэй багц',
                to: '/dashboard/billing',
                exact: true,
                onSelect: () => { open.value = false }
            },
            {
                label: 'Багц сонгох',
                to: '/dashboard/plans',
                onSelect: () => { open.value = false }
            },
            {
                label: 'Нэхэмжлэх',
                to: '/dashboard/history',
                onSelect: () => { open.value = false }
            }
        ]
    },
    {
        label: 'Тохиргоо',
        to: '/dashboard/settings',
        icon: 'i-lucide-settings',
        onSelect: () => { open.value = false }
    },
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
    <UDashboardGroup unit="rem">
        <UDashboardSidebar
            id="default"
            v-model:open="open"
            collapsible
            resizable
            class="!bg-white dark:!bg-[#0f172a] border-r border-[#e2e8f0] dark:border-[#334155]"
            :ui="{
                header: 'mt-1',
                footer: 'lg:border-t lg:border-[#e2e8f0] dark:lg:border-[#334155]'
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
                    class="bg-[#f1f5f9] dark:bg-[#1e293b] ring-[#e2e8f0] dark:ring-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:bg-[#e2e8f0] dark:hover:bg-[#334155]"
                />

                <!-- Main nav items -->
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="[mainItems]"
                    orientation="vertical"
                    color="success"
                    tooltip
                    popover
                    :ui="{
                        link: collapsed ? 'py-2 text-sm text-[#4f566b] dark:text-[#94a3b8] hover:before:bg-[#f6f9fc] dark:hover:before:bg-[#0f172a]' : 'p-3 text-md text-[#4f566b] dark:text-[#94a3b8] hover:before:bg-[#f6f9fc] dark:hover:before:bg-[#0f172a]',
                        linkLeadingIcon: 'text-[#4f566b] dark:text-[#94a3b8]',
                    }"
                />

                <!-- Live section -->
                <div v-if="!collapsed" class="px-3 pt-3 pb-1">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-[#9baacf] dark:text-[#475569]">Шууд дамжуулалт</span>
                </div>
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="[liveItems]"
                    orientation="vertical"
                    color="success"
                    tooltip
                    popover
                    :ui="{
                        link: collapsed ? 'py-2 text-sm text-[#4f566b] dark:text-[#94a3b8] hover:before:bg-[#f6f9fc] dark:hover:before:bg-[#0f172a]' : 'p-3 text-md text-[#4f566b] dark:text-[#94a3b8] hover:before:bg-[#f6f9fc] dark:hover:before:bg-[#0f172a]',
                        linkLeadingIcon: 'text-[#4f566b] dark:text-[#94a3b8]',
                    }"
                />

                <!-- Settings section -->
                <div v-if="!collapsed" class="px-3 pt-3 pb-1">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-[#9baacf] dark:text-[#475569]">Тохиргоо</span>
                </div>
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="[settingsItems]"
                    orientation="vertical"
                    color="success"
                    tooltip
                    popover
                    :ui="{
                        link: collapsed ? 'py-2 text-sm text-[#4f566b] dark:text-[#94a3b8] hover:before:bg-[#f6f9fc] dark:hover:before:bg-[#0f172a]' : 'p-3 text-md text-[#4f566b] dark:text-[#94a3b8] hover:before:bg-[#f6f9fc] dark:hover:before:bg-[#0f172a]',
                        linkLeadingIcon: 'text-[#4f566b] dark:text-[#94a3b8]',
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
