<script setup lang="ts">
// Animated hero background with floating shapes and gradient orbs
</script>

<template>
    <div class="absolute inset-0 -z-10 overflow-hidden">
        <!-- Base gradient -->
        <div
            class="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-950/30"
        />

        <!-- Animated gradient orbs -->
        <div
            class="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl float-slow pulse-glow"
            style="
                background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
            "
        />
        <div
            class="absolute top-20 right-1/4 translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl float-delay-1 pulse-glow"
            style="
                background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
            "
        />
        <div
            class="absolute top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl float-delay-2 pulse-glow"
            style="background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)"
        />

        <!-- Floating decorative shapes -->
        <div class="absolute top-32 left-[10%] float opacity-60">
            <div
                class="w-16 h-16 rounded-2xl rotate-12 bg-gradient-to-br from-primary-400/20 to-primary-500/10 backdrop-blur-sm border border-primary-300/20"
            />
        </div>
        <div class="absolute top-48 right-[15%] float-delay-1 opacity-50">
            <div
                class="w-12 h-12 rounded-xl -rotate-6 bg-gradient-to-br from-blue-400/20 to-blue-500/10 backdrop-blur-sm border border-blue-300/20"
            />
        </div>
        <div class="absolute top-64 left-[20%] float-delay-2 opacity-40">
            <div
                class="w-8 h-8 rounded-lg rotate-45 bg-gradient-to-br from-violet-400/20 to-violet-500/10 backdrop-blur-sm border border-violet-300/20"
            />
        </div>
        <div class="absolute top-80 right-[25%] float opacity-50">
            <div
                class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400/15 to-indigo-500/10 backdrop-blur-sm border border-primary-300/20"
            />
        </div>

        <!-- Grid pattern overlay (subtle) -->
        <div
            class="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
            style="
                background-image:
                    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
                background-size: 60px 60px;
            "
        />
    </div>
</template>
