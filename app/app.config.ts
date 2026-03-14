export default defineAppConfig({
    ui: {
        colors: {
            primary: 'primary',
            neutral: 'neutral'
        },
        input: {
            slots: {
                root: 'w-full',
                base: [
                    'rounded-lg',
                    'bg-[var(--surface-card)]',
                    'border border-[var(--border-primary)]',
                    'placeholder:text-[var(--text-placeholder)]',
                    'focus:border-primary-600 dark:focus:border-primary-400',
                    'focus:ring-1 focus:ring-primary-600/20',
                    'transition-colors duration-150'
                ]
            }
        },
        select: {
            slots: {
                base: [
                    'rounded-lg',
                    'bg-[var(--surface-card)]',
                    'border border-[var(--border-primary)]',
                    'focus:border-primary-600 dark:focus:border-primary-400',
                    'focus:ring-1 focus:ring-primary-600/20',
                    'transition-colors duration-150'
                ]
            }
        },
        textarea: {
            slots: {
                base: [
                    'rounded-lg',
                    'bg-[var(--surface-card)]',
                    'border border-[var(--border-primary)]',
                    'placeholder:text-[var(--text-placeholder)]',
                    'focus:border-primary-600 dark:focus:border-primary-400',
                    'focus:ring-1 focus:ring-primary-600/20',
                    'transition-colors duration-150'
                ]
            }
        },
        card: {
            slots: {
                root: [
                    'rounded-xl',
                    'bg-[var(--surface-card)]',
                    'border border-[var(--border-primary)]',
                    'shadow-[var(--shadow-card)]',
                    'transition-shadow duration-150'
                ],
                header: 'px-5 py-4 border-b border-[var(--border-primary)]',
                body: 'px-5 py-4',
                footer: 'px-5 py-4 border-t border-[var(--border-primary)]'
            }
        },
        button: {
            defaultVariants: {
                color: 'primary'
            },
            slots: {
                base: ['font-medium', 'rounded-lg', 'transition-colors duration-150']
            }
        },
        badge: {
            slots: {
                base: ['font-medium', 'rounded-md']
            }
        },
        table: {
            slots: {
                thead: 'bg-[var(--surface-inset)]',
                th: 'px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide',
                tbody: 'divide-y divide-[var(--border-primary)]',
                td: 'px-4 py-3.5 text-sm',
                tr: 'hover:bg-[var(--surface-inset)]/50 transition-colors'
            }
        }
    }
})
