<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
    layout: 'auth'
})

useSeoMeta({
    title: 'Шинэ нууц үг - Instasell'
})

const route = useRoute()
const { resetPassword, isLoading, authError, clearError } = useAuth()

const token = computed(() => (route.query.token as string) || '')
const isSubmitted = ref(false)
const isInvalidToken = ref(!token.value)

const schema = z
    .object({
        password: z.string().min(8, 'Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой'),
        confirmPassword: z.string().min(8, 'Нууц үг давтана уу')
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Нууц үг таарахгүй байна',
        path: ['confirmPassword']
    })

type Schema = z.output<typeof schema>

const state = reactive({
    password: '',
    confirmPassword: ''
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
    const success = await resetPassword(token.value, event.data.password)
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
                class="absolute top-1/4 left-1/4 w-125 h-125 rounded-full blur-3xl opacity-20"
                style="
                    background: radial-gradient(
                        circle,
                        rgba(14, 165, 233, 0.3) 0%,
                        transparent 70%
                    );
                "
            />
            <div
                class="absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full blur-3xl opacity-20"
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
                class="bg-(--surface-card) rounded-2xl shadow-xl border border-(--border-primary) p-8"
            >
                <!-- Invalid Token state -->
                <div v-if="isInvalidToken" class="text-center space-y-6">
                    <div
                        class="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto"
                    >
                        <UIcon name="i-lucide-alert-triangle" class="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-(--text-heading) mb-2">
                            Буруу холбоос
                        </h1>
                        <p class="text-gray-500 dark:text-gray-400">
                            Буруу эсвэл хугацаа дууссан холбоос байна.
                        </p>
                    </div>
                    <UButton
                        to="/forgot-password"
                        block
                        size="lg"
                        class="bg-linear-to-r from-primary-500 to-primary-600 border-0"
                    >
                        Дахин холбоос авах
                    </UButton>
                </div>

                <!-- Success state -->
                <div v-else-if="isSubmitted" class="text-center space-y-6">
                    <div
                        class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto"
                    >
                        <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-primary-500" />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-(--text-heading) mb-2">
                            Амжилттай!
                        </h1>
                        <p class="text-gray-500 dark:text-gray-400">Нууц үг амжилттай солигдлоо.</p>
                    </div>
                    <UButton
                        to="/login"
                        block
                        size="lg"
                        class="bg-linear-to-r from-primary-500 to-primary-600 border-0"
                    >
                        Нэвтрэх
                    </UButton>
                </div>

                <!-- Form state -->
                <template v-else>
                    <div class="text-center mb-8">
                        <div
                            class="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25"
                        >
                            <UIcon name="i-lucide-lock-keyhole" class="w-8 h-8 text-white" />
                        </div>
                        <h1 class="text-2xl font-bold text-(--text-heading) mb-2">
                            Шинэ нууц үг
                        </h1>
                        <p class="text-gray-500 dark:text-gray-400">Шинэ нууц үгээ оруулна уу</p>
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

                    <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
                        <UFormField label="Шинэ нууц үг" name="password">
                            <UInput
                                v-model="state.password"
                                type="password"
                                placeholder="Хамгийн багадаа 8 тэмдэгт"
                                icon="i-lucide-lock"
                                size="lg"
                            />
                        </UFormField>

                        <UFormField label="Нууц үг давтах" name="confirmPassword">
                            <UInput
                                v-model="state.confirmPassword"
                                type="password"
                                placeholder="Нууц үг давтана уу"
                                icon="i-lucide-lock"
                                size="lg"
                            />
                        </UFormField>

                        <UButton
                            type="submit"
                            block
                            size="lg"
                            :loading="isLoading"
                            class="bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-lg shadow-primary-500/25"
                        >
                            Нууц үг солих
                        </UButton>
                    </UForm>
                </template>
            </div>
        </div>
    </div>
</template>
