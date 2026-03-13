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
                    'bg-[var(--surface-inset)]',
                    'border border-[var(--border-primary)]',
                    'placeholder:text-[var(--text-muted)]',
                    'focus:bg-[var(--surface-card)]',
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
                    'bg-[var(--surface-inset)]',
                    'border border-[var(--border-primary)]',
                    'focus:bg-[var(--surface-card)]',
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
                    'bg-[var(--surface-inset)]',
                    'border border-[var(--border-primary)]',
                    'placeholder:text-[var(--text-muted)]',
                    'focus:bg-[var(--surface-card)]',
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
                    'bg-[var(--surface-card)]',
                    'border border-[var(--border-primary)]',
                    'shadow-sm',
                    'transition-shadow duration-200',
                    'hover:shadow-md'
                ],
                header: 'px-6 py-4 border-b border-[var(--border-primary)]',
                body: 'px-6 py-5',
                footer: 'px-6 py-4 border-t border-[var(--border-primary)]'
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
                thead: 'bg-[var(--surface-inset)]',
                th: 'px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide',
                tbody: 'divide-y divide-[var(--border-primary)]',
                td: 'px-4 py-3.5 text-sm',
                tr: 'hover:bg-[var(--surface-inset)]/60 transition-colors'
            }
        }
    }
})
