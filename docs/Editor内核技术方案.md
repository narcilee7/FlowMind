# Editor内核前端技术方案

## **1. 整体设计思路：Adapter Factory + 插件模式**

这个设计模式的核心思想是：

* **编辑器内核 (Editor Core)**：只负责最基本的功能，如文档状态管理、事件广播、光标位置。它是一个通用的、不关心具体渲染和功能的**抽象层**。
* **适配器工厂 (Adapter Factory)**：负责根据用户需求，**创建不同类型的适配器 (Adapter)**。每个适配器负责将通用内核的事件和状态，转换为特定视图（富文本、知识图谱、Canvas 等）所需的格式和指令。
* **插件 (Plugin)**：是功能扩展的最小单元。每个插件实现一个具体功能（如 AI 补全、语法高亮、图片上传）。插件通过订阅内核的事件，并在需要时调用适配器的方法来修改视图或文档。

---

### **2. 核心模块详细设计**

#### **2.1. 编辑器内核 (Editor Core)**

这是整个系统的中枢神经，基于 **Tiptap/ProseMirror** 的核心能力进行封装。

* **文档状态管理 (Document State Management)**：维护一份**语义化 AST** 的文档状态。这是唯一的数据源，所有视图都从这里获取数据。
* **事件广播系统 (Event Bus)**：
    * **通用事件**：`doc.updated`, `selection.changed`, `content.changed`。这些是所有插件和适配器都会监听的事件。
    * **自定义事件**：`ai.request`, `file.upload`, `link.insert`。这些是插件为了特定功能而触发的事件。
* **命令系统 (Command System)**：提供一套统一的 API，让插件可以安全地修改文档状态，如 `core.insertNode(node)`, `core.updateMark(mark)`。

#### **2.2. 适配器工厂 (Adapter Factory)**

这是一个工厂类，根据传入的参数创建并返回对应的视图适配器。

* **`createAdapter(type: AdapterType, options: AdapterOptions)`**
    * `type`: 一个枚举值，如 `'richtext'`, `'graph'`, `'canvas'`.
    * `options`: 包含视图容器（`DOM Element`）、初始数据等。
* **`AdapterType` 枚举**：
    * `RICHTEXT`: 对应富文本编辑器视图。
    * `GRAPH`: 对应知识图谱视图。
    * `CANVAS`: 对应白板视图。

#### **2.3. 视图适配器 (View Adapters)**

每个适配器都实现了统一的接口，但内部逻辑完全不同。

* **接口定义**：`IAdapter`
    * `init(core: EditorCore)`: 初始化方法，传入内核实例，注册监听器。
    * `render(data: ASTNode)`: 将 AST 数据渲染到视图。
    * `update(data: ASTNode)`: 增量更新视图。
    * `focus()`: 设置焦点。
    * `destroy()`: 销毁视图，释放资源。

* **具体实现**：
    1.  **`RichTextAdapter`**：
        * **内部实现**：基于 **Tiptap/ProseMirror** 自身的渲染引擎。
        * **核心职责**：将 AST 直接渲染为可编辑的富文本 DOM。它监听 `core.content.changed` 事件，并更新 ProseMirror 的状态。
    2.  **`GraphAdapter`**：
        * **内部实现**：使用 **vis-network** 或 **D3.js** 等图谱渲染库。
        * **核心职责**：将 AST 中包含的**图谱节点和边数据**（例如，`{ type: 'graphNode', data: { id: '...', content: '...' } }`）提取出来，并渲染成图谱视图。它会监听 `core.doc.updated` 事件，实时更新图谱。
    3.  **`CanvasAdapter`**：
        * **内部实现**：使用 **Fabric.js** 或 **Konva.js** 等 Canvas 渲染库。
        * **核心职责**：将 AST 中包含的**图形、图片、文本框等数据**渲染到 Canvas 上。

#### **2.4. 插件 (Plugins)**

插件是独立的功能单元，通过注册到内核来生效。

* **插件接口**：`IPlugin`
    * `name`: 插件名称，如 `'ai-completion'`, `'image-upload'`.
    * `init(core: EditorCore, adapter: IAdapter)`: 插件初始化方法，传入内核和当前视图适配器。
    * `onEvent(event: string, payload: any)`: 监听特定事件，并执行逻辑。
    * `destroy()`: 销毁插件。

* **插件示例**：
    1.  **`AICompletionPlugin`**：
        * **监听事件**：`doc.updated`, `selection.changed`。
        * **核心逻辑**：当用户输入特定字符（如 `/` 或空格）时，分析上下文，调用 AI API，并将 AI 返回的内容通过**内核的命令系统** (`core.insertNode`) 插入到文档中。
    2.  **`KnowledgeGraphPlugin`**：
        * **监听事件**：`doc.updated`。
        * **核心逻辑**：当文档更新时，调用**后端知识抽取服务**，识别文档中的实体和关系，并将这些信息更新到**后端知识图谱数据库**。同时，它可以通过**适配器** (`adapter.update`) 触发图谱视图的更新。
    3.  **`ImageUploadPlugin`**：
        * **监听事件**：`file.upload`。
        * **核心逻辑**：监听文件上传事件，调用**后端存储服务**，获取图片 URL，然后通过**内核的命令系统** (`core.insertNode`) 将图片节点插入到文档中。

---

### **3. 完整的用户工作流**

1.  **加载文档**：
    * 前端从后端获取一篇文档的 **JSON AST 数据**。
    * **适配器工厂**根据用户偏好（或文档元数据），创建并初始化一个**富文本适配器**。
    * 内核将 JSON AST 传给适配器，适配器渲染出富文本视图。

2.  **用户编辑**：
    * 用户在富文本视图中输入内容。
    * Tiptap 将 DOM 变化同步到内核的 AST 状态，并触发 `doc.updated` 事件。
    * `AICompletionPlugin` 监听 `doc.updated`，分析上下文，向用户提供 AI 补全建议。
    * `KnowledgeGraphPlugin` 监听 `doc.updated`，在后台更新知识图谱。

3.  **切换视图**：
    * 用户点击“切换到图谱视图”按钮。
    * 前端销毁当前的富文本适配器，并使用**适配器工厂**创建一个新的**图谱适配器**。
    * 新的适配器从内核获取 AST 数据，并渲染成图谱视图。
    * 此时，所有插件仍然在运行，但它们会通过**新的适配器**来与视图交互（例如，`AICompletionPlugin` 可能会提供与图谱相关的 AI 建议）。

---

### **4. 总结与优势**

这个设计模式的完整性体现在：

* **清晰的职责分离**：内核、适配器、插件各司其职，互不干涉。
* **高度可扩展**：添加新功能，只需开发一个插件；添加新视图，只需开发一个适配器。
* **解耦**：核心内核与具体的渲染视图完全解耦，实现了“多形态编辑器”的核心目标。
* **云原生兼容**：所有操作都围绕**抽象的 AST** 和**事件**进行，非常适合与云端实时同步、版本控制等服务集成。