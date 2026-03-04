<script setup lang="ts">
interface Props {
    modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'update:modelValue': [value: string[]]
}>()

const { uploadFiles, uploading, progress, clearProgress } = useUpload()
const toast = useToast()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

const handleDrop = async (e: DragEvent) => {
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files) {
        await handleFiles(files)
    }
}

const handleFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) {
        await handleFiles(target.files)
        // Reset input for re-selecting same files
        target.value = ''
    }
}

const handleFiles = async (fileList: FileList) => {
    const files = Array.from(fileList)

    // Validate files
    const validFiles: File[] = []
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
            toast.add({
                title: 'Алдаа',
                description: `${file.name}: Зөвхөн JPG, PNG, WEBP, GIF зураг оруулна уу`,
                color: 'error'
            })
            continue
        }
        if (file.size > maxSize) {
            toast.add({
                title: 'Алдаа',
                description: `${file.name}: Хэмжээ 5MB-с их байна`,
                color: 'error'
            })
            continue
        }
        validFiles.push(file)
    }

    if (validFiles.length === 0) return

    try {
        const urls = await uploadFiles(validFiles)
        if (urls.length > 0) {
            emit('update:modelValue', [...props.modelValue, ...urls])
            toast.add({
                title: 'Амжилттай',
                description: `${urls.length} зураг оруулагдлаа`,
                color: 'success'
            })
        }
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Зураг оруулахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        clearProgress()
    }
}

const removeImage = (index: number) => {
    const newImages = [...props.modelValue]
    newImages.splice(index, 1)
    emit('update:modelValue', newImages)
}

const openFilePicker = () => {
    fileInput.value?.click()
}

// URL input
const urlInput = ref('')
const showUrlInput = ref(false)

const addImageUrl = () => {
    if (!urlInput.value) return

    // Basic URL validation
    try {
        new URL(urlInput.value)
    } catch {
        toast.add({
            title: 'Алдаа',
            description: 'Зөв URL оруулна уу',
            color: 'error'
        })
        return
    }

    emit('update:modelValue', [...props.modelValue, urlInput.value])
    urlInput.value = ''
    showUrlInput.value = false
}
</script>

<template>
    <div class="space-y-4">
        <!-- Image Preview Grid -->
        <div v-if="modelValue.length > 0" class="grid grid-cols-4 gap-3">
            <div
                v-for="(img, index) in modelValue"
                :key="index"
                class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group ring-1 ring-gray-200 dark:ring-gray-700"
            >
                <img :src="img" class="w-full h-full object-cover" alt="" >
                <div
                    class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                    <button
                        type="button"
                        class="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        @click="removeImage(index)"
                    >
                        <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                    </button>
                </div>
                <div
                    v-if="index === 0"
                    class="absolute bottom-1 left-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded"
                >
                    Үндсэн
                </div>
            </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="progress.length > 0" class="space-y-2">
            <div
                v-for="(item, index) in progress"
                :key="index"
                class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
                <div
                    class="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                >
                    <UIcon
                        v-if="item.status === 'done'"
                        name="i-lucide-check"
                        class="w-4 h-4 text-green-500"
                    />
                    <UIcon
                        v-else-if="item.status === 'error'"
                        name="i-lucide-x"
                        class="w-4 h-4 text-red-500"
                    />
                    <UIcon
                        v-else
                        name="i-lucide-loader-2"
                        class="w-4 h-4 text-gray-500 animate-spin"
                    />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                        {{ item.filename }}
                    </p>
                    <div
                        class="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                    >
                        <div
                            class="h-full transition-all duration-300"
                            :class="item.status === 'error' ? 'bg-red-500' : 'bg-primary-500'"
                            :style="{ width: `${item.progress}%` }"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Upload Area -->
        <div
            v-if="modelValue.length == 0"
            class="relative border-2 border-dashed rounded-xl p-8 text-center transition-colors"
            :class="[
                isDragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
        >
            <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                class="hidden"
                @change="handleFileSelect"
            >

            <div v-if="uploading" class="flex flex-col items-center">
                <UIcon
                    name="i-lucide-loader-2"
                    class="w-8 h-8 text-primary-500 animate-spin mb-3"
                />
                <p class="text-sm text-gray-500">Зураг оруулж байна...</p>
            </div>

            <template v-else>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Зөвхөн PNG, JPG, WEBP, GIF ба ихдээ 5 MB оруулах боломжтой
                </p>

                <div class="flex items-center justify-center">
                    <UButton
                        type="button"
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-upload"
                        @click="openFilePicker"
                    >
                        Зураг оруулах
                    </UButton>
                </div>

                <p class="text-xs text-gray-400 mt-4">эсвэл</p>

                <!-- URL Input -->
                <div v-if="showUrlInput" class="mt-3 flex gap-2 max-w-md mx-auto">
                    <UInput
                        v-model="urlInput"
                        placeholder="https://example.com/image.jpg"
                        class="flex-1"
                        @keyup.enter="addImageUrl"
                    />
                    <UButton type="button" color="primary" @click="addImageUrl"> Нэмэх </UButton>
                    <UButton
                        type="button"
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-x"
                        @click="showUrlInput = false"
                    />
                </div>
                <button
                    v-else
                    type="button"
                    class="text-sm text-primary-500 hover:text-primary-600 mt-1"
                    @click="showUrlInput = true"
                >
                    Зураг холбоосоор оруулах
                </button>
            </template>
        </div>
    </div>
</template>
