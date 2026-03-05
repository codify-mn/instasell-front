<template>
    <svg
        width="48"
        height="60"
        viewBox="0 0 72 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="rounded"
    >
        <rect width="72" height="90" rx="4" fill="#F9FAFB" class="dark:fill-gray-800" />
        <pattern id="dots-c" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="#E5E7EB" />
        </pattern>
        <rect width="72" height="90" rx="4" fill="url(#dots-c)" />
        <circle cx="36" cy="14" r="6" fill="#E0E7EF" stroke="#CBD5E1" stroke-width="1" />
        <line x1="16" y1="24" x2="56" y2="24" stroke="#E5E7EB" stroke-width="0.75" />
        <rect x="18" y="28" width="36" height="32" rx="3" fill="#E0E7EF" filter="url(#shadow-c)" />
        <defs>
            <filter id="shadow-c" x="14" y="26" width="44" height="40" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.12" />
            </filter>
        </defs>
        <rect x="20" y="66" width="28" height="3" rx="1.5" fill="#94A3B8" />
        <rect x="20" y="73" width="18" height="3" rx="1.5" fill="#0EA5E9" />
    </svg>
</template>
