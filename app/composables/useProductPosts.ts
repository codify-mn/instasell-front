export interface ProductPostStats {
    id: number
    facebook_post_id: string
    watch_comments: boolean
    purpose: string
    caption: string
    image_url: string
    reactions_count: number
    comments_count: number
    views_count: number
    shares_count: number
    created_at: string
    page_name: string
    page_picture: string
}

export interface PostComment {
    id: number
    facebook_comment_id: string
    sender_id: string
    sender_name: string
    text: string
    is_processed: boolean
    created_at: string
}

export interface PostCommentsResponse {
    comments: PostComment[]
    total: number
}

export interface ProductPostsResponse {
    posts: ProductPostStats[]
}

export function useProductPosts() {
    const config = useRuntimeConfig()
    const apiUrl = config.public.apiUrl

    const fetchProductPosts = async (productId: number): Promise<ProductPostStats[]> => {
        const res = await $fetch<ProductPostsResponse>(`${apiUrl}/api/products/${productId}/posts`, {
            credentials: 'include'
        })
        return res.posts || []
    }

    const fetchPostComments = async (
        productId: number,
        postId: number,
        page: number = 1,
        size: number = 20
    ): Promise<PostCommentsResponse> => {
        return await $fetch<PostCommentsResponse>(
            `${apiUrl}/api/products/${productId}/posts/${postId}/comments?page=${page}&size=${size}`,
            { credentials: 'include' }
        )
    }

    const refreshPostStats = async (productId: number, postId: number): Promise<ProductPostStats> => {
        return await $fetch<ProductPostStats>(
            `${apiUrl}/api/products/${productId}/posts/${postId}/refresh-stats`,
            {
                method: 'POST',
                credentials: 'include'
            }
        )
    }

    return {
        fetchProductPosts,
        fetchPostComments,
        refreshPostStats
    }
}
