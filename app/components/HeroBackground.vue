<script setup lang="ts">
// Green radial mesh hero background
</script>

<template>
    <div class="absolute inset-0 -z-10 overflow-hidden">
        <!-- Green radial mesh via CSS class -->
        <div class="hero-mesh-bg absolute inset-0" />

        <!-- Top-center green bloom -->
        <div
            class="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-125 rounded-full blur-3xl float-slow pulse-glow"
            style="background: radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%);"
        />

        <!-- Upper-right bloom -->
        <div
            class="absolute -top-10 right-0 w-125 h-112.5 rounded-full blur-3xl float-delay-1 pulse-glow"
            style="background: radial-gradient(ellipse, rgba(74,222,128,0.09) 0%, transparent 65%);"
        />

        <!-- Lower-left subtle bloom -->
        <div
            class="absolute bottom-0 left-0 w-100 h-87.5 rounded-full blur-3xl float-delay-2"
            style="background: radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 60%);"
        />

        <!-- Dot grid overlay -->
        <div
            class="absolute inset-0 opacity-[0.035] dark:opacity-[0.04]"
            style="
                background-image: radial-gradient(circle, rgba(0,0,0,0.35) 1px, transparent 1px);
                background-size: 28px 28px;
            "
        />
    </div>
</template>
