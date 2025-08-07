/**
 * 沉浸式模式钩子
 */

import { useAppStore } from "@/stores/app-store"

export const useImmersive = () => {
    const { immersive, setImmersive } = useAppStore()

    return { immersive, setImmersive }
}