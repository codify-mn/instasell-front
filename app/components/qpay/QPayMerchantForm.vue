<script setup lang="ts">
import type {
    RegisterCompanyRequest,
    RegisterPersonRequest,
    QPayLocation
} from '~/composables/useQPay'

defineProps<{
    inline?: boolean // For embedding in onboarding
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

const merchantType = ref<'company' | 'person'>('person')

// Common fields
const phone = ref('')
const email = ref('')
const city = ref('')
const district = ref('')
const address = ref('')
const mccCode = ref('5999') // Default: Miscellaneous retail

// Single bank account
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

// Dynamic location data
const cities = ref<{ label: string; value: string }[]>([])
const districts = ref<{ label: string; value: string }[]>([])
const isLoadingCities = ref(false)
const isLoadingDistricts = ref(false)

// Accordion state - track which sections are expanded
const expandedSections = ref<string[]>(['personal-info'])

// Section completion status
const isPersonalInfoComplete = computed(() => {
    if (merchantType.value === 'person') {
        return !!(personRegisterNo.value && personFirstName.value && personLastName.value)
    } else {
        return !!(
            companyOwnerRegisterNo.value &&
            companyOwnerFirstName.value &&
            companyOwnerLastName.value &&
            companyRegisterNo.value &&
            companyName.value
        )
    }
})

const isContactComplete = computed(() => !!(phone.value && email.value))

const isAddressComplete = computed(() => !!(city.value && district.value && address.value))

const isBankComplete = computed(
    () => !!(bankCode.value && bankAccountNumber.value && bankAccountName.value)
)

// Count completed sections
const completedSectionsCount = computed(() => {
    let count = 0
    if (isPersonalInfoComplete.value) count++
    if (isContactComplete.value) count++
    if (isAddressComplete.value) count++
    if (isBankComplete.value) count++
    return count
})

// Load cities and autofill data on mount
onMounted(async () => {
    // Fetch shop data if not already loaded
    if (!shop.value) {
        await fetchShop()
    }

    // Autofill email from user
    if (user.value?.email) {
        email.value = user.value.email
    }

    // Autofill phone from shop
    if (shop.value?.phone_number) {
        phone.value = shop.value.phone_number
    }

    // Autofill person name from user
    if (user.value?.first_name) {
        personFirstName.value = user.value.first_name
    }
    if (user.value?.last_name) {
        personLastName.value = user.value.last_name
    }

    // Load cities
    isLoadingCities.value = true
    const citiesData = await fetchCities()
    cities.value = citiesData.map((c: QPayLocation) => ({ label: c.name, value: c.code }))
    isLoadingCities.value = false

    // Set default city if available
    if (cities.value.length > 0) {
        const ulaanbaatar = cities.value.find((c) => c.label.includes('Улаанбаатар'))
        city.value = ulaanbaatar?.value || cities.value[0]!.value
    }

    // Auto-expand incomplete sections on initial load only
    initializeExpandedSections()
})

function initializeExpandedSections() {
    const sections: string[] = []

    // Always show personal info if incomplete
    if (!isPersonalInfoComplete.value) {
        sections.push('personal-info')
    }
    // Show contact if personal is done but contact is not
    if (isPersonalInfoComplete.value && !isContactComplete.value) {
        sections.push('contact')
    }
    // Show address if contact is done but address is not
    if (isContactComplete.value && !isAddressComplete.value) {
        sections.push('address')
    }
    // Show bank if address is done but bank is not
    if (isAddressComplete.value && !isBankComplete.value) {
        sections.push('bank')
    }

    // If nothing is expanded, expand personal-info
    if (sections.length === 0) {
        sections.push('personal-info')
    }

    expandedSections.value = sections
}

// Load districts when city changes
watch(city, async (newCity) => {
    if (!newCity) {
        districts.value = []
        district.value = ''
        return
    }

    isLoadingDistricts.value = true
    district.value = '' // Reset district when city changes
    const districtsData = await fetchDistricts(newCity)
    districts.value = districtsData.map((d: QPayLocation) => ({ label: d.name, value: d.code }))
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

// MCC codes
const mccCodes = [
    { label: '5411 - Хүнсний дэлгүүр', value: '5411' },
    { label: '5691 - Хувцас/Гоёл чимэглэл', value: '5691' },
    { label: '5311 - Их дэлгүүр', value: '5311' },
    { label: '5712 - Тавилга/Гэр ахуй', value: '5712' },
    { label: '5999 - Бусад жижиглэн худалдаа', value: '5999' },
    { label: '5812 - Хоол/Ресторан', value: '5812' },
    { label: '5813 - Бар/Цайны газар', value: '5813' },
    { label: '7299 - Үйлчилгээ', value: '7299' }
]

const isValid = computed(() => {
    // Bank account required
    if (!bankCode.value || !bankAccountNumber.value || !bankAccountName.value) return false
    if (!phone.value || !city.value || !district.value || !address.value) return false

    if (merchantType.value === 'person') {
        return personRegisterNo.value && personFirstName.value && personLastName.value
    } else {
        return (
            companyOwnerRegisterNo.value &&
            companyOwnerFirstName.value &&
            companyOwnerLastName.value &&
            companyRegisterNo.value &&
            companyName.value
        )
    }
})

async function submit() {
    if (!isValid.value) return

    const bankAccount = {
        account_bank_code: bankCode.value,
        account_number: bankAccountNumber.value,
        account_name: bankAccountName.value,
        is_default: true
    }

    try {
        if (merchantType.value === 'person') {
            const request: RegisterPersonRequest = {
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
            }
            await registerPersonMerchant(request)
        } else {
            const request: RegisterCompanyRequest = {
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
            }
            await registerCompanyMerchant(request)
        }
        emit('success')
    } catch {
        // Error is handled in composable
    }
}
</script>

<template>
    <div class="space-y-4">
        <!-- Progress indicator -->
        <div class="flex items-center justify-between px-1 py-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ completedSectionsCount }}/4 бүлэг бөглөсөн
            </span>
            <div class="flex gap-1">
                <div
                    v-for="i in 4"
                    :key="i"
                    class="w-8 h-1.5 rounded-full transition-colors"
                    :class="
                        i <= completedSectionsCount
                            ? 'bg-primary-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                    "
                />
            </div>
        </div>

        <!-- Merchant Type Selection -->
        <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50"
        >
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Мерчант төрөл <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-3">
                <label
                    class="flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-white dark:bg-gray-800"
                    :class="[
                        merchantType === 'person'
                            ? 'border-primary-500 ring-1 ring-primary-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    ]"
                >
                    <input v-model="merchantType" type="radio" value="person" class="sr-only" >
                    <UIcon
                        name="i-lucide-user"
                        class="w-5 h-5"
                        :class="merchantType === 'person' ? 'text-primary-500' : 'text-gray-400'"
                    />
                    <div>
                        <p class="font-medium text-sm">Хувь хүн</p>
                    </div>
                    <UIcon
                        v-if="merchantType === 'person'"
                        name="i-lucide-check-circle-2"
                        class="w-4 h-4 text-primary-500 ml-auto"
                    />
                </label>
                <label
                    class="flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-white dark:bg-gray-800"
                    :class="[
                        merchantType === 'company'
                            ? 'border-primary-500 ring-1 ring-primary-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    ]"
                >
                    <input v-model="merchantType" type="radio" value="company" class="sr-only" >
                    <UIcon
                        name="i-lucide-building-2"
                        class="w-5 h-5"
                        :class="merchantType === 'company' ? 'text-primary-500' : 'text-gray-400'"
                    />
                    <div>
                        <p class="font-medium text-sm">Компани</p>
                    </div>
                    <UIcon
                        v-if="merchantType === 'company'"
                        name="i-lucide-check-circle-2"
                        class="w-4 h-4 text-primary-500 ml-auto"
                    />
                </label>
            </div>
        </div>

        <!-- Accordion Sections -->
        <UAccordion
            v-model="expandedSections"
            type="multiple"
            :items="[
                {
                    value: 'personal-info',
                    label: merchantType === 'person' ? 'Хувийн мэдээлэл' : 'Компанийн мэдээлэл',
                    icon: merchantType === 'person' ? 'i-lucide-user' : 'i-lucide-building-2',
                    slot: 'personal-info' as const
                },
                {
                    value: 'contact',
                    label: 'Холбоо барих',
                    icon: 'i-lucide-phone',
                    slot: 'contact' as const
                },
                {
                    value: 'address',
                    label: 'Хаяг',
                    icon: 'i-lucide-map-pin',
                    slot: 'address' as const
                },
                {
                    value: 'bank',
                    label: 'Банкны данс',
                    icon: 'i-lucide-credit-card',
                    slot: 'bank' as const
                }
            ]"
            class="space-y-2"
        >
            <template #leading="{ item }">
                <div class="flex items-center gap-2">
                    <UIcon :name="item.icon" class="w-4 h-4" />
                </div>
            </template>

            <template #trailing="{ item }">
                <UIcon
                    v-if="
                        (item.value === 'personal-info' && isPersonalInfoComplete) ||
                        (item.value === 'contact' && isContactComplete) ||
                        (item.value === 'address' && isAddressComplete) ||
                        (item.value === 'bank' && isBankComplete)
                    "
                    name="i-lucide-check-circle-2"
                    class="w-4 h-4 text-primary-500"
                />
            </template>

            <!-- Personal/Company Info Section -->
            <template #personal-info-body>
                <div class="space-y-4 pt-2">
                    <!-- Person Fields -->
                    <template v-if="merchantType === 'person'">
                        <UFormField label="Регистрийн дугаар" required hint="Жишээ: АА12345678">
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

                    <!-- Company Fields -->
                    <template v-else>
                        <UFormField label="Компанийн нэр" required>
                            <UInput v-model="companyName" placeholder="Компанийн нэр" />
                        </UFormField>

                        <UFormField label="Компанийн регистр" required hint="7 оронтой тоо">
                            <UInput v-model="companyRegisterNo" placeholder="1234567" />
                        </UFormField>

                        <UFormField label="Эзэмшигчийн регистр" required hint="Жишээ: АА12345678">
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
                        <USelect
                            v-model="mccCode"
                            :items="mccCodes"
                            value-key="value"
                            placeholder="Сонгох"
                        />
                    </UFormField>
                </div>
            </template>

            <!-- Contact Section -->
            <template #contact-body>
                <div class="space-y-4 pt-2">
                    <div class="grid grid-cols-2 gap-3">
                        <UFormField label="Утас" required>
                            <UInput v-model="phone" placeholder="99001122" />
                        </UFormField>
                        <UFormField label="И-мэйл">
                            <UInput v-model="email" type="email" placeholder="email@example.com" />
                        </UFormField>
                    </div>
                </div>
            </template>

            <!-- Address Section -->
            <template #address-body>
                <div class="space-y-4 pt-2">
                    <div class="grid grid-cols-2 gap-3">
                        <UFormField label="Хот/Аймаг" required>
                            <USelect
                                v-model="city"
                                :items="cities"
                                value-key="value"
                                :placeholder="isLoadingCities ? 'Ачаалж байна...' : 'Сонгох'"
                                :loading="isLoadingCities"
                                :disabled="isLoadingCities"
                            />
                        </UFormField>
                        <UFormField label="Дүүрэг/Сум" required>
                            <USelect
                                v-model="district"
                                :items="districts"
                                value-key="value"
                                :placeholder="isLoadingDistricts ? 'Ачаалж байна...' : 'Сонгох'"
                                :loading="isLoadingDistricts"
                                :disabled="isLoadingDistricts || !city"
                            />
                        </UFormField>
                    </div>

                    <UFormField label="Дэлгэрэнгүй хаяг" required>
                        <UInput v-model="address" placeholder="Байр, орц, тоот..." />
                    </UFormField>
                </div>
            </template>

            <!-- Bank Account Section -->
            <template #bank-body>
                <div class="space-y-4 pt-2">
                    <UFormField label="Банк" required>
                        <USelect
                            v-model="bankCode"
                            :items="banks"
                            value-key="value"
                            placeholder="Банк сонгох"
                        />
                    </UFormField>

                    <UFormField label="Дансны дугаар" required>
                        <UInput v-model="bankAccountNumber" placeholder="1234567890" />
                    </UFormField>

                    <UFormField label="Дансны нэр" required hint="Данс эзэмшигчийн нэр">
                        <UInput v-model="bankAccountName" placeholder="Эзэмшигчийн нэр" />
                    </UFormField>
                </div>
            </template>
        </UAccordion>

        <!-- Actions -->
        <div v-if="!inline" class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" @click="emit('cancel')"> Цуцлах </UButton>
            <UButton :loading="isRegistering" :disabled="!isValid" @click="submit">
                QPay бүртгүүлэх
            </UButton>
        </div>

        <!-- Inline submit button for onboarding -->
        <div v-else>
            <UButton
                class="w-full"
                size="lg"
                :loading="isRegistering"
                :disabled="!isValid"
                @click="submit"
            >
                QPay бүртгүүлэх
            </UButton>
        </div>
    </div>
</template>
