<script setup lang="ts">
definePageMeta({
    layout: 'public'
})

useSeoMeta({
    title: 'Instasell - Live худалдааны ухаалаг платформ',
    description:
        'Facebook Live борлуулалтаа хялбархан удирдаж, захиалга автоматаар хүлээн авч, бизнесээ өсгөөрэй.'
})

const features = [
    {
        title: 'Цаг хэмнэ',
        description:
            'Захиалга автоматаар боловсруулж, өдөрт 3+ цаг хэмнээрэй. Гараар бичих шаардлагагүй.',
        icon: 'i-lucide-clock',
        color: 'from-primary-500 to-orange-500',
        stat: '3+ цаг/өдөр'
    },
    {
        title: 'Борлуулалт нэмэгдэнэ',
        description:
            'Коммент захиалгыг алдахгүй. Бүх захиалгыг автомат хүлээн авч, орлогоо 40% нэмэгдүүл.',
        icon: 'i-lucide-trending-up',
        color: 'from-green-500 to-emerald-500',
        stat: '+40% орлого'
    },
    {
        title: 'Илүү их хөрвүүлэлт',
        description: 'Хурдан хариу үйлдэл = илүү их борлуулалт. Захиалгын хөрвүүлэлт 2x нэмэгдэнэ.',
        icon: 'i-lucide-target',
        color: 'from-violet-500 to-purple-500',
        stat: '2x хөрвүүлэлт'
    },
    {
        title: 'Бүгдийг нэг дороос',
        description: 'Захиалга, бараа, харилцагч, тайлан - бүгд нэг систем дотор.',
        icon: 'i-lucide-layout-dashboard',
        color: 'from-blue-500 to-cyan-500',
        stat: '1 платформ'
    }
]

const stats = [
    { value: '3+ цаг', label: 'Өдөр бүр хэмнэнэ', icon: 'i-lucide-clock' },
    { value: '+40%', label: 'Орлого нэмэгдэнэ', icon: 'i-lucide-trending-up' },
    { value: '0', label: 'Алдагдсан захиалга', icon: 'i-lucide-check-circle' },
    { value: '< 1с', label: 'Захиалга боловсруулалт', icon: 'i-lucide-zap' }
]

const steps = [
    {
        step: '01',
        title: 'Бүртгүүлэх',
        description: '2 минутад үнэгүй бүртгүүлж, дэлгүүрээ нээгээрэй.',
        icon: 'i-lucide-user-plus',
        benefit: 'Карт шаардлагагүй'
    },
    {
        step: '02',
        title: 'Бараа нэмэх',
        description: 'Барааны мэдээлэл, зураг, үнээ оруулж, каталог бүрдүүлээрэй.',
        icon: 'i-lucide-package-plus',
        benefit: 'Excel-ээс импорт хийх боломжтой'
    },
    {
        step: '03',
        title: 'Борлуулж эхлэх',
        description: 'Facebook холбоод Live эхлүүлээрэй. Захиалга автомат ирнэ.',
        icon: 'i-lucide-play-circle',
        benefit: 'Шууд орлого олж эхлэх'
    }
]

const testimonials = [
    {
        quote: 'Өмнө нь захиалга бүртгэхэд л 4 цаг зарцуулдаг байсан. Одоо бүгд автомат болсон, би зөвхөн хүргэлтэнд анхаарна.',
        author: 'Б. Сарангэрэл',
        role: 'Гоо сайхны дэлгүүр эзэмшигч',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        metric: 'Өдөрт 4 цаг хэмнэнэ'
    },
    {
        quote: 'Live үед захиалга алдаж байсан асуудал арилсан. Борлуулалт 50%-иар өссөн.',
        author: 'Д. Болормаа',
        role: 'Хувцасны брэнд эзэмшигч',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bold',
        metric: '+50% борлуулалт'
    },
    {
        quote: 'Excel, Messenger хооронд гүйхээ больсон. Бүх захиалга нэг дороос харагдана.',
        author: 'Э. Мөнхбат',
        role: 'Электроникийн худалдаачин',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
        metric: '100% автоматжуулсан'
    }
]

const painPoints = [
    { problem: 'Коммент захиалга алддаг', solution: 'Бүх коммент автомат уншина' },
    { problem: 'Гараар бичиж амжихгүй', solution: 'Захиалга автомат бүртгэнэ' },
    { problem: 'Алдаа гаргадаг', solution: '0 алдаатай систем' },
    { problem: 'Бүртгэлд цаг алдана', solution: '3+ цаг хэмнэнэ' }
]

