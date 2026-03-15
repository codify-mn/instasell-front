<script setup lang="ts">
interface Props {
    modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'update:modelValue': [value: string[]]
}>()

const { uploadFiles, uploading, progress, clearProgress, removeBg } = useUpload()
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
        target.value = ''
    }
}

const handleFiles = async (fileList: FileList) => {
    const files = Array.from(fileList)
    const validFiles: File[] = []
    const maxSize = 5 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
            toast.add({ title: 'Алдаа', description: `${file.name}: Зөвхөн JPG, PNG, WEBP, GIF`, color: 'error' })
            continue
        }
        if (file.size > maxSize) {
            toast.add({ title: 'Алдаа', description: `${file.name}: 5MB-с их байна`, color: 'error' })
            continue
        }
        validFiles.push(file)
    }

    if (validFiles.length === 0) return

    try {
        const urls = await uploadFiles(validFiles)
        if (urls.length > 0) {
            emit('update:modelValue', [...props.modelValue, ...urls])
            toast.add({ title: 'Амжилттай', description: `${urls.length} зураг оруулагдлаа`, color: 'primary' })
        }
    } catch (err: any) {
        toast.add({ title: 'Алдаа', description: err.data?.message || 'Зураг оруулахад алдаа гарлаа', color: 'error' })
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
</script>

<template>
    <div>
        <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            class="hidden"
            @change="handleFileSelect"
        />

        <!-- Has images: gallery layout -->
        <div v-if="modelValue.length > 0" class="space-y-3">
            <!-- Main large image -->
            <div
                class="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 w-full cursor-pointer group"
                style="aspect-ratio: 1/1"
                @click="openFilePicker"
            >
                <img :src="modelValue[0]" class="w-full h-full object-cover" alt="" />
                <div v-if="uploading" class="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-white animate-spin" />
                </div>
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            <!-- Thumbnails row -->
            <div class="flex gap-2 flex-wrap">
                <div
                    v-for="(img, index) in modelValue"
                    :key="index"
                    class="relative shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer"
                    :class="index === 0 ? 'ring-2 ring-primary-500' : 'ring-1 ring-gray-200 dark:ring-gray-700'"
                    style="width: 72px; height: 72px"
                >
                    <img :src="img" class="w-full h-full object-cover" alt="" />
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            type="button"
                            class="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                            @click.stop="removeImage(index)"
                        >
                            <UIcon name="i-lucide-x" class="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <!-- Add more thumbnail -->
                <button
                    type="button"
                    class="shrink-0 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 flex items-center justify-center text-gray-400 hover:text-primary-500 transition-colors cursor-pointer"
                    style="width: 72px; height: 72px"
                    @click="openFilePicker"
                >
                    <UIcon name="i-lucide-plus" class="w-5 h-5" />
                </button>
            </div>

            <!-- Upload progress -->
            <div v-if="progress.length > 0" class="space-y-1">
                <div v-for="(item, index) in progress" :key="index" class="flex items-center gap-2 p-2 bg-(--surface-inset) rounded-lg">
                    <UIcon v-if="item.status === 'done'" name="i-lucide-check" class="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <UIcon v-else-if="item.status === 'error'" name="i-lucide-x" class="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <UIcon v-else name="i-lucide-loader-2" class="w-3.5 h-3.5 text-gray-500 animate-spin shrink-0" />
                    <div class="flex-1 min-w-0">
                        <p class="text-xs truncate">{{ item.filename }}</p>
                        <div class="mt-0.5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full transition-all" :class="item.status === 'error' ? 'bg-red-500' : 'bg-primary-500'" :style="{ width: `${item.progress}%` }" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- No images: upload dropzone -->
        <div
            v-else
            class="relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
            :class="isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
            @click="openFilePicker"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
        >
            <div v-if="uploading" class="flex flex-col items-center">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary-500 animate-spin mb-3" />
                <p class="text-sm text-gray-500">Зураг оруулж байна...</p>
            </div>
            <template v-else>
                <UIcon name="i-lucide-image-plus" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Зураг оруулах</p>
                <p class="text-xs text-gray-400">PNG, JPG, WEBP — 5MB хүртэл</p>
            </template>
        </div>

        <!-- Remove background toggle -->
        <div class="flex items-center justify-between p-3 mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center gap-2">
                <UIcon name="i-lucide-eraser" class="w-4 h-4 text-gray-500" />
                <span class="text-sm text-gray-600 dark:text-gray-400">Арын дэвсгэр арилгах</span>
            </div>
            <USwitch v-model="removeBg" />
        </div>
    </div>
</template>
