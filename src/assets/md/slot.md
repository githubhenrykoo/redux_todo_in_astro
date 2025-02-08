---
modified: 2025-02-08T09:15:35+08:00
created: 2025-02-08T08:56:50+08:00
title: slot in Astro
subject: slot, Islands Architecture, reusability, MVC, Astro Islands
authors: ChatGPT
---

In **Astro**, the `<slot />` component is a **placeholder** that allows you to pass content dynamically into an Astro component. It’s similar to **children props in React** or **transclusion in Vue and Svelte**. Slots make it easy to create **reusable layouts and UI components**.

---

## **🔹 Basic Usage of `<slot />`**

A slot is a **dynamic content placeholder** inside an Astro component. When you use the component elsewhere, the slot will be **replaced** by the content you pass.

### **Example: Creating a Layout Component**


```markdown
--- 
// src/layouts/BaseLayout.astro 
const { title } = Astro.props; 
---  
<html>   
	<head>     
		<title>{title}</title>   
	</head>   
	<body>     
		<header>       
			<h1>{title}</h1>     
		</header>     
		<main>       
			<slot />     
		</main>     
		<footer>© 2025 My Website</footer>   
	</body> 
</html>
```
### **Using the Layout in a Page**

```
--- 
// src/pages/index.astro 
import BaseLayout from "../layouts/BaseLayout.astro"; 
---  
<BaseLayout title="Welcome!">   
	<p>This content is passed into the slot.</p> 
</BaseLayout>
```

🔹 **Output (Rendered HTML)**

```html
<html>   
	<head>     
		<title>Welcome!</title>   
	</head>   
	<body>     
		<header>       
			<h1>Welcome!</h1>     
		</header>     
		<main>       
			<p>This content is passed into the slot.</p> 
		</main>     
		<footer>© 2025 My Website</footer>   
	</body> 
</html>
```

✅ The `<slot />` was **replaced by the `<p>` tag** inside `<BaseLayout>`.

---

## **🔹 Named Slots (`<slot name="...">`)**

If you want multiple content sections, you can **name** your slots.

### **Example: Using Named Slots in a Layout**

```html
--- 
// src/layouts/NamedLayout.astro 
---  
<html>   
	<body>     
		<header>       
			<slot name="header" />     
		</header>     
		<main>       
			<slot />     
		</main>     
			<footer>       
				<slot name="footer">Default Footer Content</slot>   
			</footer>   
	</body> 
</html>
```

### **Using Named Slots in a Page**

```markdown
--- 
// src/pages/home.astro 
import NamedLayout from "../layouts/NamedLayout.astro"; 
---  
<NamedLayout>   
	<p>Main Content Here</p>    
	<div slot="header">     
		<h1>Custom Header</h1>   
	</div>    
		<div slot="footer">     
		<p>Custom Footer</p>   
	</div> 
</NamedLayout>`
```

🔹 **Rendered Output**

```markdown
<html>   
	<body>     
		<header>       
			<div>
				<h1>Custom Header</h1>
			</div>     
		</header>     
		<main>       
			<p>Main Content Here</p>     
		</main>     
		<footer>       
			<div><p>Custom Footer</p></div>     
		</footer>   
	</body> 
</html>`
```

✅ **Slots are replaced dynamically**, and any slot **without content falls back** to its default.

---

## **🔹 Using Slots with React Islands**

Astro **prefers static content**, but **React Islands** allow adding interactivity. Slots work well with React components!

### **Example: React Component in a Slot**

#### **1. Create a React Counter Component**

```jsx
// src/components/Counter.jsx 
import React, { useState } from "react";  
export default function Counter() {   
	const [count, setCount] = useState(0);      
	return (     
		<div>       
			<p>Count: {count}</p>       
			<button onClick={() => 
				setCount(count + 1)}>Increment</button>     
		</div>   
	); 
}
```

#### **2. Use It in an Astro Layout**

```markdown
---
// src/layouts/ReactLayout.astro 
---  
<html>   
	<body>     
		<main>       
			<slot />     
		</main>     
		<aside>       
			<slot name="sidebar" />     
		</aside>   
	</body> 
</html>
```

#### **3. Insert the React Component into a Page**

```markdown
--- 
// src/pages/index.astro 
import ReactLayout from "../layouts/ReactLayout.astro"; 
import Counter from "../components/Counter.jsx"; 
---  
<ReactLayout>   
	<h1>Main Content</h1>    
	<Counter client:load slot="sidebar" /> 
</ReactLayout>
```

✅ The **React Counter is dynamically inserted** into the `<slot name="sidebar">`.

---

## **🔹 Summary**

|Feature|Description|
|---|---|
|`<slot />`|Default slot for inserting content.|
|`<slot name="..."/>`|Named slots for multiple sections.|
|Default Slot Content|Provides fallback content when no content is passed.|
|Works with React|You can use [[React Islands]] inside slots for interactivity.|

Slots make **Astro components reusable, flexible, and optimized**, letting you **structure layouts dynamically** while keeping interactivity minimal! 🚀

# References
```dataview 
Table title as Title, authors as Authors
where contains(subject, "slot")
sort title, authors, modified
```