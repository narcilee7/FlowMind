// 重新导出新的useTheme hook
import { useTheme as useThemeNew, useAppState } from './useAppState'
export type { Theme } from './useAppState'

export const useTheme = useThemeNew
export { useAppState }

export default useTheme