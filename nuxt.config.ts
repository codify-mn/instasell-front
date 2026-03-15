// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        '@nuxt/eslint',
        '@nuxt/image',
        '@nuxt/ui',
        '@nuxt/content',
        '@vueuse/nuxt',
        'nuxt-og-image'
    ],

    devtools: {
        enabled: process.env.NODE_ENV !== 'production'
    },

    ogImage: {
        enabled: false
    },

    components: [
        {
            path: '~/components',
            pathPrefix: false
        }
    ],

    css: ['~/assets/css/main.css'],

    app: {
        head: {
            htmlAttrs: { lang: 'mn' }
        },
        pageTransition: { name: 'page', mode: 'out-in' },
        layoutTransition: { name: 'layout', mode: 'out-in' }
    },

    runtimeConfig: {
        public: {
            apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://instasell-api.codify.mn',
            srsUrl: process.env.NUXT_PUBLIC_SRS_URL || 'http://localhost:1985'
        }
    },

    routeRules: {
        '/dashboard/**': { ssr: false },
        '/login': { ssr: false },
        '/signup': { ssr: false },
        '/forgot-password': { ssr: false },
        '/reset-password': { ssr: false },
        '/otp-test': { ssr: false },
        '/auth/**': { ssr: false },
        '/checkout/**': { ssr: false },
        '/onboarding': { ssr: false },
        '/docs': {
            redirect: '/docs/getting-started'
        }
    },

    compatibilityDate: '2024-07-11',

    eslint: {
        config: {
            stylistic: false
        }
    }
})
