export default defineNuxtRouteMiddleware(async (to) => {
    // Skip auth entirely during SSR — no cookies available on server
    if (import.meta.server) return

    const { isAuthenticated, isLoading, needsOnboarding, fetchUser } = useAuth()

    // Skip middleware for public pages
    const publicPages = ['/login', '/signup', '/auth/callback', '/', '/docs']
    const isPublicPage = publicPages.some((page) => to.path === page || to.path.startsWith('/docs'))

    // Fetch user if not loaded yet
    if (isLoading.value) {
        await fetchUser()
    }

    // Protect dashboard routes
    if (to.path.startsWith('/dashboard')) {
        if (!isAuthenticated.value) {
            return navigateTo('/login')
        }

        // Redirect to onboarding if not completed
        if (needsOnboarding.value) {
            return navigateTo('/onboarding')
        }
    }

    // Protect onboarding route
    if (to.path === '/onboarding') {
        if (!isAuthenticated.value) {
            return navigateTo('/login')
        }
        // If onboarding is already completed, go to dashboard
        if (!needsOnboarding.value) {
            return navigateTo('/dashboard')
        }
    }

    // Redirect authenticated users away from login
    if (to.path === '/login' && isAuthenticated.value) {
        if (needsOnboarding.value) {
            return navigateTo('/onboarding')
        }
        return navigateTo('/dashboard')
    }
})
