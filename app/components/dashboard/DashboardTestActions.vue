<script setup lang="ts">
const { fetchProducts } = useProducts()
const { fetchOrders, createOrder } = useOrders()
const toast = useToast()

const loadingLatest = ref(false)
const generatingTest = ref(false)

const openLatestCheckout = async () => {
    loadingLatest.value = true
    try {
        const { orders } = await fetchOrders({ size: 20 })
        const orderWithToken = orders.find((o) => o.checkout_token)
        if (orderWithToken) {
            window.open(`/checkout/${orderWithToken.checkout_token}`, '_blank')
        } else {
            toast.add({
                title: 'Захиалга олдсонгүй',
                description:
                    'Checkout линктэй захиалга олдсонгүй. Эхлээд "Туршилтын захиалга үүсгэх" дарна уу.',
                color: 'warning'
            })
        }
    } catch (err) {
        toast.add({ title: 'Алдаа', description: 'Захиалга татахад алдаа гарлаа.', color: 'error' })
    } finally {
        loadingLatest.value = false
    }
}

const createTestOrder = async () => {
    generatingTest.value = true
    try {
        const { products } = await fetchProducts({ size: 1 })
        if (products.length === 0) {
            toast.add({
                title: 'Бараа олдсонгүй',
                description: 'Туршилтын захиалга үүсгэхийн тулд ядаж нэг бараа байх ёстой.',
                color: 'warning'
            })
            return
        }

        const product = products[0]
        if (!product) return

        const variant = product.variants?.[0] || { id: 0, name: 'Default' }

        const orderData = {
            customer_name: 'Туршилтын Хэрэглэгч',
            customer_phone: '88001122',
            items: [
                {
                    product_id: product.id,
                    variant_id: variant.id,
                    sku: product.keyword || 'TEST',
                    name: product.name,
                    options: variant.name || '',
                    price: product.price,
                    quantity: 1
                }
            ],
            payment_method: 'qpay' as any,
            metadata: { source: 'test_action' }
        }

        const order = await createOrder(orderData)
        if (order.checkout_token) {
            window.open(`/checkout/${order.checkout_token}`, '_blank')
            toast.add({
                title: 'Амжилттай',
                description: 'Туршилтын захиалга үүсгэгдлээ.',
                color: 'success'
            })
        }
    } catch (err) {
        console.error(err)
        toast.add({
            title: 'Алдаа',
            description: 'Туршилтын захиалга үүсгэхэд алдаа гарлаа.',
            color: 'error'
        })
    } finally {
        generatingTest.value = false
    }
}
</script>

<template>
    <div class="flex flex-wrap gap-3">
        <UButton
            icon="i-lucide-external-link"
            variant="soft"
            color="primary"
            :loading="loadingLatest"
            class="rounded-xl shadow-sm"
            @click="openLatestCheckout"
        >
            Сүүлийн Checkout нээх
        </UButton>
        <UButton
            icon="i-lucide-plus"
            variant="soft"
            color="success"
            :loading="generatingTest"
            class="rounded-xl shadow-sm"
            @click="createTestOrder"
        >
            Туршилтын захиалга үүсгэх
        </UButton>
    </div>
</template>
