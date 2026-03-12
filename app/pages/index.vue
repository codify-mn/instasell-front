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
        title: 'Автомат захиалга',
        description:
            'Live коммент дээрх захиалгыг AI автоматаар уншиж, алдаагүй бүртгэнэ. Гараар бичих шаардлагагүй.',
        icon: 'i-lucide-bot',
        stat: '0 алдаа'
    },
    {
        title: 'Цаг хэмнэнэ',
        description:
            'Захиалга боловсруулах, мессеж илгээх, тооцоо хийх бүгд автомат. Өдөрт 3+ цаг хэмнээрэй.',
        icon: 'i-lucide-clock',
        stat: '3+ цаг/өдөр'
    },
    {
        title: 'Борлуулалт өснө',
        description:
            'Хурдан хариу = илүү их захиалга. Бүх коммент захиалгыг алдахгүй хүлээн авна.',
        icon: 'i-lucide-trending-up',
        stat: '+40% орлого'
    },
    {
        title: 'Нэг систем',
        description: 'Бараа, захиалга, харилцагч, төлбөр, тайлан — бүгд нэг дашбоард дотор.',
        icon: 'i-lucide-layout-dashboard',
        stat: 'Бүгд нэг дор'
    }
]

const stats = [
    { value: '3+', unit: 'цаг', label: 'Өдөр бүр хэмнэнэ' },
    { value: '40', unit: '%', label: 'Орлого нэмэгдэнэ' },
    { value: '0', unit: '', label: 'Алдагдсан захиалга' },
    { value: '<1', unit: 'сек', label: 'Захиалга боловсруулалт' }
]

const steps = [
    {
        step: '01',
        title: 'Бүртгүүлэх',
        description: 'Үнэгүй бүртгүүлж, дэлгүүрээ 2 минутад нээгээрэй.',
        icon: 'i-lucide-user-plus'
    },
    {
        step: '02',
        title: 'Бараа нэмэх',
        description: 'Барааны мэдээлэл оруулж каталог бүрдүүлээрэй. Excel импорт боломжтой.',
        icon: 'i-lucide-package-plus'
    },
    {
        step: '03',
        title: 'Live эхлэх',
        description: 'Facebook холбоод Live эхлүүлээрэй. Захиалга автомат ирнэ.',
        icon: 'i-lucide-radio'
    }
]

const testimonials = [
    {
        quote: 'Өмнө нь захиалга бүртгэхэд л 4 цаг зарцуулдаг байсан. Одоо бүгд автомат болсон.',
        author: 'Б. Сарангэрэл',
        role: 'Гоо сайхны дэлгүүр',
        metric: '4 цаг хэмнэнэ'
    },
    {
        quote: 'Live үед захиалга алдаж байсан асуудал арилсан. Борлуулалт 50%-иар өссөн.',
        author: 'Д. Болормаа',
        role: 'Хувцасны брэнд',
        metric: '+50% борлуулалт'
    },
    {
        quote: 'Excel, Messenger хооронд гүйхээ больсон. Бүх захиалга нэг дороос харагдана.',
        author: 'Э. Мөнхбат',
        role: 'Электроникийн худалдаа',
        metric: '100% автомат'
    }
]

