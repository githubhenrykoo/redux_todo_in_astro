---
modified: 2025-02-07T05:41:57+08:00
created: 2025-02-07T05:18:35+08:00
title: Resizable Panel Design Caveats
subject: Resizable Panel Design Caveats
authors: ChatGPT
---
Your current [[React layout example code]] using `react-resizable-panels` is well-structured, but there are some reusable patterns you can apply to improve maintainability and scalability. Below are a few suggestions:


## **1. Extract a Generic `ResizablePanel` Component**

Since each panel follows a similar structure (`Panel` → `div` wrapper → Component), you can abstract it into a reusable component.

### **Refactored Component:**

```tsx
import { Panel, PanelResizeHandle } 
from "react-resizable-panels";  
const ResizablePanel = ({ 
		children, defaultSize, minSize 
	}) => (
	<>     
	<Panel 
		defaultSize={defaultSize} 
		minSize={minSize}>       
		<div className="h-full overflow-hidden">
			{children}
		</div>    
	</Panel>     
	<PanelResizeHandle 
		className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" 
	/>   
	</> 
);
```

### **Usage in `PanelGroupLayout`**

```tsx
<ResizablePanel defaultSize={30} minSize={20}>   
	<SearchAndTodos /> 
</ResizablePanel>  
<Panel>   
	<div className="h-full overflow-hidden">     
		<ItemDetailPanel />   
	</div> 
</Panel>  
<ResizablePanel 
	defaultSize={30} 
	minSize={20}>   
	<ActionLogPanel /> 
</ResizablePanel>
```

This reduces duplication and makes it easy to modify all panels in one place.

---

## **2. Dynamic Panel Configuration via Props**

Instead of hardcoding panels, consider passing a **configuration array** that defines each panel dynamically.

### **Refactored Component with Config Array**

```tsx
const panelConfig = [   
		{ component: <SearchAndTodos />, 
			defaultSize: 30, 
			minSize: 20 
		},   
		{ 
			component: <ItemDetailPanel />, 
			defaultSize: 40, 
			minSize: 20, 
			isMain: true 
		},   
		{ 
			component: <ActionLogPanel />, 
			defaultSize: 30, 
			minSize: 20 
		}, 
	];  
	
const PanelGroupLayout = () => {   
	return (     
		<Provider store={store}>       
		<div className="h-screen overflow-hidden">         
		<PanelGroup direction="horizontal" className="h-full">           
		{panelConfig.map(({ 
			component, 
			defaultSize, 
			minSize, 
			isMain 
		}, 
		index) => (             
			isMain ? (               
				<Panel key={index}>                 
					<div className="h-full overflow-hidden">
						{component}
					</div>               
				</Panel>             
			) : (               
				<ResizablePanel 
					key={index} 
					defaultSize={defaultSize} 
					minSize={minSize}>                 
				{component}               
				</ResizablePanel>             
			)           
		))}         
			</PanelGroup>       
		</div>     
	</Provider>   
	); 
};
```

✅ **Benefits:**

- Easy to add/remove panels by modifying the `panelConfig` array.
- Keeps the component DRY (Don’t Repeat Yourself).

---

## **3. Extract Redux Provider into a Higher-Order Component (HOC)**

If multiple layouts require Redux, wrap them in a provider:

### **Reusable `withReduxProvider` HOC**

```tsx
const withReduxProvider = (Component) => (props) => (   
	<Provider store={store}>     
		<Component {...props} />   
    </Provider> );  
export default withReduxProvider;
```

### **Usage:**

```tsx
export default withReduxProvider(PanelGroupLayout);
```

✅ **Benefit:** Centralizes Redux state management logic.

---

## **4. Store Panel Sizes in Local Storage (User Persistence)**

By default, panel sizes reset on refresh. You can persist panel states using the `onResize` event and `localStorage`.

### **Enhancement:**

```tsx
import { useState, useEffect } from "react";  
const PanelGroupLayout = () => {   
	const [panelSizes, setPanelSizes] = useState(() => {     
		return JSON.parse(localStorage.getItem("panelSizes")) || [30, 40, 30];   });    
	const handleResize = (sizes) => {     
		setPanelSizes(sizes);     
		localStorage.setItem("panelSizes", JSON.stringify(sizes)); 
	};    
	
	return (     
	<Provider store={store}>       
		<div className="h-screen overflow-hidden"> 
        <PanelGroup direction="horizontal" className="h-full" onLayout={handleResize}>           
	        {panelConfig.map(({ component, defaultSize, minSize }, index) => (             
		        <ResizablePanel 
			        key={index} 
			        defaultSize={panelSizes[index]} 
			        minSize={minSize}>               
			        {component}             
				</ResizablePanel>           
			))}         
			</PanelGroup>       
			</div>     
		</Provider>   
	); 
};
```

✅ **Benefit:**

- Users' panel sizes remain consistent across page refreshes.
- Improves **user experience (UX)**.

---

### **Final Thoughts**

By applying these reusable patterns:  
✅ Extracting `ResizablePanel` for reusability  
✅ Using a `panelConfig` array for dynamic layout  
✅ Wrapping Redux logic in an HOC  
✅ Persisting panel sizes for better UX

These approaches should help you **increase maintainability, scalability, and code reusability** for the resizable panel layout. Also see [[Implementing a Resizable Panel Layout in Astro with the slot tag]]

# References
```dataview 
Table title as Title, authors as Authors
where contains(subject, "Resizable Panel")
sort title, authors, modified
```