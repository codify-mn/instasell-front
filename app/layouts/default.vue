<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [
    [
        {
            label: 'Нүүр',
            icon: 'i-lucide-house',
            to: '/dashboard',
            onSelect: () => {
                open.value = false
            }
        },
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
            icon: 'i-lucide-wand-sparkles',
            to: '/dashboard/automation',
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
            label: 'Захиалга',
            icon: 'i-lucide-shopping-cart',
            to: '/dashboard/orders',
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
        },
        {
            label: 'Тохиргоо',
            to: '/dashboard/settings',
            icon: 'i-lucide-settings',
            defaultOpen: false,
            type: 'trigger',
            children: [
                {
                    label: 'Дэлгүүр',
                    to: '/dashboard/settings',
                    exact: true,
                    onSelect: () => {
                        open.value = false
                    }
                },
                {
                    label: 'Холболт',
                    to: '/dashboard/settings/integrations',
                    onSelect: () => {
                        open.value = false
                    }
                },
                {
                    label: 'Мэдэгдэл',
                    to: '/dashboard/settings/notifications',
                    onSelect: () => {
                        open.value = false
                    }
                },
                {
                    label: 'Нууцлал',
                    to: '/dashboard/settings/security',
                    onSelect: () => {
                        open.value = false
                    }
                }
            ]
        },
        {
            label: 'Үйлчилгээний эрх',
            to: '/dashboard/billing',
            defaultOpen: false,
            type: 'trigger',
            children: [
                {
                    label: 'Идэвхтэй багц',
                    to: '/dashboard/billing',
                    icon: 'i-lucide-credit-card',
                    exact: true,
                    onSelect: () => {
                        open.value = false
                    }
                },
                {
                    label: 'Багц сонгох',
                    to: '/dashboard/plans',
                    onSelect: () => {
                        open.value = false
                    }
                },
                {
                    label: 'Нэхэмжлэх',
                    to: '/dashboard/history',
                    onSelect: () => {
                        open.value = false
                    }
                }
            ]
        }
    ]
] satisfies NavigationMenuItem[][]

const groups = computed(() => [
    {
        id: 'links',
        label: 'Хуудас',
        items: links.flat()
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
            class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-800/50"
            :ui="{
                header: 'mt-1',
                footer: 'lg:border-t lg:border-gray-200/50 dark:lg:border-gray-800/50'
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
                    class="bg-gray-50/50 dark:bg-gray-800/30 dark:ring-gray-700/40 backdrop-blur-sm"
                />

                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="links[0]"
                    orientation="vertical"
                    tooltip
                    popover
                    :ui="{
                        link: collapsed ? 'py-2 text-sm' : 'p-3 text-md'
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
