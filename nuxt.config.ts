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

    ssr: false,

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
        pageTransition: false,
        layoutTransition: false
    },

    runtimeConfig: {
        public: {
            apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://instasell-api.codify.mn',
            srsUrl: process.env.NUXT_PUBLIC_SRS_URL || 'http://localhost:1985'
        }
    },

    routeRules: {
        '/api': {
            cors: true,
            proxy: 'http://localhost:4000/api'
        },
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
