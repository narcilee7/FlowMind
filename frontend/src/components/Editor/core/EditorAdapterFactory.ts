import { EditorAdapter, EditorType, SceneTemplate } from '@/components/Editor/types'

export default class EditorAdapterFactory {
  private static adapters = new Map<EditorType, new (sceneTemplate: SceneTemplate) => EditorAdapter>()

  static createAdapter(type: EditorType, sceneTemplate: SceneTemplate): EditorAdapter {
    const AdapterInstance = this.adapters.get(type)
    if (!AdapterInstance) {
      throw new Error(`Unsupported editor type: ${type}`)
    }
    return new AdapterInstance(sceneTemplate)
  }
  
  /**
   * 注册编辑器适配器
   * @param type 编辑器类型
   * @param adapterClass 编辑器适配器类实例
   */
  static registerAdapter(
    type: EditorType, 
    adapterClass: new (sceneTemplate: SceneTemplate) => EditorAdapter
  ): void {
    this.adapters.set(type, adapterClass)
  }

  /**
   * 获取支持的编辑器类型
   * @returns 支持的编辑器类型
   */
  static getSupportedTypes(): EditorType[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * 检查是否支持编辑器类型
   * @param type 编辑器类型
   * @returns 是否支持
   */
  static isSupported(type: EditorType): boolean {
    return this.adapters.has(type)
  }

  /**
   * 获取编辑器适配器
   * @param type 编辑器类型
   * @returns 编辑器适配器
   */
  static getAdapter(type: EditorType, sceneTemplate: SceneTemplate): EditorAdapter | null {
    const AdapterInstance = this.adapters.get(type)
    if (!AdapterInstance) {
      return null
    }
    return new AdapterInstance(sceneTemplate)
  }
}