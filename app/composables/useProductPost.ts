export interface PostToFacebookInput {
    template: string
    bg_color: string
    caption: string
    watch_comments: boolean
    comment_mode?: 'all' | 'keywords'
    purpose?: string
    mode?: string
    background?: string
    ai_image_url?: string
}

export interface PostToFacebookResponse {
    post_id: string
    image_url: string
}

export interface GenerateCaptionResponse {
    caption: string
}

export interface GenerateAIImageResponse {
    url: string
}

export function useProductPost() {
    const config = useRuntimeConfig()
    const apiUrl = config.public.apiUrl

    const getPreviewImageUrl = (productId: number, template: string, bgColor: string, background?: string): string => {
        const encodedColor = encodeURIComponent(bgColor)
        let url = `${apiUrl}/api/products/${productId}/generate-image?template=${template}&bg_color=${encodedColor}`
        if (background) {
            url += `&background=${encodeURIComponent(background)}`
        }
        return url
    }

    const generateCaption = async (productId: number, customPrompt?: string, purpose?: string): Promise<string> => {
        const body: Record<string, string> = {}
        if (customPrompt) {
            body.custom_prompt = customPrompt
        }
        if (purpose) {
            body.purpose = purpose
        }

        const response = await $fetch<GenerateCaptionResponse>(
            `${apiUrl}/api/products/${productId}/generate-description`,
            {
                method: 'POST',
                credentials: 'include',
                body
            }
        )
        return response.caption
    }

    const generateCaptionStream = async (
        productId: number,
        onChunk: (accumulatedText: string) => void,
        customPrompt?: string,
        purpose?: string
    ): Promise<void> => {
        const body: Record<string, string> = {}
        if (customPrompt) {
            body.custom_prompt = customPrompt
        }
        if (purpose) {
            body.purpose = purpose
        }

        const response = await fetch(
            `${apiUrl}/api/products/${productId}/stream-description`,
            {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        )

        if (!response.ok) {
            throw new Error(`Stream request failed: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('ReadableStream not supported')
        }

        const decoder = new TextDecoder()
        let accumulated = ''
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const data = line.slice(6)

                    if (data === '[DONE]') return

                    try {
                        const parsed = JSON.parse(data)
                        if (parsed.error) {
                            throw new Error(parsed.error)
                        }
                        if (parsed.content) {
                            accumulated += parsed.content
                            onChunk(accumulated)
                        }
                    } catch (e) {
                        if (e instanceof SyntaxError) continue
                        throw e
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }

    const generateAIImage = async (productId: number, purpose?: string, background?: string): Promise<string> => {
        const body: Record<string, string> = {}
        if (purpose) {
            body.purpose = purpose
        }
        if (background) {
            body.background = background
        }

        const response = await $fetch<GenerateAIImageResponse>(
            `${apiUrl}/api/products/${productId}/generate-ai-image`,
            {
                method: 'POST',
                credentials: 'include',
                body
            }
        )
        return response.url
    }

    const postToFacebook = async (
        productId: number,
        data: PostToFacebookInput
    ): Promise<PostToFacebookResponse> => {
        return await $fetch<PostToFacebookResponse>(
            `${apiUrl}/api/products/${productId}/post-facebook`,
            {
                method: 'POST',
                credentials: 'include',
                body: data
            }
        )
    }

    return {
        getPreviewImageUrl,
        generateCaption,
        generateCaptionStream,
        generateAIImage,
        postToFacebook
    }
}
