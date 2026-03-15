<script setup lang="ts">
import type {
    RegisterCompanyRequest,
    RegisterPersonRequest,
    QPayLocation
} from '~/composables/useQPay'

const props = defineProps<{
    inline?: boolean
    defaultBankAccount?: {
        bank_name: string
        bank_code: string
        account_number: string
        account_name: string
        note: string
    }
}>()

const emit = defineEmits<{
    success: []
    cancel: []
}>()

const {
    registerCompanyMerchant,
    registerPersonMerchant,
    isRegistering,
    fetchCities,
    fetchDistricts
} = useQPay()
const { user } = useAuth()
const { shop, fetchShop } = useShopSettings()

// Step state
const step = ref(1)
const totalSteps = 4

// Merchant type
const merchantType = ref<'company' | 'person'>('person')

// Common fields
const phone = ref('')
const email = ref('')
const city = ref('')
const district = ref('')
const address = ref('')
const mccCode = ref('5999')

// Bank
const bankCode = ref('')
const bankAccountNumber = ref('')
const bankAccountName = ref('')

// Person fields
const personRegisterNo = ref('')
const personFirstName = ref('')
const personLastName = ref('')

// Company fields
const companyOwnerRegisterNo = ref('')
const companyOwnerFirstName = ref('')
const companyOwnerLastName = ref('')
const companyRegisterNo = ref('')
const companyName = ref('')

// Location data
const cities = ref<{ label: string; value: string }[]>([])
const districts = ref<{ label: string; value: string }[]>([])
const isLoadingCities = ref(false)
const isLoadingDistricts = ref(false)

// Step validation
const isStep1Valid = computed(() => {
    if (merchantType.value === 'person') {
        return !!(personRegisterNo.value && personFirstName.value && personLastName.value)
    }
    return !!(companyOwnerRegisterNo.value && companyOwnerFirstName.value && companyOwnerLastName.value && companyRegisterNo.value && companyName.value)
})

const isStep2Valid = computed(() => !!(phone.value && email.value))

const isStep3Valid = computed(() => !!(city.value && district.value && address.value))

const isStep4Valid = computed(() => !!(bankCode.value && bankAccountNumber.value && bankAccountName.value))

const canNext = computed(() => {
    if (step.value === 1) return isStep1Valid.value
    if (step.value === 2) return isStep2Valid.value
    if (step.value === 3) return isStep3Valid.value
    if (step.value === 4) return isStep4Valid.value
    return false
})

const stepLabels = ['Мэдээлэл', 'Холбоо барих', 'Хаяг', 'Банк']

function next() {
    if (step.value < totalSteps && canNext.value) step.value++
}

function back() {
    if (step.value > 1) step.value--
}

// Load data
onMounted(async () => {
    if (!shop.value) await fetchShop()

    if (user.value?.email) email.value = user.value.email
    if (shop.value?.phone_number) phone.value = shop.value.phone_number
    if (user.value?.first_name) personFirstName.value = user.value.first_name
    if (user.value?.last_name) personLastName.value = user.value.last_name

    if (props.defaultBankAccount?.account_number) bankAccountNumber.value = props.defaultBankAccount.account_number
    if (props.defaultBankAccount?.account_name) bankAccountName.value = props.defaultBankAccount.account_name
    if (props.defaultBankAccount?.bank_code) bankCode.value = props.defaultBankAccount.bank_code

    isLoadingCities.value = true
    const citiesData = await fetchCities()
    cities.value = citiesData.map((c: QPayLocation) => ({ label: c.name, value: c.code }))
    isLoadingCities.value = false

    if (cities.value.length > 0) {
        const ub = cities.value.find(c => c.label.includes('Улаанбаатар'))
        city.value = ub?.value || cities.value[0]!.value
    }
})

watch(city, async (newCity) => {
    if (!newCity) { districts.value = []; district.value = ''; return }
    isLoadingDistricts.value = true
    district.value = ''
    const data = await fetchDistricts(newCity)
    districts.value = data.map((d: QPayLocation) => ({ label: d.name, value: d.code }))
    isLoadingDistricts.value = false
})

const banks = [
    { label: 'Хаан банк', value: '040000' },
    { label: 'Голомт банк', value: '150000' },
    { label: 'Худалдаа хөгжлийн банк', value: '340000' },
    { label: 'Төрийн банк', value: '100000' },
    { label: 'Хас банк', value: '320000' },
    { label: 'Богд банк', value: '380000' },
    { label: 'Капитрон банк', value: '900000' },
    { label: 'Чингис хаан банк', value: '330000' },
    { label: 'М банк', value: '210000' }
]

