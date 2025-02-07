---
modified: 2025-02-07T05:58:44+08:00
---
### **Functional Programming Perspective on Astro’s `<slot />` for Resizable Panels**

In functional programming (FP), we emphasize **pure functions, immutability, and declarative composition**. Let’s break down how this **Astro-based implementation** aligns with FP principles and how we handle **side effects**, such as resizing.

---

## **1. Functional Composition with `<slot />`**

Astro’s `<slot />` enables **declarative composition**, similar to **higher-order functions** in FP. Instead of directly managing panel content, `ResizablePanel.astro` is a **pure function** in a declarative UI model:

```HTML
<ResizablePanel defaultSize={30} minSize={20}>   
	<h2>Search and Todos</h2> 
</ResizablePanel>
```


✅ **Analogous to**:

- A function taking a function as an argument (`higher-order function`).
- Using `map` to transform a list (we transform UI slots dynamically).

**Functional Benefit:**

- **Stateless composition**: Each panel is **independent**, and its contents are **purely passed in** without modifying global state.

---

## **2. Avoiding Side Effects in UI Composition**

Functional programming seeks to **minimize side effects**. In Astro, side effects occur when modifying the **DOM (Document Object Model)**, such as handling **drag-based resizing**.

**Avoiding Direct Mutation:**  
We ensure that `ResizablePanel.astro` **doesn’t directly mutate state** but instead exposes **props** (`defaultSize`, `minSize`), much like **pure functions taking arguments**.

```js
const { defaultSize = 30, minSize = 20 } = Astro.props;
```

✅ **Functional Benefit:**

- **No shared mutable state**—each panel is independent.
- **Predictable UI**—props determine the layout declaratively.

---

## **3. Managing Side Effects in a Pure Way (Resizing Logic)**

### **How to Handle Resizing?**

Since **panel resizing is a side effect** (modifies UI), we should isolate this effect **outside the core UI logic**, aligning with FP principles.

### **Using a Declarative Alpine.js Approach**

Instead of imperative DOM manipulation (`document.querySelector`), we use Alpine.js (a minimal reactive framework) for **state isolation**:


```markdown
<ResizablePanel 
	defaultSize={30} minSize={20} x-data="{ size: 30 }">   
		<h2>Search and Todos</h2> 
</ResizablePanel>  

<div @mousedown="startResize" class="resize-handle">
</div>  
<script>   
function startResize(event) {     // Pure function updating a reactive store (Alpine state)     
	function updateSize(newSize) {       
		this.size = Math.max(20, Math.min(newSize, 80));     
	}      
	document.onmousemove = (e) => updateSize(e.clientX);    
	document.onmouseup = () => (document.onmousemove = null);   
} 
</script>
```



✅ **Functional Benefit:**

- **Pure state updates** (`updateSize` is isolated).
- **No direct DOM mutation**—reactive state (`size`) drives UI updates.

---

### **Conclusion: FP & Side Effects in Astro**

|Functional Concept|Astro Implementation|
|---|---|
|**Declarative Composition**|`<slot />` for passing UI as pure functions|
|**Immutability**|Props (`defaultSize`, `minSize`) ensure pure components|
|**Side Effect Isolation**|Resizing logic is **separate from rendering** (Alpine.js manages effects)|
|**Predictable State**|No direct mutations; state updates trigger UI changes|

### **Final Thought**

To stay **pure**, the UI structure should be **purely declarative**, while side effects (like resizing) should be **isolated in event-driven logic**. **Would you like a more advanced state management solution, such as using Signals or Redux Toolkit with Astro?** 🚀

# References
```dataview 
Table title as Title, authors as Authors
where contains(subject, "undefined")
sort title, authors, modified
```