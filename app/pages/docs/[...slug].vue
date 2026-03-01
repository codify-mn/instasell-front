<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

definePageMeta({
    layout: 'docs'
})

const route = useRoute()

const { data: navigation } = await useAsyncData('docs-navigation', () =>
    queryCollectionNavigation('docs')
)

const { data: page } = await useAsyncData(`docs-${route.path}`, () =>
    queryCollection('docs').path(route.path).first()
)

provide<Ref<ContentNavigationItem[]>>('navigation', navigation as Ref<ContentNavigationItem[]>)

useSeoMeta({
    title: () => (page.value?.title ? `${page.value.title} - Docs` : 'Documentation'),
    description: () => page.value?.description || 'Instasell documentation'
})
</script>

<template>
    <UPage v-if="page">
        <UPageHeader :title="page.title" :description="page.description" />

        <UPageBody>
            <ContentRenderer :value="page" />
        </UPageBody>

        <template #right>
            <UContentToc v-if="page.body?.toc?.links?.length" :links="page.body.toc.links" />
        </template>
    </UPage>

    <UPage v-else>
        <UPageHeader
            title="Page not found"
            description="The documentation page you're looking for doesn't exist."
        />
    </UPage>
</template>