const mccCodes = [
    { label: 'Хүнсний дэлгүүр', value: '5411' },
    { label: 'Хувцас / Гоёл чимэглэл', value: '5691' },
    { label: 'Их дэлгүүр', value: '5311' },
    { label: 'Тавилга / Гэр ахуй', value: '5712' },
    { label: 'Бусад жижиглэн худалдаа', value: '5999' },
    { label: 'Хоол / Ресторан', value: '5812' },
    { label: 'Үйлчилгээ', value: '7299' }
]

async function submit() {
    if (!isStep4Valid.value) return

    const bankAccount = {
        account_bank_code: bankCode.value,
        account_number: bankAccountNumber.value,
        account_name: bankAccountName.value,
        is_default: true
    }

    try {
        if (merchantType.value === 'person') {
            await registerPersonMerchant({
                register_number: personRegisterNo.value,
                first_name: personFirstName.value,
                last_name: personLastName.value,
                mcc_code: mccCode.value,
                city: city.value,
                district: district.value,
                address: address.value,
                phone: phone.value,
                email: email.value,
                bank_account: bankAccount
            } as RegisterPersonRequest)
        } else {
            await registerCompanyMerchant({
                owner_register_no: companyOwnerRegisterNo.value,
                owner_first_name: companyOwnerFirstName.value,
                owner_last_name: companyOwnerLastName.value,
                register_number: companyRegisterNo.value,
                name: companyName.value,
                mcc_code: mccCode.value,
                city: city.value,
                district: district.value,
                address: address.value,
                phone: phone.value,
                email: email.value,
                bank_account: bankAccount
            } as RegisterCompanyRequest)
        }
        emit('success')
    } catch {
        // Error handled in composable
    }
}
</script>

