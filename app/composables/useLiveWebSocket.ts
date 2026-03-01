export interface LiveComment {
    id: number
    sender_name: string
    sender_id: string
    text: string
    created_at: string
}

export interface LiveStatsData {
    viewers: number
    orders: number
    revenue: number
    comments: number
}

interface WSMessage {
    type: 'initial' | 'comment' | 'stats' | 'active_product' | 'ping'
    data: any
}

export function useLiveWebSocket(liveSaleId: Ref<number | undefined>) {
    const config = useRuntimeConfig()
    const comments = ref<LiveComment[]>([])
    const stats = ref<LiveStatsData>({ viewers: 0, orders: 0, revenue: 0, comments: 0 })
    const activeProductId = ref<number | null>(null)
    const connected = ref(false)

    let ws: WebSocket | null = null
    let retryCount = 0
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    const MAX_RETRIES = 5

    function getWsUrl(id: number): string {
        const apiUrl = config.public.apiUrl as string
        const wsUrl = apiUrl.replace(/^http/, 'ws')
        return `${wsUrl}/api/live-sales/${id}/ws`
    }

    function connect() {
        const id = liveSaleId.value
        if (!id || ws) return

        const url = getWsUrl(id)
        ws = new WebSocket(url)

        ws.onopen = () => {
            connected.value = true
            retryCount = 0
        }

        ws.onmessage = (event) => {
            try {
                const msg: WSMessage = JSON.parse(event.data)

                switch (msg.type) {
                    case 'initial':
                        if (msg.data.comments) {
                            comments.value = msg.data.comments
                        }
                        if (msg.data.stats) {
                            stats.value = msg.data.stats
                        }
                        if (msg.data.active_product_id !== undefined) {
                            activeProductId.value = msg.data.active_product_id
                        }
                        break
                    case 'comment':
                        comments.value = [msg.data, ...comments.value]
                        break
                    case 'stats':
                        stats.value = msg.data
                        break
                    case 'active_product':
                        activeProductId.value = msg.data.product_id ?? null
                        break
                    case 'ping':
                        ws?.send(JSON.stringify({ type: 'pong' }))
                        break
                }
            }
            catch (e) {
                console.error('Failed to parse WS message:', e)
            }
        }

        ws.onclose = () => {
            connected.value = false
            ws = null
            maybeReconnect()
        }

        ws.onerror = () => {
            // onclose will be called after onerror
        }
    }

    function disconnect() {
        if (retryTimeout) {
            clearTimeout(retryTimeout)
            retryTimeout = null
        }
        retryCount = MAX_RETRIES // prevent reconnect
        if (ws) {
            ws.close()
            ws = null
        }
        connected.value = false
    }

    function maybeReconnect() {
        if (retryCount >= MAX_RETRIES) return
        if (!liveSaleId.value) return

        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)
        retryCount++
        retryTimeout = setTimeout(() => {
            retryTimeout = null
            connect()
        }, delay)
    }

    watch(liveSaleId, (newId, oldId) => {
        if (oldId && ws) {
            disconnect()
            retryCount = 0
        }
        if (newId) {
            retryCount = 0
            connect()
        }
    }, { immediate: true })

    onUnmounted(() => {
        disconnect()
    })

    return { comments, stats, activeProductId, connected }
}
