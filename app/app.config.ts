export default defineAppConfig({
    ui: {
        colors: {
            primary: 'primary',
            neutral: 'zinc'
        },
        input: {
            slots: {
                root: 'w-full',
                base: [
                    'rounded-lg',
                    'bg-[#F4F7F5] dark:bg-gray-800/50',
                    'border border-[#E1E8E5] dark:border-gray-700/40',
                    'placeholder:text-[#5A7178] dark:placeholder:text-gray-500',
                    'focus:bg-white dark:focus:bg-gray-800',
                    'focus:border-primary-500 dark:focus:border-primary-400',
                    'focus:ring-2 focus:ring-primary-500/20',
                    'transition-all duration-200'
                ]
            }
        },
        select: {
            slots: {
                base: [
                    'rounded-lg',
                    'bg-[#F4F7F5] dark:bg-gray-800/50',
                    'border border-[#E1E8E5] dark:border-gray-700/40',
                    'focus:bg-white dark:focus:bg-gray-800',
                    'focus:border-primary-500 dark:focus:border-primary-400',
                    'focus:ring-2 focus:ring-primary-500/20',
                    'transition-all duration-200'
                ]
            }
        },
        textarea: {
            slots: {
                base: [
                    'rounded-lg',
                    'bg-[#F4F7F5] dark:bg-gray-800/50',
                    'border border-[#E1E8E5] dark:border-gray-700/40',
                    'placeholder:text-[#5A7178] dark:placeholder:text-gray-500',
                    'focus:bg-white dark:focus:bg-gray-800',
                    'focus:border-primary-500 dark:focus:border-primary-400',
                    'focus:ring-2 focus:ring-primary-500/20',
                    'transition-all duration-200'
                ]
            }
        },
        card: {
            slots: {
                root: [
                    'rounded-xl',
                    'bg-white dark:bg-gray-900',
                    'border border-[#E1E8E5] dark:border-gray-800',
                    'shadow-sm',
                    'transition-shadow duration-200',
                    'hover:shadow-md'
                ],
                header: 'px-6 py-4 border-b border-[#E1E8E5] dark:border-gray-800',
                body: 'px-6 py-5',
                footer: 'px-6 py-4 border-t border-[#E1E8E5] dark:border-gray-800'
            }
        },
        button: {
            defaultVariants: {
                color: 'primary'
            },
            slots: {
                base: ['font-semibold', 'rounded-lg', 'transition-all duration-200', 'active:scale-[0.98]']
            }
        },
        badge: {
            slots: {
                base: ['font-medium', 'rounded-md']
            }
        },
        table: {
            slots: {
                thead: 'bg-[#F4F7F5] dark:bg-gray-900/50',
                th: 'px-4 py-3 text-xs font-semibold text-[#5A7178] dark:text-gray-400 uppercase tracking-wide',
                tbody: 'divide-y divide-[#E1E8E5] dark:divide-gray-800',
                td: 'px-4 py-3.5 text-sm',
                tr: 'hover:bg-[#F4F7F5]/60 dark:hover:bg-gray-800/40 transition-colors'
            }
        }
    }
})