<template>
    <div class="space-y-5">
        <!-- Step indicator -->
        <div class="flex items-center gap-1">
            <template v-for="s in totalSteps" :key="s">
                <div
                    class="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    :class="s === step ? 'text-primary-500' : s < step ? 'text-[var(--accent-green)]' : 'text-[var(--text-placeholder)]'"
                >
                    <div
                        class="size-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all"
                        :class="s < step
                            ? 'bg-[var(--accent-green)] border-[var(--accent-green)] text-white'
                            : s === step
                                ? 'border-primary-500 text-primary-500 bg-primary-500/10'
                                : 'border-[var(--border-primary)] text-[var(--text-placeholder)]'"
                    >
                        <UIcon v-if="s < step" name="i-lucide-check" class="size-3" />
                        <span v-else>{{ s }}</span>
                    </div>
                    <span class="hidden sm:inline">{{ stepLabels[s - 1] }}</span>
                </div>
                <div v-if="s < totalSteps" class="flex-1 h-px mx-1" :class="s < step ? 'bg-[var(--accent-green)]' : 'bg-[var(--border-primary)]'" />
            </template>
        </div>

        <!-- Step 1: Personal / Company Info -->
        <div v-if="step === 1" class="space-y-4">
            <div>
                <h3 class="text-sm font-bold text-[var(--text-heading)] mb-1">
                    {{ merchantType === 'person' ? 'Хувийн мэдээлэл' : 'Компанийн мэдээлэл' }}
                </h3>
                <p class="text-xs text-[var(--text-muted)]">QPay бүртгэлд шаардлагатай мэдээлэл</p>
            </div>

            <!-- Type toggle -->
            <div class="flex gap-2">
                <button
                    v-for="t in [{ val: 'person' as const, label: 'Хувь хүн', icon: 'i-lucide-user' }, { val: 'company' as const, label: 'Компани', icon: 'i-lucide-building-2' }]"
                    :key="t.val"
                    type="button"
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer"
                    :class="merchantType === t.val
                        ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                        : 'border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'"
                    @click="merchantType = t.val"
                >
                    <UIcon :name="t.icon" class="size-4" />
                    {{ t.label }}
                </button>
            </div>

            <!-- Person fields -->
            <template v-if="merchantType === 'person'">
                <UFormField label="Регистрийн дугаар" required>
                    <UInput v-model="personRegisterNo" placeholder="АА12345678" />
                </UFormField>
                <div class="grid grid-cols-2 gap-3">
                    <UFormField label="Овог" required>
                        <UInput v-model="personLastName" placeholder="Бат" />
                    </UFormField>
                    <UFormField label="Нэр" required>
                        <UInput v-model="personFirstName" placeholder="Дорж" />
                    </UFormField>
                </div>
            </template>

            <!-- Company fields -->
            <template v-else>
                <UFormField label="Компанийн нэр" required>
                    <UInput v-model="companyName" placeholder="Компанийн нэр" />
                </UFormField>
                <UFormField label="Компанийн регистр" required>
                    <UInput v-model="companyRegisterNo" placeholder="1234567" />
                </UFormField>
                <UFormField label="Эзэмшигчийн регистр" required>
                    <UInput v-model="companyOwnerRegisterNo" placeholder="АА12345678" />
                </UFormField>
                <div class="grid grid-cols-2 gap-3">
                    <UFormField label="Эзэмшигчийн овог" required>
                        <UInput v-model="companyOwnerLastName" placeholder="Бат" />
                    </UFormField>
                    <UFormField label="Эзэмшигчийн нэр" required>
                        <UInput v-model="companyOwnerFirstName" placeholder="Дорж" />
                    </UFormField>
                </div>
            </template>

            <UFormField label="Үйл ажиллагааны төрөл" required>
                <USelect v-model="mccCode" :items="mccCodes" value-key="value" placeholder="Сонгох" />
            </UFormField>
        </div>

        <!-- Step 2: Contact -->
        <div v-if="step === 2" class="space-y-4">
            <div>
                <h3 class="text-sm font-bold text-[var(--text-heading)] mb-1">Холбоо барих</h3>
                <p class="text-xs text-[var(--text-muted)]">Утас болон и-мэйл хаяг</p>
            </div>
            <UFormField label="Утас" required>
                <UInput v-model="phone" placeholder="99001122" />
            </UFormField>
            <UFormField label="И-мэйл" required>
                <UInput v-model="email" type="email" placeholder="email@example.com" />
            </UFormField>
        </div>

        <!-- Step 3: Address -->
        <div v-if="step === 3" class="space-y-4">
            <div>
                <h3 class="text-sm font-bold text-[var(--text-heading)] mb-1">Хаяг</h3>
                <p class="text-xs text-[var(--text-muted)]">Бүртгэлийн хаягийн мэдээлэл</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <UFormField label="Хот / Аймаг" required>
                    <USelect
                        v-model="city"
                        :items="cities"
                        value-key="value"
                        :placeholder="isLoadingCities ? 'Ачаалж байна...' : 'Сонгох'"
                        :loading="isLoadingCities"
                    />
                </UFormField>
                <UFormField label="Дүүрэг / Сум" required>
                    <USelect
                        v-model="district"
                        :items="districts"
                        value-key="value"
                        :placeholder="isLoadingDistricts ? 'Ачаалж байна...' : 'Сонгох'"
                        :loading="isLoadingDistricts"
                        :disabled="!city"
                    />
                </UFormField>
            </div>
            <UFormField label="Дэлгэрэнгүй хаяг" required>
                <UInput v-model="address" placeholder="Байр, орц, тоот..." />
            </UFormField>
        </div>

        <!-- Step 4: Bank -->
        <div v-if="step === 4" class="space-y-4">
            <div>
                <h3 class="text-sm font-bold text-[var(--text-heading)] mb-1">Банкны данс</h3>
                <p class="text-xs text-[var(--text-muted)]">Төлбөр хүлээн авах дансны мэдээлэл</p>
            </div>
            <UFormField label="Банк" required>
                <USelect v-model="bankCode" :items="banks" value-key="value" placeholder="Банк сонгох" />
            </UFormField>
            <UFormField label="Дансны дугаар" required>
                <UInput v-model="bankAccountNumber" placeholder="1234567890" />
            </UFormField>
            <UFormField label="Дансны нэр" required>
                <UInput v-model="bankAccountName" placeholder="Эзэмшигчийн нэр" />
            </UFormField>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
            <UButton
                v-if="step > 1"
                variant="ghost"
                color="neutral"
                size="sm"
                icon="i-lucide-arrow-left"
                @click="back"
            >
                Буцах
            </UButton>
            <div v-else />

            <div class="flex items-center gap-2">
                <UButton
                    v-if="!inline && step === 1"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    @click="emit('cancel')"
                >
                    Цуцлах
                </UButton>

                <UButton
                    v-if="step < totalSteps"
                    color="primary"
                    size="sm"
                    :disabled="!canNext"
                    @click="next"
                >
                    Дараах
                    <UIcon name="i-lucide-arrow-right" class="size-3.5" />
                </UButton>

                <UButton
                    v-else
                    color="primary"
                    size="sm"
                    :loading="isRegistering"
                    :disabled="!isStep4Valid"
                    @click="submit"
                >
                    QPay бүртгүүлэх
                </UButton>
            </div>
        </div>
    </div>
</template>
