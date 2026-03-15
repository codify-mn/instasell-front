<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{
    loading?: boolean
    categories: string[]
}>()

const emit = defineEmits<{
    submit: [data: any]
    cancel: []
}>()

const schema = z.object({
    name: z.string().min(1, 'Нэр оруулна уу'),
    description: z.string().optional(),
    base_price: z.number().min(1, 'Үнэ оруулна уу'),
    sale_price: z.number().optional().nullable(),
    category: z.string().optional(),
    status: z.string().default('draft'),
    track_inventory: z.boolean().default(true),
    has_variants: z.boolean().default(false),
    sku: z.string().optional(),
    stock_quantity: z.number().optional()
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
    name: '',
    description: '',
    base_price: 0,
    sale_price: null,
    category: '',
    status: 'draft',
    track_inventory: true,
    has_variants: false,
    sku: '',
    stock_quantity: 0
})

const statusOptions = [
    { label: 'Ноорог', value: 'draft' },
    { label: 'Идэвхтэй', value: 'active' }
]

const onSubmit = (event: FormSubmitEvent<Schema>) => {
    emit('submit', event.data)
}
</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
        <UFormField label="Нэр" name="name" required>
            <UInput v-model="state.name" placeholder="Бүтээгдэхүүний нэр" autofocus />
        </UFormField>

        <UFormField label="Тайлбар" name="description">
            <UTextarea v-model="state.description" placeholder="Бүтээгдэхүүний тайлбар" :rows="3" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
            <UFormField label="Үндсэн үнэ" name="base_price" required>
                <UInput v-model.number="state.base_price" type="number" placeholder="0">
                    <template #trailing>
                        <span class="text-gray-500">₮</span>
                    </template>
                </UInput>
            </UFormField>

            <UFormField label="Хямдралтай үнэ" name="sale_price">
                <UInput v-model.number="state.sale_price" type="number" placeholder="0">
                    <template #trailing>
                        <span class="text-gray-500">₮</span>
                    </template>
                </UInput>
            </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ангилал" name="category">
                <UInput
                    v-model="state.category"
                    placeholder="Ангилал оруулах"
                    list="product-categories"
                />
                <datalist id="product-categories">
                    <option v-for="cat in categories" :key="cat" :value="cat" />
                </datalist>
            </UFormField>

            <UFormField label="Төлөв" name="status">
                <USelect v-model="state.status" :items="statusOptions" />
            </UFormField>
        </div>

        <UDivider />

        <div class="space-y-4">
            <UFormField name="track_inventory">
                <UCheckbox
                    v-model="state.track_inventory"
                    label="Нөөц хянах"
                    description="Бүтээгдэхүүний үлдэгдэл тоог хянана"
                />
            </UFormField>

            <UFormField name="has_variants">
                <UCheckbox
                    v-model="state.has_variants"
                    label="Хувилбартай"
                    description="Өнгө, хэмжээ гэх мэт хувилбарууд нэмнэ"
                />
            </UFormField>
        </div>

        <div
            v-if="state.track_inventory && !state.has_variants"
            class="grid grid-cols-2 gap-4 p-4 bg-(--surface-inset) rounded-lg"
        >
            <UFormField label="SKU" name="sku">
                <UInput v-model="state.sku" placeholder="SKU-001" />
            </UFormField>

            <UFormField label="Үлдэгдэл" name="stock_quantity">
                <UInput v-model.number="state.stock_quantity" type="number" placeholder="0" />
            </UFormField>
        </div>

        <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="outline" @click="emit('cancel')"> Болих </UButton>
            <UButton type="submit" color="primary" :loading="loading"> Хадгалах </UButton>
        </div>
    </UForm>
</template>
