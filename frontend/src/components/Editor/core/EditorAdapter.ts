import { EditorAdapter, EditorFactory } from "../types"

// 编辑器注册表
export class EditorRegistry {
  private static adapters = new Map<string, EditorFactory>()
  
  static register(name: string, factory: EditorFactory): void {
    this.adapters.set(name, factory)
  }
  
  static get(name: string): EditorFactory | undefined {
    return this.adapters.get(name)
  }
  
  static list(): string[] {
    return Array.from(this.adapters.keys())
  }
  
  static create(name: string): EditorAdapter | null {
    const factory = this.get(name)
    return factory ? factory.createAdapter() : null
  }
}
