<script setup lang="ts">
import type { QPayBankAccount } from '~/composables/useQPay'
import { MONGOLIAN_BANKS } from '~/utils/banks'

const props = defineProps<{
    modelValue: QPayBankAccount[]
}>()

const emit = defineEmits<{
    'update:modelValue': [value: QPayBankAccount[]]
}>()

const banks = MONGOLIAN_BANKS

const accounts = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

function addAccount() {
    accounts.value = [
        ...accounts.value,
        {
            account_bank_code: '',
            account_number: '',
            account_name: '',
            is_default: accounts.value.length === 0
        }
    ]
}

function removeAccount(index: number) {
    const newAccounts = [...accounts.value]
    newAccounts.splice(index, 1)
    // Ensure at least one default
    if (newAccounts.length > 0 && !newAccounts.some((a) => a.is_default)) {
        newAccounts[0]!.is_default = true
    }
    accounts.value = newAccounts
}

function setDefault(index: number) {
    accounts.value = accounts.value.map((acc, i) => ({
        ...acc,
        is_default: i === index
    }))
}

function getBankLabel(code: string) {
    return banks.find((b) => b.value === code)?.label || code
}
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Банкны данс</label>
            <UButton size="xs" variant="ghost" icon="i-lucide-plus" @click="addAccount">
                Данс нэмэх
            </UButton>
        </div>

        <div
            v-if="accounts.length === 0"
            class="text-center py-6 border-2 border-dashed rounded-lg"
        >
            <UIcon name="i-lucide-credit-card" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500">Банкны данс оруулна уу</p>
            <UButton size="sm" variant="soft" class="mt-3" @click="addAccount">
                Данс нэмэх
            </UButton>
        </div>

        <div
            v-for="(account, index) in accounts"
            :key="index"
            class="border rounded-lg p-4 space-y-3"
        >
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Данс #{{ index + 1 }}
                </span>
                <div class="flex items-center gap-2">
                    <UButton
                        v-if="!account.is_default"
                        size="xs"
                        variant="ghost"
                        color="primary"
                        @click="setDefault(index)"
                    >
                        Үндсэн болгох
                    </UButton>
                    <UBadge v-else size="xs" color="primary" variant="soft"> Үндсэн </UBadge>
                    <UButton
                        v-if="accounts.length > 1"
                        size="xs"
                        variant="ghost"
                        color="error"
                        icon="i-lucide-trash-2"
                        @click="removeAccount(index)"
                    />
                </div>
            </div>

            <UFormField label="Банк" required>
                <USelect
                    v-model="account.account_bank_code"
                    :items="banks"
                    value-key="value"
                    placeholder="Банк сонгох"
                />
            </UFormField>

            <UFormField label="Дансны дугаар" required>
                <UInput v-model="account.account_number" placeholder="1234567890" />
            </UFormField>

            <UFormField label="Дансны нэр" required>
                <UInput v-model="account.account_name" placeholder="Эзэмшигчийн нэр" />
            </UFormField>
        </div>
    </div>
</template>
