<script setup lang="ts">
import type { ImportResult } from '~/composables/useProducts'

const props = defineProps<{
    open: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    success: [result: ImportResult]
}>()

const { downloadImportTemplate, importProducts } = useProducts()
const toast = useToast()

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const file = ref<File | null>(null)
const isDragging = ref(false)
const isDownloading = ref(false)
const isImporting = ref(false)
const importResult = ref<ImportResult | null>(null)

const statusOptions = [
    { label: 'Ноорог - Хэрэглэгчид харагдахгүй', value: 'draft' },
    { label: 'Идэвхтэй - Шууд борлуулалтад орно', value: 'active' }
]

const selectedStatus = ref('draft')

const handleDownloadTemplate = async () => {
    isDownloading.value = true
    try {
        await downloadImportTemplate()
        toast.add({
            title: 'Амжилттай',
            description: 'Загвар файл татагдлаа',
            color: 'primary'
        })
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Файл татахад алдаа гарлаа',
            color: 'error'
        })
    } finally {
        isDownloading.value = false
    }
}

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const selectedFile = target.files?.[0]
    if (selectedFile) {
        file.value = selectedFile
        importResult.value = null
    }
}

const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = false

    const droppedFile = event.dataTransfer?.files?.[0]
    if (droppedFile) {
        const filename = droppedFile.name.toLowerCase()
        if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
            file.value = droppedFile
            importResult.value = null
        } else {
            toast.add({
                title: 'Алдаа',
                description: 'Зөвхөн Excel файл (.xlsx, .xls) дэмжинэ',
                color: 'error'
            })
        }
    }
}

const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = true
}

const handleDragLeave = () => {
    isDragging.value = false
}

const handleImport = async () => {
    if (!file.value) {
        toast.add({
            title: 'Алдаа',
            description: 'Файл сонгоно уу',
            color: 'error'
        })
        return
    }

    isImporting.value = true
    try {
        const result = await importProducts(file.value, selectedStatus.value)
        importResult.value = result

        if (result.success) {
            toast.add({
                title: 'Амжилттай',
                description: `${result.created} бараа нэмэгдлээ, ${result.updated} бараа шинэчлэгдлээ`,
                color: 'primary'
            })
            emit('success', result)
        } else if (result.created > 0 || result.updated > 0) {
            toast.add({
                title: 'Хэсэгчлэн амжилттай',
                description: `${result.created} нэмэгдсэн, ${result.updated} шинэчлэгдсэн. ${result.errors.length} алдаа.`,
                color: 'warning'
            })
            emit('success', result)
        } else {
            toast.add({
                title: 'Алдаа',
                description: 'Импортлоход алдаа гарлаа',
                color: 'error'
            })
        }
    } catch (err: any) {
        toast.add({
            title: 'Алдаа',
            description: err.data?.message || 'Импортлоход алдаа гарлаа',
            color: 'error'
        })
    } finally {
        isImporting.value = false
    }
}

const clearFile = () => {
    file.value = null
    importResult.value = null
}

const resetModal = () => {
    clearFile()
    selectedStatus.value = 'draft'
}

const handleClose = () => {
    isOpen.value = false
    resetModal()
}

watch(isOpen, (newVal) => {
    if (!newVal) {
        resetModal()
    }
})
</script>

