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

## MCard Implementation

### Overview

A foundational content management system that integrates Redux with Astro's Content Layer, utilizing MCard for content-addressable storage. This system implements an algebraically closed data structure that enables individual knowledge owners to manage their personal namespace of hash-value-based data content.

### Core Features

#### Content Management
- Content-addressable storage using cryptographic hashes
- Microsecond-precision temporal ordering
- Cross-platform compatibility (JavaScript/Python)
- Full-text search capabilities
- Bidirectional synchronization

#### UI Components
- Retractable mini and wide sidebar
- Scrollable sidebar menu
- Sheet menu for mobile
- Grouped menu with labels
- Collapsible submenu

### Architecture

#### MCard Core
The system uses a unified `Card_Collection` class for both client-side and server-side content management:

```typescript
interface MCard {
  content: Buffer;          // The actual data being stored
  hash: string;            // Cryptographic hash of content
  g_time: string;         // Timezone-aware timestamp
  content_type: string;   // Content type identifier
}
```

#### Data Schema
Primary table structure in SQLite:
```sql
CREATE TABLE card (
  hash TEXT PRIMARY KEY,    -- Unique identifier
  content BLOB NOT NULL,    -- Binary or UTF-8 encoded data
  g_time TEXT NOT NULL     -- Global timestamp
);

-- Full-text search support
CREATE VIRTUAL TABLE documents USING fts5(content);
```

#### Directory Structure
```
src/
├── content/           # Content management
│   ├── model/        # Core data models
│   └── collections/  # Astro collections
├── components/       # React components
├── integrations/     # External integrations
├── network/         # P2P networking
└── storage/         # Storage engines
```

### Tech Stack

#### Frontend
- Astro
- React
- Redux
- Shadcn/ui
- Tailwind CSS
- TypeScript

#### Backend
- SQLite
- Astro DB
- libP2P

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Initialize database:
```bash
npm run init-db
```

### Core Concepts

#### Content Integrity
- Every piece of content is uniquely identified by its hash
- Multiple hash algorithms supported (SHA-256 default)
- Collision detection and resolution
- Content type validation

#### Storage Management
- Local SQLite storage
- Astro DB integration
- P2P content distribution
- Automatic synchronization

#### Search Capabilities
- Full-text search using FTS5
- Content type filtering
- Temporal queries
- Hash-based lookups

### Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### License

[License details here]
