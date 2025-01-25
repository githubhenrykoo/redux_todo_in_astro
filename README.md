# Todo App with Redux in Astro

A modern Todo application built with Astro, React, and Redux, demonstrating the integration of Redux state management in an Astro application. This project showcases best practices for component architecture, state management, and modern UI design with a panel-based layout system.

## 🚀 Features

- Add and remove todos with real-time updates
- Real-time search functionality
- Action history logging
- Resizable panel layout
- Modern, responsive UI with dark theme support
- Client-side state management with Redux
- Hybrid rendering using Astro and React components

## 🛠️ Technical Stack

### Core Technologies
- **Astro**: Main framework providing excellent performance and hybrid rendering
- **React**: Used for interactive components and state management
- **Redux Toolkit**: State management solution
- **TailwindCSS**: Utility-first CSS framework for styling

### Key Libraries
- **react-icons**: Comprehensive icon collection
- **@reduxjs/toolkit**: Simplified Redux development
- **react-resizable-panels**: Flexible panel layout system

## 🏗️ Project Structure

### Core Components

#### Panel Components
1. **TopBanner** (`panels/TopBanner.astro`)
   - Main navigation header
   - Theme switching functionality
   - Built as an Astro component for static rendering

2. **Sidebar** (`panels/Sidebar.astro`)
   - Navigation sidebar with icon-based menu
   - Static rendering with Astro

3. **SearchAndTodos** (`panels/SearchAndTodos.jsx`)
   - Combines search and todo list functionality
   - React component for interactive features
   - Integrated with Redux for state management

4. **ItemDetailPanel** (`panels/ItemDetailPanel.jsx`)
   - Handles todo creation and editing
   - Form-based interface with validation
   - React component with Redux integration

5. **ActionLogPanel** (`panels/ActionLogPanelReact.jsx`)
   - Displays history of todo actions
   - Real-time updates through Redux
   - React component for dynamic updates

#### Layout Components
1. **ResizablePanels** (`panels/ResizablePanels.astro`)
   - Main layout component
   - Handles panel resizing and organization
   - Built with Astro for optimal performance

2. **DefaultLayout** (`layouts/DefaultLayout.astro`)
   - Base layout template
   - Handles meta tags and global styles
   - Integrates all panel components

3. **PanelGroupLayout** (`layouts/PanelGroupLayout.jsx`)
   - Manages panel organization and Redux provider
   - Handles responsive layout behavior

### State Management
- Redux store configuration in `store.js`
- Todo slice implementation in `features/todoSlice.js`
- Utility functions in `lib/utils.js`

## 📦 Project Organization

```
src/
├── components/
│   ├── panels/                 # Panel-based components
│   │   ├── TopBanner.astro
│   │   ├── Sidebar.astro
│   │   ├── SearchAndTodos.jsx
│   │   ├── ItemDetailPanel.jsx
│   │   ├── ActionLogPanelReact.jsx
│   │   └── ResizablePanels.astro
│   └── ui/                     # Shared UI components
├── features/                   # Redux slices
├── layouts/                    # Layout components
├── lib/                       # Utility functions
├── pages/                     # Astro pages
└── styles/                    # Global styles
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:4321](http://localhost:4321) in your browser

## 🎨 Design Philosophy

This project demonstrates a modern approach to web application architecture by:
- Leveraging Astro's static rendering for performance
- Using React for interactive components
- Implementing a flexible panel-based layout
- Managing state with Redux
- Following responsive design principles
