export interface UploadResult {
    url: string
    key: string
    filename: string
    size: number
}

export interface UploadProgress {
    filename: string
    progress: number
    status: 'pending' | 'uploading' | 'done' | 'error'
    error?: string
    result?: UploadResult
}

export function useUpload() {
    const config = useRuntimeConfig()
    const apiUrl = config.public.apiUrl

    const uploading = ref(false)
    const progress = ref<UploadProgress[]>([])

    const removeBg = ref(true)

    const uploadSingle = async (file: File): Promise<UploadResult> => {
        const formData = new FormData()
        formData.append('file', file)
        if (removeBg.value) {
            formData.append('remove_bg', 'true')
        }

        const result = await $fetch<UploadResult>(`${apiUrl}/api/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        })

        return result
    }

    const uploadMultiple = async (
        files: File[]
    ): Promise<{ uploaded: UploadResult[]; errors: string[] }> => {
        const formData = new FormData()
        files.forEach((file) => {
            formData.append('files', file)
        })

        const result = await $fetch<{ uploaded: UploadResult[]; errors: string[] }>(
            `${apiUrl}/api/upload/multiple`,
            {
                method: 'POST',
                credentials: 'include',
                body: formData
            }
        )

        return result
    }

    const uploadFiles = async (files: File[]): Promise<string[]> => {
        if (files.length === 0) return []

        uploading.value = true
        progress.value = files.map((f) => ({
            filename: f.name,
            progress: 0,
            status: 'pending' as const
        }))

        const urls: string[] = []

        try {
            // Upload one by one to track progress
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (!file || !progress.value[i]) continue

                progress.value[i]!.status = 'uploading'
                progress.value[i]!.progress = 50

                try {
                    const result = await uploadSingle(file)
                    if (progress.value[i]) {
                        progress.value[i]!.status = 'done'
                        progress.value[i]!.progress = 100
                        progress.value[i]!.result = result
                    }
                    urls.push(result.url)
                } catch (err: any) {
                    if (progress.value[i]) {
                        progress.value[i]!.status = 'error'
                        progress.value[i]!.error = err.data?.message || 'Upload failed'
                    }
                }
            }

            return urls
        } finally {
            uploading.value = false
        }
    }

    const clearProgress = () => {
        progress.value = []
    }

    return {
        uploading,
        progress,
        removeBg,
        uploadSingle,
        uploadMultiple,
        uploadFiles,
        clearProgress
    }
}
