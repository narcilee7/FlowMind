import localforage from "localforage"
import { serialize } from "@/utils/serialize"

const useStorage = () => {
    const getItem = (key: string ) => {
        const value = localforage.getItem(key)
        return value
    }

    const setItem = (key: string, value: any) => {
        let targetValue = value
        try {
            targetValue = serialize(value)
        } catch (error) {
            console.error(error)
        }
        localforage.setItem(key, targetValue)
    }

    const removeItem = (key: string) => {
        try {
            localforage.removeItem(key)
        } catch (error) {
            console.error(error)
        }
    }

    const clear = () => {
        try {
            localforage.clear()
        } catch (error) {
            console.error(error)
        }
    }

    return { 
        getItem,
        setItem, 
        removeItem, 
        clear,
    }
}

export default useStorage