const painPoints = [
    { problem: 'Коммент захиалга алддаг', solution: 'Бүх коммент автомат уншина' },
    { problem: 'Гараар бичиж амжихгүй', solution: 'Захиалга автомат бүртгэнэ' },
    { problem: 'Алдаа гаргадаг', solution: '0 алдаатай автомат систем' },
    { problem: 'Бүртгэлд цаг алдана', solution: 'Өдөрт 3+ цаг хэмнэнэ' }
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
                <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <!-- Left: Copy -->
                    <div class="text-center lg:text-left">
                        <div
                            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] dark:bg-green-900/20 dark:border-green-800/40 mb-8 fade-in-up"
                        >
                            <span class="relative flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                            </span>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Live худалдааны #1 платформ</span>
                        </div>

                        <h1
                            class="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] mb-6 fade-in-up fade-in-up-delay-1"
                        >
                            <span class="text-gray-900 dark:text-white">Facebook Live</span>
                            <br>
                            <span class="text-gray-900 dark:text-white">захиалгыг </span>
                            <span class="text-gradient">автоматжуул</span>
                        </h1>

                        <p
                            class="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed fade-in-up fade-in-up-delay-2"
                        >
                            Коммент дээрх захиалгыг автоматаар хүлээн авч, өдөрт
                            <strong class="text-gray-900 dark:text-white font-semibold">3+ цаг хэмнээрэй</strong>.
                            Ганц ч захиалга алдахгүй.
                        </p>

                        <div
                            class="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start fade-in-up fade-in-up-delay-3"
                        >
                            <UButton
                                to="/login?mode=register"
                                size="xl"
                                class="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 btn-shine"
                            >
                                <span>Үнэгүй эхлэх</span>
                                <UIcon name="i-lucide-arrow-right" class="w-5 h-5 ml-1" />
                            </UButton>
                            <UButton
                                to="#demo"
                                size="xl"
                                color="neutral"
                                variant="ghost"
                                class="group"
                            >
                                <UIcon
                                    name="i-lucide-play"
                                    class="w-5 h-5 mr-1.5 group-hover:scale-110 transition-transform"
                                />
                                <span>Демо үзэх</span>
                            </UButton>
                        </div>

                        <!-- Trust signals -->
                        <div
                            class="flex flex-wrap gap-6 justify-center lg:justify-start mt-10 text-sm text-gray-400 fade-in-up fade-in-up-delay-4"
                        >
                            <div class="flex items-center gap-1.5">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-green-500" />
                                <span>Үнэгүй туршилт</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-green-500" />
                                <span>Карт шаардлагагүй</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-green-500" />
                                <span>5 минутад бэлэн</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Product mockup -->
                    <div class="relative fade-in-up fade-in-up-delay-2 hidden lg:block">
                        <div class="relative">
                            <!-- Glow effect -->
                            <div
                                class="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-blue-500/15 to-indigo-500/20 blur-3xl rounded-3xl"
                            />

                            <!-- Dashboard mockup -->
                            <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                                <div class="bg-gray-900">
                                    <!-- Browser chrome -->
                                    <div class="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700/50">
                                        <div class="flex gap-1.5">
                                            <div class="w-3 h-3 rounded-full bg-red-500/80" />
                                            <div class="w-3 h-3 rounded-full bg-yellow-500/80" />
                                            <div class="w-3 h-3 rounded-full bg-green-500/80" />
                                        </div>
                                        <div class="flex-1 mx-8">
                                            <div class="bg-gray-700/60 rounded-lg px-3 py-1.5 text-xs text-gray-400 text-center max-w-xs mx-auto">
                                                instasell.codify.mn/dashboard
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Dashboard content -->
                                    <div class="p-5 space-y-4">
                                        <!-- Stats row -->
                                        <div class="grid grid-cols-3 gap-3">
                                            <div class="bg-gray-800/60 rounded-xl p-3.5">
                                                <div class="text-[11px] text-gray-500 mb-1">Өнөөдөр</div>
                                                <div class="text-xl font-bold text-white">₮2.4M</div>
                                                <div class="text-xs text-green-400 mt-0.5">+12%</div>
                                            </div>
                                            <div class="bg-gray-800/60 rounded-xl p-3.5">
                                                <div class="text-[11px] text-gray-500 mb-1">Захиалга</div>
                                                <div class="text-xl font-bold text-white">156</div>
                                                <div class="text-xs text-green-400 mt-0.5">+8%</div>
                                            </div>
                                            <div class="bg-gray-800/60 rounded-xl p-3.5">
                                                <div class="text-[11px] text-gray-500 mb-1">Live үзэгч</div>
                                                <div class="text-xl font-bold text-primary-400 live-indicator pl-4 mt-0.5">847</div>
                                            </div>
                                        </div>

                                        <!-- Orders list -->
                                        <div class="bg-gray-800/60 rounded-xl p-4">
                                            <div class="flex items-center justify-between mb-3">
                                                <span class="text-sm font-medium text-white">Сүүлийн захиалгууд</span>
                                                <span class="text-xs text-primary-400">Бүгдийг харах</span>
                                            </div>
                                            <div class="space-y-2.5">
                                                <div class="flex items-center justify-between py-2 border-b border-gray-700/50">
                                                    <div class="flex items-center gap-2.5">
                                                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white">БД</div>
                                                        <div>
                                                            <div class="text-sm text-white">Болормаа Д.</div>
                                                            <div class="text-[11px] text-gray-500">2 бараа · Live коммент</div>
                                                        </div>
                                                    </div>
                                                    <div class="text-sm font-semibold text-white">₮45,000</div>
                                                </div>
                                                <div class="flex items-center justify-between py-2">
                                                    <div class="flex items-center gap-2.5">
                                                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">БЭ</div>
                                                        <div>
                                                            <div class="text-sm text-white">Батболд Э.</div>
                                                            <div class="text-[11px] text-gray-500">1 бараа · Live коммент</div>
                                                        </div>
                                                    </div>
                                                    <div class="text-sm font-semibold text-white">₮28,000</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Floating cards -->
                            <div class="absolute -right-6 top-16 float-delay-1">
                                <div class="glass-card rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                                        <UIcon name="i-lucide-check" class="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Шинэ захиалга!</div>
                                        <div class="text-xs text-gray-500">₮45,000 · Болормаа</div>
                                    </div>
                                </div>
                            </div>

                            <div class="absolute -left-6 bottom-24 float">
                                <div class="glass-card rounded-xl px-4 py-3 shadow-lg">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-9 h-9 rounded-full bg-primary-500/15 flex items-center justify-center flex-shrink-0">
                                            <UIcon name="i-lucide-trending-up" class="w-4 h-4 text-primary-500" />
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

        <!-- Stats bar -->
        <section
            ref="statsRef"
            class="relative py-16 stats-section-bg"
        >
            <UContainer class="max-w-5xl">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div
                        v-for="(stat, index) in stats"
                        :key="stat.label"
                        class="text-center"
                        :class="{
                            'fade-in-up': statsVisible,
                            [`fade-in-up-delay-${index + 1}`]: statsVisible
                        }"
                    >
                        <div class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-1">
                            {{ stat.value }}<span class="text-[#16a34a] text-2xl md:text-3xl">{{ stat.unit }}</span>
                        </div>
                        <div class="text-sm text-[#64748b] dark:text-gray-400">
                            {{ stat.label }}
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Pain Points -->
        <section class="py-20 lg:py-24">
            <UContainer class="max-w-5xl">
                <div class="text-center mb-12">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Танил асуудлууд уу?
                    </h2>
                    <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                        Live худалдаачдын тулгардаг нийтлэг асуудлуудыг бид шийдсэн
                    </p>
                </div>
                <div class="grid sm:grid-cols-2 gap-4">
                    <div
                        v-for="pain in painPoints"
                        :key="pain.problem"
                        class="p-5 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:border-primary-200 dark:hover:border-primary-800/50"
                    >
                        <div class="flex items-center gap-3">
                            <div class="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                <UIcon name="i-lucide-x" class="w-3.5 h-3.5 text-red-500" />
                            </div>
                            <p class="text-sm text-gray-400 line-through">{{ pain.problem }}</p>
                        </div>
                        <div class="w-px h-3 bg-gray-200 dark:bg-gray-700 ml-3.5" />
                        <div class="flex items-center gap-3">
                            <div class="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <UIcon name="i-lucide-check" class="w-3.5 h-3.5 text-green-500" />
                            </div>
                            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ pain.solution }}</p>
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Features -->
        <section id="features" ref="featuresRef" class="py-20 lg:py-24 bg-[#f8fafc] dark:bg-gray-900/30">
            <UContainer class="max-w-7xl">
                <div class="text-center mb-14">
                    <p class="text-sm font-semibold text-primary-500 mb-3 tracking-wide uppercase">Боломжууд</p>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Яагаад Instasell?
                    </h2>
                    <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                        Цаг хэмнэж, орлогоо нэмэгдүүлэх бодит шийдэл
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div
                        v-for="(feature, index) in features"
                        :key="feature.title"
                        class="group relative p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10"
                        :class="{
                            'fade-in-up': featuresVisible,
                            [`fade-in-up-delay-${index + 1}`]: featuresVisible
                        }"
                    >
                        <div class="flex items-center justify-between mb-4">
                            <div
                                class="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary-500/15"
                            >
                                <UIcon :name="feature.icon" class="w-6 h-6 text-primary-500" />
                            </div>
                            <span class="text-xs font-bold text-primary-500 bg-primary-500/10 px-2.5 py-1 rounded-full">
                                {{ feature.stat }}
                            </span>
                        </div>
                        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">
                            {{ feature.title }}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {{ feature.description }}
                        </p>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Multi-stream -->
        <section class="py-20 lg:py-24">
            <UContainer class="max-w-6xl">
                <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <!-- Left: Illustration -->
                    <div class="flex justify-center">
                        <img
                            src="/streaming.svg"
                            alt="Олон платформд нэгэн зэрэг дамжуулах"
                            class="w-full max-w-lg"
                        >
                    </div>

                    <!-- Right: Copy -->
                    <div>
                        <p class="text-sm font-semibold text-primary-500 mb-3 tracking-wide uppercase">Мульти стриминг</p>
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Нэг дороос бүх платформд Live хийгээрэй
                        </h2>
                        <p class="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            Instasell-ээс Facebook, Instagram зэрэг олон платформд нэгэн зэрэг шууд дамжуулалт хийх боломжтой. Илүү олон үзэгчид хүрч, борлуулалтаа нэмэгдүүлээрэй.
                        </p>

                        <div class="space-y-4">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <UIcon name="i-lucide-radio" class="w-4 h-4 text-primary-500" />
                                </div>
                                <div>
                                    <p class="font-semibold text-sm text-gray-900 dark:text-white">Нэг товчоор бүгдэд Live</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Facebook, Instagram-д нэгэн зэрэг дамжуулна</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <UIcon name="i-lucide-layers" class="w-4 h-4 text-primary-500" />
                                </div>
                                <div>
                                    <p class="font-semibold text-sm text-gray-900 dark:text-white">Бараа мэдээлэл overlay</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Live дээр барааны нэр, үнэ автомат харагдана</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <UIcon name="i-lucide-message-square" class="w-4 h-4 text-primary-500" />
                                </div>
                                <div>
                                    <p class="font-semibold text-sm text-gray-900 dark:text-white">Коммент автомат уншина</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Бүх платформын коммент захиалгыг нэг дороос удирдана</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- How It Works -->
        <section ref="stepsRef" class="py-20 lg:py-24 bg-[#f8fafc] dark:bg-gray-900/30">
            <UContainer class="max-w-4xl">
                <div class="text-center mb-14">
                    <p class="text-sm font-semibold text-primary-500 mb-3 tracking-wide uppercase">Хэрхэн ажилладаг</p>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        3 алхамаар эхлээрэй
                    </h2>
                    <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                        Техникийн мэдлэг шаардлагагүй. 5 минутад бэлэн болно.
                    </p>
                </div>

                <div class="space-y-6">
                    <div
                        v-for="(step, index) in steps"
                        :key="step.step"
                        class="flex gap-6 items-start"
                        :class="{
                            'fade-in-up': stepsVisible,
                            [`fade-in-up-delay-${index + 1}`]: stepsVisible
                        }"
                    >
                        <!-- Step number -->
                        <div class="flex flex-col items-center flex-shrink-0">
                            <div
                                class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20"
                            >
                                <span class="text-sm font-bold text-white">{{ step.step }}</span>
                            </div>
                            <div v-if="index < steps.length - 1" class="w-px h-8 bg-gray-200 dark:bg-gray-700 mt-2" />
                        </div>

                        <!-- Content -->
                        <div class="pb-2 pt-1">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {{ step.title }}
                            </h3>
                            <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                {{ step.description }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="text-center mt-12">
                    <UButton
                        to="/login?mode=register"
                        size="xl"
                        class="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300"
                    >
                        <span>Одоо эхлэх</span>
                        <UIcon name="i-lucide-arrow-right" class="w-5 h-5 ml-1" />
                    </UButton>
                </div>
            </UContainer>
        </section>

        <!-- Testimonials -->
        <section class="py-20 lg:py-24 bg-[#f8fafc] dark:bg-gray-900/30">
            <UContainer class="max-w-7xl">
                <div class="text-center mb-14">
                    <p class="text-sm font-semibold text-primary-500 mb-3 tracking-wide uppercase">Сэтгэгдэл</p>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Худалдаачдын туршлага
                    </h2>
                </div>

                <div class="grid md:grid-cols-3 gap-6">
                    <div
                        v-for="testimonial in testimonials"
                        :key="testimonial.author"
                        class="p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800"
                    >
                        <div class="flex items-center gap-1 mb-4">
                            <UIcon v-for="n in 5" :key="n" name="i-lucide-star" class="w-4 h-4 text-amber-400 fill-amber-400" />
                        </div>

                        <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-sm">
                            "{{ testimonial.quote }}"
                        </p>

                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-semibold text-sm text-gray-900 dark:text-white">
                                    {{ testimonial.author }}
                                </div>
                                <div class="text-xs text-gray-500">
                                    {{ testimonial.role }}
                                </div>
                            </div>
                            <span class="text-xs font-semibold text-primary-500 bg-primary-500/10 px-2.5 py-1 rounded-full">
                                {{ testimonial.metric }}
                            </span>
                        </div>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- CTA -->
        <section class="py-20 lg:py-24">
            <UContainer class="max-w-4xl">
                <div class="relative rounded-3xl overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-animated" />

                    <div class="relative px-8 py-16 md:px-16 md:py-20 text-center">
                        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
                            Борлуулалтаа автоматжуулахад бэлэн үү?
                        </h2>
                        <p class="text-lg text-white/70 mb-10 max-w-xl mx-auto">
                            Үнэгүй туршилт. Карт шаардлагагүй. 5 минутад бэлэн.
                        </p>

                        <div class="flex flex-col sm:flex-row gap-3 justify-center">
                            <UButton
                                to="/login?mode=register"
                                size="xl"
                                class="bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-xl font-semibold"
                            >
                                <span>Үнэгүй эхлэх</span>
                                <UIcon name="i-lucide-arrow-right" class="w-5 h-5 ml-1" />
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
                    </div>
                </div>
            </UContainer>
        </section>
    </div>
</template>
