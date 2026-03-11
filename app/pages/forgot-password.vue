<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
    layout: 'auth'
})

useSeoMeta({
    title: 'Нууц үг сэргээх - Instasell'
})

const { forgotPassword, isLoading, authError, clearError } = useAuth()

const isSubmitted = ref(false)

const schema = z.object({
    email: z.string().email('Зөв имэйл хаяг оруулна уу')
})

type Schema = z.output<typeof schema>

const state = reactive({
    email: ''
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
    const success = await forgotPassword(event.data.email)
    if (success) {
        isSubmitted.value = true
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <!-- Background decoration -->
        <div class="absolute inset-0 -z-10 overflow-hidden">
            <div
                class="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
                style="
                    background: radial-gradient(
                        circle,
                        rgba(14, 165, 233, 0.3) 0%,
                        transparent 70%
                    );
                "
            />
            <div
                class="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
                style="
                    background: radial-gradient(
                        circle,
                        rgba(99, 102, 241, 0.2) 0%,
                        transparent 70%
                    );
                "
            />
        </div>

        <div class="w-full max-w-md">
            <!-- Back button -->
            <NuxtLink
                to="/login"
                class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
            >
                <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
                Нэвтрэх хуудас руу буцах
            </NuxtLink>

            <div
                class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8"
            >
                <!-- Success state -->
                <div v-if="isSubmitted" class="text-center space-y-6">
                    <div
                        class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto"
                    >
                        <UIcon name="i-lucide-mail-check" class="w-8 h-8 text-primary-500" />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Имэйл илгээлээ!
                        </h1>
                        <p class="text-gray-500 dark:text-gray-400">
                            Хэрэв таны имэйл хаяг бүртгэлтэй бол нууц үг сэргээх холбоосыг илгээлээ.
                        </p>
                    </div>
                    <p class="text-sm text-gray-400 dark:text-gray-500">
                        Spam хавтсыг мөн шалгахаа мартуузай.
                    </p>
                    <UButton to="/login" block size="lg" color="neutral" variant="outline">
                        Нэвтрэх хуудас руу буцах
                    </UButton>
                </div>

                <!-- Form state -->
                <template v-else>
                    <div class="text-center mb-8">
                        <div
                            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25"
                        >
                            <UIcon name="i-lucide-key-round" class="w-8 h-8 text-white" />
                        </div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Нууц үг сэргээх
                        </h1>
                        <p class="text-gray-500 dark:text-gray-400">
                            Бүртгэлтэй имэйл хаягаа оруулна уу
                        </p>
                    </div>

                    <!-- Error Alert -->
                    <Transition
                        enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 -translate-y-2"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-150 ease-in"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 -translate-y-2"
                    >
                        <UAlert
                            v-if="authError"
                            color="error"
                            variant="subtle"
                            :title="authError"
                            icon="i-lucide-alert-circle"
                            class="mb-6"
                            :close-button="{
                                icon: 'i-lucide-x',
                                color: 'error',
                                variant: 'link',
                                padded: false
                            }"
                            @close="clearError"
                        />
                    </Transition>

                    <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
                        <UFormField label="Имэйл хаяг" name="email">
                            <UInput
                                v-model="state.email"
                                type="email"
                                placeholder="you@example.com"
                                icon="i-lucide-mail"
                                size="lg"
                            />
                        </UFormField>

                        <UButton
                            type="submit"
                            block
                            size="lg"
                            :loading="isLoading"
                            class="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-lg shadow-primary-500/25"
                        >
                            Сэргээх холбоос илгээх
                        </UButton>
                    </UForm>
                </template>
            </div>
        </div>
    </div>
</template>
