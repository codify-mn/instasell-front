export interface Product {
    id: number
    shop_id: number
    name: string
    status: 'draft' | 'active' | 'out_of_stock' | 'archived'
    category: string
    tags: string[]
    track_inventory: boolean
    has_variants: boolean
    keyword: string
    stock_quantity: number
    images: string[]
    search_keywords: string
    variants: ProductVariant[]
    created_at: string
    updated_at: string

    // Pricing at product level
    price: number
    sale_price: number | null
    // Quantity-based discount
    bulk_discount_enabled: boolean
    bulk_discount_quantity: number
    bulk_discount_price: number | null

    // Time-limited sale
    timed_sale_enabled: boolean
    timed_sale_start: string | null
    timed_sale_end: string | null
    timed_sale_price: number | null

    // Featured product (shown on checkout)
    is_featured: boolean
}

export interface ProductVariant {
    id: number
    product_id: number
    shop_id: number
    name: string
    stock_quantity: number
}

export interface ProductsResponse {
    products: Product[]
    total: number
}

export interface ProductFilter {
    keyword?: string
    category?: string
    status?: string
    stock?: string
    sort_by?: string
    sort_dir?: string
    page?: number
    size?: number
    sale_id?: number
}

export interface CreateProductInput {
    name: string
    description?: string
    price: number
    sale_price?: number | null
    images?: string[]
    category?: string
    tags?: string[]
    track_inventory?: boolean
    has_variants?: boolean
    status?: string
    keyword?: string
    stock_quantity?: number
    variants?: CreateVariantInput[]

    // Quantity-based discount
    bulk_discount_enabled?: boolean
    bulk_discount_quantity?: number
    bulk_discount_price?: number | null

    // Time-limited sale
    timed_sale_enabled?: boolean
    timed_sale_start?: string | null
    timed_sale_end?: string | null
    timed_sale_price?: number | null
}

export interface CreateVariantInput {
    name: string
    stock_quantity: number
}

export interface UpdateVariantInput {
    name?: string
    stock_quantity?: number
}

export interface ImportError {
    row: number
    column: string
    message: string
}

export interface ImportResult {
    success: boolean
    created: number
    updated: number
    skipped: number
    errors: ImportError[]
}

export function useProducts() {
    const config = useRuntimeConfig()
    const apiUrl = config.public.apiUrl

    const fetchProducts = async (filter: ProductFilter = {}): Promise<ProductsResponse> => {
        const params = new URLSearchParams()
        if (filter.keyword) params.set('keyword', filter.keyword)
        if (filter.category) params.set('category', filter.category)
        if (filter.status) params.set('status', filter.status)
        if (filter.stock) params.set('stock', filter.stock)
        if (filter.sort_by) params.set('sort_by', filter.sort_by)
        if (filter.sort_dir) params.set('sort_dir', filter.sort_dir)
        if (filter.page) params.set('page', filter.page.toString())
        if (filter.size) params.set('size', filter.size.toString())
        if (filter.sale_id) params.set('sale_id', filter.sale_id.toString())

        const query = params.toString()
        const url = `${apiUrl}/api/products${query ? `?${query}` : ''}`

        return await $fetch<ProductsResponse>(url, {
            credentials: 'include'
        })
    }

    const fetchProduct = async (id: number): Promise<Product> => {
        return await $fetch<Product>(`${apiUrl}/api/products/${id}`, {
            credentials: 'include'
        })
    }

    const createProduct = async (data: CreateProductInput): Promise<Product> => {
        return await $fetch<Product>(`${apiUrl}/api/products`, {
            method: 'POST',
            credentials: 'include',
            body: data
        })
    }

    const updateProduct = async (
        id: number,
        data: Partial<CreateProductInput>
    ): Promise<Product> => {
        return await $fetch<Product>(`${apiUrl}/api/products/${id}`, {
            method: 'PUT',
            credentials: 'include',
            body: data
        })
    }

    const deleteProduct = async (id: number): Promise<void> => {
        await $fetch(`${apiUrl}/api/products/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
    }

    const fetchCategories = async (): Promise<string[]> => {
        const res = await $fetch<{ categories: string[] }>(`${apiUrl}/api/products/categories`, {
            credentials: 'include'
        })
        return res.categories || []
    }

    const createVariant = async (
        productId: number,
        data: CreateVariantInput
    ): Promise<ProductVariant> => {
        return await $fetch<ProductVariant>(`${apiUrl}/api/products/${productId}/variants`, {
            method: 'POST',
            credentials: 'include',
            body: data
        })
    }

    const updateVariant = async (
        variantId: number,
        data: UpdateVariantInput
    ): Promise<ProductVariant> => {
        return await $fetch<ProductVariant>(`${apiUrl}/api/variants/${variantId}`, {
            method: 'PUT',
            credentials: 'include',
            body: data
        })
    }

    const deleteVariant = async (variantId: number): Promise<void> => {
        await $fetch(`${apiUrl}/api/variants/${variantId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
    }

    const updateVariantStock = async (
        variantId: number,
        adjustment: number
    ): Promise<ProductVariant> => {
        return await $fetch<ProductVariant>(`${apiUrl}/api/variants/${variantId}/stock`, {
            method: 'PATCH',
            credentials: 'include',
            body: { adjustment }
        })
    }

    // CSV Export
    const exportProductsCSV = async (params: {
        status?: string
        keyword?: string
        category?: string
        stock?: string
        ids?: number[]
    }): Promise<void> => {
        const query = new URLSearchParams()
        if (params.status) query.set('status', params.status)
        if (params.keyword) query.set('keyword', params.keyword)
        if (params.category) query.set('category', params.category)
        if (params.stock) query.set('stock', params.stock)
        if (params.ids?.length) query.set('ids', params.ids.join(','))

        const queryStr = query.toString()
        const url = `${apiUrl}/api/products/export/csv${queryStr ? `?${queryStr}` : ''}`

        const response = await fetch(url, { credentials: 'include' })
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', `бараа_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
    }

    // CSV Import
    const downloadImportTemplate = async (): Promise<void> => {
        const url = `${apiUrl}/api/products/import/template`
        const response = await fetch(url, { credentials: 'include' })
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', 'бараа_загвар.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
    }

    const importProducts = async (
        file: File,
        defaultStatus: string = 'draft'
    ): Promise<ImportResult> => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('default_status', defaultStatus)

        return await $fetch<ImportResult>(`${apiUrl}/api/products/import`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
    }

    return {
        fetchProducts,
        fetchProduct,
        createProduct,
        updateProduct,
        deleteProduct,
        fetchCategories,
        createVariant,
        updateVariant,
        deleteVariant,
        updateVariantStock,
        exportProductsCSV,
        downloadImportTemplate,
        importProducts
    }
}
