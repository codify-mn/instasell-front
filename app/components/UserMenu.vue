<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
    collapsed?: boolean
}>()

const colorMode = useColorMode()
const { user: authUser, logout } = useAuth()

const user = computed(() => ({
    name: authUser.value
        ? `${authUser.value.first_name} ${authUser.value.last_name}`.trim() || authUser.value.email
        : 'Guest',
    avatar: {
        src: authUser.value?.picture || '',
        alt: authUser.value?.first_name || 'User'
    }
}))

const items = computed<DropdownMenuItem[][]>(() => [
    [
        {
            type: 'label',
            label: user.value.name,
            avatar: user.value.avatar
        }
    ],
    [
        {
            label: 'Дэлгүүр',
            icon: 'i-lucide-store',
            to: '/dashboard/settings'
        },
        {
            label: 'Төлбөр',
            icon: 'i-lucide-credit-card',
            to: '/dashboard/settings/billing'
        },
        {
            label: 'Тохиргоо',
            icon: 'i-lucide-settings',
            to: '/dashboard/settings'
        }
    ],
    [
        {
            label: 'Харагдац',
            icon: 'i-lucide-sun-moon',
            children: [
                {
                    label: 'Цайвар',
                    icon: 'i-lucide-sun',
                    type: 'checkbox',
                    checked: colorMode.value === 'light',
                    onSelect(e: Event) {
                        e.preventDefault()
                        colorMode.preference = 'light'
                    }
                },
                {
                    label: 'Бараан',
                    icon: 'i-lucide-moon',
                    type: 'checkbox',
                    checked: colorMode.value === 'dark',
                    onUpdateChecked(checked: boolean) {
                        if (checked) {
                            colorMode.preference = 'dark'
                        }
                    },
                    onSelect(e: Event) {
                        e.preventDefault()
                    }
                }
            ]
        }
    ],
    [
        {
            label: 'Нүүр хуудас',
            icon: 'i-lucide-globe',
            to: '/'
        },
        {
            label: 'Гарах',
            icon: 'i-lucide-log-out',
            onSelect: () => logout()
        }
    ]
])
</script>

<template>
    <UDropdownMenu
        :items="items"
        :content="{ align: 'center', collisionPadding: 12 }"
        :ui="{
            content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)'
        }"
    >
        <UButton
            v-bind="{
                ...user,
                label: collapsed ? undefined : user?.name,
                trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
            }"
            color="neutral"
            variant="ghost"
            block
            :square="collapsed"
            class="data-[state=open]:bg-[var(--surface-inset)]"
            :ui="{
                trailingIcon: 'text-dimmed'
            }"
        />
    </UDropdownMenu>
</template>
