// Helper function to format date — YYYY/MM/DD HH:mm
export const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    const dt = new Date(dateString)
    if (isNaN(dt.getTime())) return '-'
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    const h = String(dt.getHours()).padStart(2, '0')
    const min = String(dt.getMinutes()).padStart(2, '0')
    return `${y}/${m}/${d} ${h}:${min}`
}

// Format date only — YYYY/MM/DD (no time)
export const formatDateShort = (dateString?: string): string => {
    if (!dateString) return '-'
    const dt = new Date(dateString)
    if (isNaN(dt.getTime())) return '-'
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}/${m}/${d}`
}

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string = 'MNT') => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency === 'MNT' ? 'MNT' : 'USD',
        minimumFractionDigits: currency === 'MNT' ? 0 : 2
    })
    return formatter.format(amount)
}
