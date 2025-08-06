import { EditorConfig } from "@/components/Editor/types/EditorConfig"
import { defaultEditorConfig } from "./EditorConfig"


export class EditorConfigManager {
    private static instance: EditorConfigManager

    private config: EditorConfig

    private listeners: Set<(config: EditorConfig) => void> = new Set()

    private constructor() {
        this.config = this.loadConfig()
    }

    static getInstance(): EditorConfigManager {
        if (!EditorConfigManager.instance) {
            EditorConfigManager.instance = new EditorConfigManager()
        }
        return EditorConfigManager.instance
    }

    getConfig(): EditorConfig {
        return this.config
    }

    updateConfig(updates: Partial<EditorConfig>): void {
        this.config = { ...this.config, ...updates }
        this.saveConfig()
        this.notifyListeners()
    }

    resetConfig(): void {
        this.config = { ...defaultEditorConfig }
        this.saveConfig()
        this.notifyListeners()
    }

    get<K extends keyof EditorConfig>(key: K): EditorConfig[K] {
        return this.config[key]
    }

    set<K extends keyof EditorConfig>(key: K, value: EditorConfig[K]): void {
        this.config[key] = value
        this.saveConfig()
        this.notifyListeners()
    }

    subscribe(listener: (config: EditorConfig) => void): () => void {
        this.listeners.add(listener)
        return () => {
            this.listeners.delete(listener)
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.config))
    }

    private loadConfig(): EditorConfig {
        try {
            const saved = localStorage.getItem('flowmind-editor-config')
            if (saved) {
                const parsed = JSON.parse(saved)
                return { ...defaultEditorConfig, ...parsed }
            }
        } catch (error) {
            console.error('Failed to load editor config:', error)
        }
        return { ...defaultEditorConfig }
    }

    private saveConfig(): void {
        try {
            localStorage.setItem('flowmind-editor-config', JSON.stringify(this.config))
        } catch (error) {
            console.error('Failed to save editor config:', error)
        }
    }
}

export const editorConfigManager = EditorConfigManager.getInstance()