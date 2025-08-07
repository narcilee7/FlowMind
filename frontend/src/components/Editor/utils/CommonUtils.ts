/**
 * 通用工具函数
 */

const generateRandomId = (): string => {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const debounce = <T extends (...args: any[]) => any>(
    callback: T,
    wait: number
): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout | null = null
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => callback(...args), wait)
    }
}

const throttle = <T extends (...args: any[]) => any>(
    callback: T,
    wait: number
): (...args: Parameters<T>) => void => {
    let lastTime = 0
    return (...args: Parameters<T>) => {
        const now = Date.now()
        if (now - lastTime >= wait) {
            callback(...args)
            lastTime = now
        }
    }
}

export {
    generateRandomId,
    debounce,
    throttle
}


