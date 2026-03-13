<script setup lang="ts">
const route = useRoute()

const navigation = [
    {
        label: 'Боломжууд',
        to: '/#features'
    },
    {
        label: 'Үнийн мэдээлэл',
        to: '/pricing'
    },
    {
        label: 'Тусламж',
        to: '/docs',
        active: route.path.startsWith('/docs')
    }
]
</script>

<template>
    <UHeader
        :ui="{
            root: 'backdrop-blur-xl bg-white/90 dark:bg-gray-950/90 border-b border-[var(--border-primary)]',
            container: 'max-w-7xl'
        }"
    >
        <template #left>
            <AppLogo />
        </template>

        <UNavigationMenu
            :items="navigation"
            variant="link"
            :ui="{
                link: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200'
            }"
        />

        <template #right>
            <UColorModeButton
                :ui="{
                    base: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }"
            />
            <UButton
                to="/login"
                icon="i-lucide-user"
                color="neutral"
                variant="ghost"
                class="lg:hidden"
            />
            <UButton
                to="/login"
                label="Нэвтрэх"
                color="neutral"
                variant="ghost"
                class="hidden lg:flex"
            />
            <UButton
                to="/login?mode=register"
                label="Үнэгүй эхлэх"
                class="hidden lg:flex bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300"
            />
        </template>

        <template #body>
            <UNavigationMenu :items="navigation" orientation="vertical" class="-mx-2.5" />
            <USeparator class="my-4" />
            <div class="flex flex-col gap-y-2">
                <UButton to="/login" label="Нэвтрэх" color="neutral" variant="ghost" block />
                <UButton
                    to="/login?mode=register"
                    label="Үнэгүй эхлэх"
                    block
                    class="bg-gradient-to-r from-primary-500 to-primary-600 border-0"
                />
            </div>
        </template>
    </UHeader>
</template>