// Intersection observer for animations
const featuresRef = ref<HTMLElement | null>(null)
const stepsRef = ref<HTMLElement | null>(null)
const statsRef = ref<HTMLElement | null>(null)

const featuresVisible = ref(false)
const stepsVisible = ref(false)
const statsVisible = ref(false)

onMounted(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.target === featuresRef.value && entry.isIntersecting) {
                    featuresVisible.value = true
                }
                if (entry.target === stepsRef.value && entry.isIntersecting) {
                    stepsVisible.value = true
                }
                if (entry.target === statsRef.value && entry.isIntersecting) {
                    statsVisible.value = true
                }
            })
        },
        { threshold: 0.1 }
    )

    if (featuresRef.value) observer.observe(featuresRef.value)
    if (stepsRef.value) observer.observe(stepsRef.value)
    if (statsRef.value) observer.observe(statsRef.value)
})
</script>

<template>
    <div>
        <!-- Hero Section -->
        <section class="relative overflow-hidden min-h-[90vh] flex items-center">
            <HeroBackground />

            <UContainer class="max-w-7xl py-20 lg:py-32 relative z-10">
                <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <!-- Left: Copy -->
                    <div class="text-center lg:text-left">
                        <!-- Live badge -->
                        <div
                            class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6 fade-in-up"
                        >
                            <UIcon name="i-lucide-trending-up" class="w-4 h-4 text-green-500" />
                            <span class="text-sm font-medium text-green-600 dark:text-green-400"
                                >Орлогоо 40% нэмэгдүүл</span
                            >
                        </div>

                        <h1
                            class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 fade-in-up fade-in-up-delay-1"
                        >
                            <span class="text-gray-900 dark:text-white">Цаг хэмнэ.</span>
                            <br >
                            <span class="text-gradient">Орлого нэмэгдүүл.</span>
                        </h1>

                        <p
                            class="text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 fade-in-up fade-in-up-delay-2"
                        >
                            Live коммент захиалгыг автоматаар хүлээн авч, өдөрт
                            <strong class="text-gray-900 dark:text-white">3+ цаг хэмнээрэй</strong>.
                            Алдагдсан захиалга байхгүй = илүү их орлого.
                        </p>

                        <div
                            class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start fade-in-up fade-in-up-delay-3"
                        >
                            <UButton
                                to="/login?mode=register"
                                size="xl"
                                class="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 btn-shine"
                            >
                                <span>Үнэгүй эхлэх</span>
                                <UIcon name="i-lucide-arrow-right" class="w-5 h-5 ml-2" />
                            </UButton>
                            <UButton
                                to="#demo"
                                size="xl"
                                color="neutral"
                                variant="outline"
                                class="group"
                            >
                                <UIcon
                                    name="i-lucide-play"
                                    class="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                                />
                                <span>Демо үзэх</span>
                            </UButton>
                        </div>

                        <!-- Trust badges -->
                        <div
                            class="flex flex-wrap gap-4 justify-center lg:justify-start mt-10 fade-in-up fade-in-up-delay-4"
                        >
                            <div class="trust-badge">
                                <UIcon
                                    name="i-lucide-shield-check"
                                    class="w-4 h-4 text-green-500"
                                />
                                <span>Аюулгүй төлбөр</span>
                            </div>
                            <div class="trust-badge">
                                <UIcon name="i-lucide-clock" class="w-4 h-4 text-primary-500" />
                                <span>30 хоног үнэгүй</span>
                            </div>
                            <div class="trust-badge">
                                <UIcon
                                    name="i-lucide-credit-card"
                                    class="w-4 h-4 text-violet-500"
                                />
                                <span>Карт шаардлагагүй</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Product mockup -->
                    <div class="relative fade-in-up fade-in-up-delay-2">
                        <div class="relative">
                            <!-- Glow effect behind mockup -->
                            <div
                                class="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-blue-500/20 to-indigo-500/20 blur-3xl rounded-3xl"
                            />

                            <!-- Dashboard mockup card -->
                            <div class="relative glass-card rounded-2xl p-2 shadow-2xl">
                                <div class="bg-gray-900 rounded-xl overflow-hidden">
                                    <!-- Browser chrome -->
                                    <div
                                        class="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700"
                                    >
                                        <div class="flex gap-1.5">
                                            <div class="w-3 h-3 rounded-full bg-red-500" />
                                            <div class="w-3 h-3 rounded-full bg-yellow-500" />
                                            <div class="w-3 h-3 rounded-full bg-green-500" />
                                        </div>
                                        <div class="flex-1 mx-4">
                                            <div
                                                class="bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 text-center"
                                            >
                                                codify.mn
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Dashboard preview -->
                                    <div class="p-4 space-y-4">
                                        <!-- Stats row -->
                                        <div class="grid grid-cols-3 gap-3">
                                            <div class="bg-gray-800 rounded-lg p-3">
                                                <div class="text-xs text-gray-500 mb-1">
                                                    Өнөөдөр
                                                </div>
                                                <div class="text-lg font-bold text-white">
                                                    ₮2.4M
                                                </div>
                                                <div class="text-xs text-green-400">+12%</div>
                                            </div>
                                            <div class="bg-gray-800 rounded-lg p-3">
                                                <div class="text-xs text-gray-500 mb-1">
                                                    Захиалга
                                                </div>
                                                <div class="text-lg font-bold text-white">156</div>
                                                <div class="text-xs text-green-400">+8%</div>
                                            </div>
                                            <div class="bg-gray-800 rounded-lg p-3">
                                                <div class="text-xs text-gray-500 mb-1">
                                                    Live үзэгч
                                                </div>
                                                <div
                                                    class="text-lg font-bold text-primary-400 live-indicator pl-4"
                                                >
                                                    847
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Orders list preview -->
                                        <div class="bg-gray-800 rounded-lg p-3">
                                            <div class="flex items-center justify-between mb-3">
                                                <span class="text-sm font-medium text-white"
                                                    >Сүүлийн захиалгууд</span
                                                >
                                                <span class="text-xs text-primary-400"
                                                    >Бүгдийг харах</span
                                                >
                                            </div>
                                            <div class="space-y-2">
                                                <div
                                                    class="flex items-center justify-between py-2 border-b border-gray-700"
                                                >
                                                    <div class="flex items-center gap-2">
                                                        <div
                                                            class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600"
                                                        />
                                                        <div>
                                                            <div class="text-sm text-white">
                                                                Болормаа Д.
                                                            </div>
                                                            <div class="text-xs text-gray-500">
                                                                2 бараа
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="text-sm font-medium text-white">
                                                        ₮45,000
                                                    </div>
                                                </div>
                                                <div class="flex items-center justify-between py-2">
                                                    <div class="flex items-center gap-2">
                                                        <div
                                                            class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500"
                                                        />
                                                        <div>
                                                            <div class="text-sm text-white">
                                                                Батболд Э.
                                                            </div>
                                                            <div class="text-xs text-gray-500">
                                                                1 бараа
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="text-sm font-medium text-white">
                                                        ₮28,000
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Floating notification cards -->
                            <div class="absolute -right-4 top-20 float-delay-1 hidden lg:block">
                                <div
                                    class="glass-card rounded-xl p-3 shadow-lg flex items-center gap-3 max-w-[200px]"
                                >
                                    <div
                                        class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"
                                    >
                                        <UIcon
                                            name="i-lucide-check"
                                            class="w-5 h-5 text-green-500"
                                        />
                                    </div>
                                    <div>
                                        <div
                                            class="text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Шинэ захиалга!
                                        </div>
                                        <div class="text-xs text-gray-500">₮45,000 - Болормаа</div>
                                    </div>
                                </div>
                            </div>

                            <div class="absolute -left-4 bottom-20 float hidden lg:block">
                                <div class="glass-card rounded-xl p-3 shadow-lg">
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center"
                                        >
                                            <UIcon
                                                name="i-lucide-trending-up"
                                                class="w-4 h-4 text-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <div class="text-xs text-gray-500">Өнөөдрийн өсөлт</div>
                                            <div class="text-lg font-bold text-green-500">+24%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Stats Section - Business Impact -->
        <section
            ref="statsRef"
            class="py-16 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-900 dark:to-gray-950"
        >
            <UContainer class="max-w-7xl">
                <div class="text-center mb-10">
                    <p class="text-gray-400 text-sm uppercase tracking-wider font-medium">
                        Бодит үр дүн
                    </p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    <div
                        v-for="(stat, index) in stats"
                        :key="stat.label"
                        class="text-center p-6 rounded-2xl bg-white/5 border border-white/10"
                        :class="{
                            'fade-in-up': statsVisible,
                            [`fade-in-up-delay-${index + 1}`]: statsVisible
                        }"
                    >
                        <div
                            class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center mx-auto mb-4"
                        >
                            <UIcon :name="stat.icon" class="w-6 h-6 text-primary-400" />
                        </div>
                        <div class="text-3xl md:text-4xl font-extrabold text-white mb-2">
                            {{ stat.value }}
                        </div>
                        <div class="text-sm text-gray-400">
                            {{ stat.label }}
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Pain Points Section -->
        <section class="py-20 bg-gray-50 dark:bg-gray-900/30">
            <UContainer class="max-w-7xl">
                <div class="text-center mb-12">
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Танил асуудлууд уу?
                    </h2>
                </div>
                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        v-for="pain in painPoints"
                        :key="pain.problem"
                        class="relative p-5 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800"
                    >
                        <div class="flex items-start gap-3">
                            <div class="flex-shrink-0">
                                <div
                                    class="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                                >
                                    <UIcon name="i-lucide-x" class="w-3 h-3 text-red-500" />
                                </div>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 line-through mb-2">
                                    {{ pain.problem }}
                                </p>
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                                    >
                                        <UIcon
                                            name="i-lucide-check"
                                            class="w-3 h-3 text-green-500"
                                        />
                                    </div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                                        {{ pain.solution }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Features Section - Business Benefits -->
        <section id="features" ref="featuresRef" class="py-24">
            <UContainer class="max-w-7xl">
                <div class="text-center mb-16">
                    <div
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
                    >
                        <UIcon name="i-lucide-rocket" class="w-4 h-4 text-primary-500" />
                        <span class="text-sm font-medium text-primary-600 dark:text-primary-400"
                            >Бизнесийн давуу тал</span
                        >
                    </div>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Яагаад Instasell?
                    </h2>
                    <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Цаг хэмнэж, орлогоо нэмэгдүүлэх бодит шийдэл
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div
                        v-for="(feature, index) in features"
                        :key="feature.title"
                        class="group relative p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 card-hover"
                        :class="{
                            'fade-in-up': featuresVisible,
                            [`fade-in-up-delay-${index + 1}`]: featuresVisible
                        }"
                    >
                        <!-- Stat badge -->
                        <div class="absolute -top-3 right-4">
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg"
                            >
                                {{ feature.stat }}
                            </span>
                        </div>

                        <div
                            class="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
                            :class="feature.color"
                        >
                            <UIcon :name="feature.icon" class="w-7 h-7 text-white" />
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {{ feature.title }}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {{ feature.description }}
                        </p>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- How It Works Section -->
        <section ref="stepsRef" class="py-24 bg-gray-50 dark:bg-gray-900/50">
            <UContainer class="max-w-7xl">
                <div class="text-center mb-16">
                    <div
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
                    >
                        <UIcon name="i-lucide-zap" class="w-4 h-4 text-violet-500" />
                        <span class="text-sm font-medium text-violet-600 dark:text-violet-400"
                            >Хурдан эхлэх</span
                        >
                    </div>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        5 минутад бэлэн болно
                    </h2>
                    <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Техникийн мэдлэг шаардлагагүй. Бүртгүүлээд шууд эхлээрэй.
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8 relative">
                    <!-- Connector line -->
                    <div
                        class="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary-500 via-primary-400 to-indigo-500 opacity-30"
                    />

                    <div
                        v-for="(step, index) in steps"
                        :key="step.step"
                        class="relative text-center"
                        :class="{
                            'fade-in-up': stepsVisible,
                            [`fade-in-up-delay-${index + 1}`]: stepsVisible
                        }"
                    >
                        <!-- Step number -->
                        <div class="relative inline-flex mb-6">
                            <div
                                class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25"
                            >
                                <UIcon :name="step.icon" class="w-8 h-8 text-white" />
                            </div>
                            <div
                                class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-gray-900 border-2 border-primary-500 flex items-center justify-center"
                            >
                                <span class="text-xs font-bold text-primary-500">{{
                                    step.step
                                }}</span>
                            </div>
                        </div>

                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {{ step.title }}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 max-w-xs mx-auto mb-3">
                            {{ step.description }}
                        </p>
                        <!-- Benefit tag -->
                        <span
                            class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        >
                            <UIcon name="i-lucide-check" class="w-3 h-3" />
                            {{ step.benefit }}
                        </span>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Testimonials Section -->
        <section class="py-24">
            <UContainer class="max-w-7xl">
                <div class="text-center mb-16">
                    <div
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6"
                    >
                        <UIcon name="i-lucide-users" class="w-4 h-4 text-indigo-500" />
                        <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400"
                            >Амжилтын түүхүүд</span
                        >
                    </div>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Бодит үр дүн гаргасан худалдаачид
                    </h2>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Тэд яаж цаг хэмнэж, орлогоо нэмэгдүүлсэн бэ?
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-6">
                    <div
                        v-for="testimonial in testimonials"
                        :key="testimonial.author"
                        class="p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 card-hover"
                    >
                        <!-- Metric highlight -->
                        <div class="mb-4">
                            <span
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-primary-500/10 to-indigo-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20"
                            >
                                <UIcon name="i-lucide-trending-up" class="w-4 h-4" />
                                {{ testimonial.metric }}
                            </span>
                        </div>

                        <div class="testimonial-card">
                            <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                "{{ testimonial.quote }}"
                            </p>
                        </div>
                        <div class="flex items-center gap-3">
                            <img
                                :src="testimonial.avatar"
                                :alt="testimonial.author"
                                class="w-12 h-12 rounded-full bg-gray-100"
                            >
                            <div>
                                <div class="font-semibold text-gray-900 dark:text-white">
                                    {{ testimonial.author }}
                                </div>
                                <div class="text-sm text-gray-500">
                                    {{ testimonial.role }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- CTA Section -->
        <section class="py-24">
            <UContainer class="max-w-7xl">
                <div class="relative rounded-3xl overflow-hidden">
                    <!-- Animated gradient background -->
                    <div class="absolute inset-0 bg-gradient-animated opacity-90" />

                    <!-- Content -->
                    <div class="relative px-8 py-16 md:px-16 md:py-24 text-center">
                        <!-- Value props -->
                        <div class="flex flex-wrap justify-center gap-4 mb-8">
                            <div
                                class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-sm"
                            >
                                <UIcon name="i-lucide-clock" class="w-4 h-4" />
                                <span>3+ цаг хэмнэ</span>
                            </div>
                            <div
                                class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-sm"
                            >
                                <UIcon name="i-lucide-trending-up" class="w-4 h-4" />
                                <span>+40% орлого</span>
                            </div>
                            <div
                                class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-sm"
                            >
                                <UIcon name="i-lucide-shield-check" class="w-4 h-4" />
                                <span>0 алдагдсан захиалга</span>
                            </div>
                        </div>

                        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Цаг хэмнэж, орлогоо нэмэгдүүлэхэд бэлэн үү?
                        </h2>
                        <p class="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                            14 хоногийн үнэгүй туршилт. Карт шаардлагагүй.
                            <br >
                            5 минутад бүртгүүлж, шууд эхлээрэй.
                        </p>

                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <UButton
                                to="/login?mode=register"
                                size="xl"
                                class="bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-xl font-semibold"
                            >
                                <span>Үнэгүй эхлэх</span>
                                <UIcon name="i-lucide-arrow-right" class="w-5 h-5 ml-2" />
                            </UButton>
                            <UButton
                                to="/pricing"
                                size="xl"
                                variant="outline"
                                class="border-white/30 text-white hover:bg-white/10"
                            >
                                Үнийн мэдээлэл
                            </UButton>
                        </div>

                        <p class="text-white/60 text-sm mt-6">
                            Хүссэн үедээ цуцлах боломжтой. Төлбөрийн үүрэг байхгүй.
                        </p>

                        <!-- Floating shapes -->
                        <div
                            class="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 float"
                        />
                        <div
                            class="absolute bottom-10 right-10 w-16 h-16 rounded-2xl bg-white/10 float-delay-1 rotate-12"
                        />
                        <div
                            class="absolute top-1/2 right-20 w-12 h-12 rounded-xl bg-white/10 float-delay-2 -rotate-6"
                        />
                    </div>
                </div>
            </UContainer>
        </section>
    </div>
</template>
