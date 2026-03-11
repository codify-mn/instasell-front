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
                    'bg-[#F7F7F8] dark:bg-[#2A2A2A]',
                    'border border-[#E3E3E3] dark:border-[#333333]',
                    'placeholder:text-[#8C9196] dark:placeholder:text-gray-500',
                    'focus:bg-white dark:focus:bg-[#303030]',
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
                    'bg-[#F7F7F8] dark:bg-[#2A2A2A]',
                    'border border-[#E3E3E3] dark:border-[#333333]',
                    'focus:bg-white dark:focus:bg-[#303030]',
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
                    'bg-[#F7F7F8] dark:bg-[#2A2A2A]',
                    'border border-[#E3E3E3] dark:border-[#333333]',
                    'placeholder:text-[#8C9196] dark:placeholder:text-gray-500',
                    'focus:bg-white dark:focus:bg-[#303030]',
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
                    'bg-white dark:bg-[#202020]',
                    'border border-[#E3E3E3] dark:border-[#333333]',
                    'shadow-sm',
                    'transition-shadow duration-200',
                    'hover:shadow-md'
                ],
                header: 'px-6 py-4 border-b border-[#E3E3E3] dark:border-[#333333]',
                body: 'px-6 py-5',
                footer: 'px-6 py-4 border-t border-[#E3E3E3] dark:border-[#333333]'
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
                thead: 'bg-[#F7F7F8] dark:bg-[#1A1A1A]',
                th: 'px-4 py-3 text-xs font-semibold text-[#6D7175] dark:text-gray-400 uppercase tracking-wide',
                tbody: 'divide-y divide-[#E3E3E3] dark:divide-[#333333]',
                td: 'px-4 py-3.5 text-sm',
                tr: 'hover:bg-[#F7F7F8]/60 dark:hover:bg-[#2A2A2A]/40 transition-colors'
            }
        }
    }
})
