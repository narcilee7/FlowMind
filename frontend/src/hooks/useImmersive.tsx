/**
 * 沉浸式模式钩子
 */

import { useAppStore } from "src/stores/app-store"

export const useImmersive = () => {
    const { immersive, setImmersive } = useAppStore()

    return { immersive, setImmersive }
}