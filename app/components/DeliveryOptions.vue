<script setup lang="ts">
const props = defineProps<{
    delivery_type: 'none' | 'fixed' | 'free_over' | 'custom' | 'all_free'
    delivery_fee: number
    free_delivery_over: number
    delivery_note: string
}>()

const emit = defineEmits<{
    (e: 'update:delivery_type', value: any): void
    (e: 'update:delivery_fee', value: number): void
    (e: 'update:free_delivery_over', value: number): void
    (e: 'update:delivery_note', value: string): void
}>()

const deliveryType = computed({
    get: () => props.delivery_type,
    set: (value) => emit('update:delivery_type', value)
})

const deliveryFee = computed({
    get: () => props.delivery_fee,
    set: (value) => emit('update:delivery_fee', value)
})

const freeDeliveryOver = computed({
    get: () => props.free_delivery_over,
    set: (value) => emit('update:free_delivery_over', value)
})

const deliveryNote = computed({
    get: () => props.delivery_note,
    set: (value) => emit('update:delivery_note', value)
})

const deliveryTypes = [
    { label: 'Хүргэлтгүй', value: 'none' },
    { label: 'Хүргэлттэй (Үнэ тогтмол)', value: 'fixed' },
    { label: 'Тодорхой үнийн дүнгээс дээш үнэгүй', value: 'free_over' },
    { label: 'Хүргэлттэй (Үнэ тусдаа өөрсдөө тооцож авна)', value: 'custom' },
    { label: 'Бүх хүргэлт үнэгүй', value: 'all_free' }
]

const showDeliveryFee = computed(
    () => props.delivery_type === 'fixed' || props.delivery_type === 'free_over'
)
const showFreeDeliveryOver = computed(() => props.delivery_type === 'free_over')
</script>
<template>
    <UPageCard
        title="Хүргэлтийн тохиргоо"
        description="Хүргэлтийн төлбөр болон нөхцөл."
        variant="naked"
        class="mb-4"
    />

    <UPageCard variant="subtle" class="mb-8">
        <UFormField
            name="delivery_type"
            label="Хүргэлтийн төрөл"
            class="flex max-sm:flex-col justify-between items-start gap-4"
        >
            <URadioGroup v-model="deliveryType" :items="deliveryTypes" class="gap-3" />
        </UFormField>

        <template v-if="showDeliveryFee">
            <USeparator />
            <UFormField
                name="delivery_fee"
                label="Хүргэлтийн үнэ"
                class="flex max-sm:flex-col justify-between items-start gap-4"
            >
                <UInput v-model.number="deliveryFee" type="number" autocomplete="off">
                    <template #trailing>
                        <span class="text-muted text-xs">₮</span>
                    </template>
                </UInput>
            </UFormField>
        </template>

        <template v-if="showFreeDeliveryOver">
            <USeparator />
            <UFormField
                name="free_delivery_over"
                label="Үнэгүй захиалгын доод үнийн дүн"
                description="Энэ дүнгээс дээш захиалга хүргэлт үнэгүй."
                class="flex max-sm:flex-col justify-between items-start gap-4"
            >
                <UInput
                    v-model.number="freeDeliveryOver"
                    type="number"
                    autocomplete="off"
                    placeholder="100000 гэх мэт"
                >
                    <template #trailing>
                        <span class="text-muted text-xs">₮</span>
                    </template>
                </UInput>
            </UFormField>
        </template>

        <USeparator />
        <UFormField
            name="delivery_note"
            label="Хүргэлтийн тэмдэглэл"
            description="Хэрэглэгчдэд харуулах хүргэлтийн нэмэлт мэдээлэл."
            placeholder="Жишээ: Улаанбаатар хот дотор 24 цагийн дотор хүргэнэ..."
            class="flex max-sm:flex-col justify-between items-start gap-4"
            :ui="{ container: 'w-full' }"
        >
            <UTextarea v-model="deliveryNote" :rows="2" autoresize class="w-full" />
        </UFormField>
    </UPageCard>
</template>