<template>
    <UModal v-model:open="isOpen" class="sm:max-w-xl">
        <template #content>
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-[var(--text-heading)]">
                                Бараагаа олноор нь нэмэх
                            </h3>
                            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Excel файлаас бараа бүтээгдэхүүнээ нэмэх
                            </p>
                        </div>
                        <UButton
                            icon="i-lucide-x"
                            color="neutral"
                            variant="ghost"
                            size="sm"
                            @click="handleClose"
                        />
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Info box -->
                    <div
                        class="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800"
                    >
                        <div class="flex gap-3">
                            <UIcon
                                name="i-lucide-info"
                                class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                            />
                            <div class="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                                <p>
                                    <strong>Олон төрөлтэй бараа:</strong> Нэг барааны олон төрлийг
                                    нэмэхийн тулд дараагийн мөрүүдэд барааны нэрийг хоосон орхиж,
                                    зөвхөн төрлийн мэдээллийг бөглөнө.
                                </p>
                                <p>
                                    <strong>Ангилал:</strong> Ангилалын нэрийг шууд бичнэ. Байхгүй
                                    бол шинээр үүсгэнэ.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Step 1: Download template -->
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <span
                                class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-sm font-medium"
                                >1</span
                            >
                            <span class="font-medium text-[var(--text-heading)]"
                                >Загвар файл татаж авах</span
                            >
                        </div>
                        <UButton
                            color="neutral"
                            variant="outline"
                            icon="i-lucide-download"
                            :loading="isDownloading"
                            class="w-full justify-center"
                            @click="handleDownloadTemplate"
                        >
                            Загвар файл татах
                        </UButton>
                    </div>

                    <!-- Step 2: Upload file -->
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <span
                                class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-sm font-medium"
                                >2</span
                            >
                            <span class="font-medium text-[var(--text-heading)]"
                                >Бөглөсөн файл байршуулах</span
                            >
                        </div>

                        <div
                            class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
                            :class="[
                                isDragging
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
                                file ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                            ]"
                            @drop="handleDrop"
                            @dragover="handleDragOver"
                            @dragleave="handleDragLeave"
                            @click="($refs.fileInput as HTMLInputElement)?.click()"
                        >
                            <input
                                ref="fileInput"
                                type="file"
                                accept=".xlsx,.xls"
                                class="hidden"
                                @change="handleFileSelect"
                            >

                            <div v-if="file" class="flex flex-col items-center gap-2">
                                <UIcon
                                    name="i-lucide-file-spreadsheet"
                                    class="w-10 h-10 text-primary-500"
                                />
                                <span class="font-medium text-[var(--text-heading)]">{{
                                    file.name
                                }}</span>
                                <span class="text-sm text-gray-500"
                                    >{{ (file.size / 1024).toFixed(1) }} KB</span
                                >
                                <UButton
                                    size="xs"
                                    color="neutral"
                                    variant="ghost"
                                    @click.stop="clearFile"
                                >
                                    Өөр файл сонгох
                                </UButton>
                            </div>

                            <div v-else class="flex flex-col items-center gap-2">
                                <UIcon name="i-lucide-upload" class="w-10 h-10 text-gray-400" />
                                <span class="font-medium text-gray-600 dark:text-gray-400"
                                    >Файл сонгох</span
                                >
                                <span class="text-sm text-gray-500">Excel файл (.xlsx, .xls)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Status selection -->
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Импортлосон бараануудын эхний төлөв
                        </label>
                        <USelect v-model="selectedStatus" :items="statusOptions" class="w-full" />
                    </div>

                    <!-- Import result -->
                    <div
                        v-if="importResult"
                        class="rounded-lg p-4 border"
                        :class="
                            importResult.success
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        "
                    >
                        <div class="flex items-start gap-3">
                            <UIcon
                                :name="
                                    importResult.success
                                        ? 'i-lucide-check-circle'
                                        : 'i-lucide-alert-circle'
                                "
                                :class="importResult.success ? 'text-primary-600' : 'text-red-600'"
                                class="w-5 h-5 shrink-0 mt-0.5"
                            />
                            <div class="flex-1">
                                <h4
                                    class="font-medium"
                                    :class="
                                        importResult.success
                                            ? 'text-primary-800 dark:text-primary-200'
                                            : 'text-red-800 dark:text-red-200'
                                    "
                                >
                                    {{ importResult.success ? 'Амжилттай' : 'Алдаа гарлаа' }}
                                </h4>
                                <div
                                    class="mt-2 text-sm space-y-1"
                                    :class="
                                        importResult.success
                                            ? 'text-primary-700 dark:text-primary-300'
                                            : 'text-red-700 dark:text-red-300'
                                    "
                                >
                                    <p v-if="importResult.created > 0">
                                        {{ importResult.created }} бараа нэмэгдлээ
                                    </p>
                                    <p v-if="importResult.updated > 0">
                                        {{ importResult.updated }} бараа шинэчлэгдлээ
                                    </p>
                                    <p v-if="importResult.skipped > 0">
                                        {{ importResult.skipped }} бараа алгасагдлаа
                                    </p>
                                </div>

                                <!-- Error details -->
                                <div v-if="importResult.errors.length > 0" class="mt-3">
                                    <p
                                        class="text-sm font-medium text-red-800 dark:text-red-200 mb-2"
                                    >
                                        Алдаанууд:
                                    </p>
                                    <ul
                                        class="text-sm text-red-700 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto"
                                    >
                                        <li
                                            v-for="(error, index) in importResult.errors"
                                            :key="index"
                                            class="flex items-start gap-1"
                                        >
                                            <span class="shrink-0">Мөр {{ error.row }}:</span>
                                            <span>{{ error.message }}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton color="neutral" variant="outline" @click="handleClose">
                            Цуцлах
                        </UButton>
                        <UButton
                            color="primary"
                            :loading="isImporting"
                            :disabled="!file"
                            @click="handleImport"
                        >
                            Импортлох
                        </UButton>
                    </div>
                </template>
            </UCard>
        </template>
    </UModal>
</template>
