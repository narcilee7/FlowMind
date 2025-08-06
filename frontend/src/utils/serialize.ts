/**
 * 序列化工具
 */

export function serialize(data: any): string | undefined {
    try {
        return JSON.stringify(data)
    } catch (error) {
        console.error('Error serializing data:', error)
        return undefined
    }
}

export function deserialize(data: string): any | undefined {
    try {
        return JSON.parse(data)
    } catch (error) {
        console.error('Error deserializing data:', error)
        return undefined
    }
}