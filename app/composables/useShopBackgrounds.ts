export function useShopBackgrounds() {
    const { shop, fetchShop, updateShop } = useShopSettings()
    const { uploadSingle } = useUpload()
    const toast = useToast()

    const backgrounds = computed(() => shop.value?.settings?.backgrounds || [])

    const addBackground = async (file: File) => {
        if (backgrounds.value.length >= 10) {
            toast.add({
                title: 'Хамгийн ихдээ 10 дэвсгэр зураг хадгалах боломжтой',
                color: 'warning'
            })
            return
        }

        try {
            const result = await uploadSingle(file)
            const updated = [...backgrounds.value, result.url]
            await updateShop({
                settings: {
                    ...shop.value!.settings,
                    backgrounds: updated
                }
            })
        } catch {
            toast.add({ title: 'Дэвсгэр зураг хуулахад алдаа гарлаа', color: 'error' })
        }
    }

    const removeBackground = async (url: string) => {
        // const updated = backgrounds.value.filter((bg: string) => bg !== url)
        // try {
        //     await updateShop({
        //         settings: {
        //             ...shop.value!.settings,
        //             backgrounds: updated
        //         }
        //     })
        // } catch {
        //     toast.add({ title: 'Дэвсгэр зураг устгахад алдаа гарлаа', color: 'error' })
        // }
    }

    return {
        backgrounds,
        addBackground,
        removeBackground,
        fetchShop,
        shop
    }
}
