---
modified: 2025-02-07T05:44:21+08:00
created: 2025-02-07T05:34:16+08:00
title: Implementing a Resizable Panel Layout in Astro with the slot tag
subject: slot, Astro
authors: ChatGPT
---
## **Astro-Based Implementation of the Resizable Panel Layout**

### **1. Create a Reusable `ResizablePanel.astro` Component**

This component wraps the panel structure, allowing any content to be passed inside via `<slot />`.

```Markdown
--- 
// ResizablePanel.astro 
const { defaultSize = 30, minSize = 20 } = Astro.props; 
---  
<aside style={`flex: ${defaultSize}%; min-width: ${minSize}%`
		} 
		class="h-full overflow-hidden">   
		<slot /> 
</aside>  
<div class="w-1 bg-slate-200 hover:bg-slate-400 transition-colors cursor-ew-resize">
</div>
```

✅ **Benefits:**

- Accepts `defaultSize` and `minSize` as props.
- Uses `<slot />` to insert any panel content dynamically.
- Includes a simple divider (`div`) to represent a resize handle.

---

### **2. Create the `PanelGroupLayout.astro` Component**

This component defines the overall panel layout and inserts child panels using `<slot />`.

```markdown
--- 
// PanelGroupLayout.astro 
---  
<div class="h-screen flex">   
	<slot /> 
</div>
```

✅ **This provides a flexible container for panel components.**

---

### **3. Use `PanelGroupLayout.astro` in a Page**

Now, let’s assemble everything inside a page or another component.

```markdown
---  
import ResizablePanel from "../components/ResizablePanel.astro"; 
import PanelGroupLayout from "../components/PanelGroupLayout.astro";
---  
<PanelGroupLayout>   
	<ResizablePanel 
		defaultSize={30} minSize={20}>     
	    <h2>Search and Todos</h2>   
    </ResizablePanel>    
    <ResizablePanel defaultSize={40} minSize={30}>     
	    <h2>Item Detail</h2>   
	</ResizablePanel>    
	<ResizablePanel defaultSize={30} minSize={20}>     
		<h2>Action Log</h2>   
	</ResizablePanel> 
</PanelGroupLayout>`
```



✅ **This setup allows easy customization of panels using slots.**

---

### **Key Takeaways**

- **Use `<slot />`** to allow flexible content insertion.
- **Encapsulate reusable logic** in `ResizablePanel.astro`.
- **Keep layout structure separate** with `PanelGroupLayout.astro`.
- **Supports resizing by adjusting `flex` values dynamically** (can extend with JS for true resizing).

See [[Resizable Panel Design Caveats]].

# References
```dataview 
Table title as Title, authors as Authors
where contains(subject, "Astro") or contains(subject, "Layout")
sort title, authors, modified
```