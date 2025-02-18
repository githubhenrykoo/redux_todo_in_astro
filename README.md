# Todo App with Redux in Astro

A modern Todo application built with Astro, React, and Redux, demonstrating a data-driven, functionally pure approach to state management. Built on the foundational principle of Single Source of Truth (SSoT), this project showcases how complex behaviors can be encoded in version-controlled data structures rather than hand-written code. By leveraging the Flux architectural pattern through Redux, the system ensures unidirectional data flow and predictable state mutations, creating a reliable foundation for self-improving workflows.

This project implements a data-driven, functionally pure framework for an AI-powered [Progressive Knowledge Container](./Personal%20Knowledge%20Container.md) (PKC), built on the foundational principle of Single Source of Truth (SSoT). By adopting the Flux architectural pattern, the system ensures that all state changes flow unidirectionally through version-controlled data structures, creating a reliable foundation for machine learning workflows. Built as a Progressive Web App (PWA) using JavaScript and WASM, it minimizes hand-written code in favor of version-controlled data structures that define not only system behavior, but also the functionality and configurations of user interfaces. The framework serves as a thin orchestration layer that composes pure functions based on declarative configurations, connecting external data stores (LLMs, SQLite, IndexedDB) with a browser-based interface. At its core, the system creates a self-improving workflow that iteratively refines both its knowledge base and operational patterns through structured data management, with each iteration maintaining SSoT through Flux's predictable state mutations. By encoding complex behaviors, user interface configurations, and functionality in data rather than code, the system can learn and evolve its own workflows while maintaining functional simplicity and predictability, all while ensuring data consistency through version-controlled state management.

## 🏛️ Architectural Principles

- **Single Source of Truth (SSoT)**: Redux serves as the central state management system, ensuring consistent and predictable data flow throughout the application
- **Functional Purity**: Embraces pure functions and immutable state updates to reduce side effects and enhance code reliability
- **Data-Driven Architecture**: Leverages structured data configurations to drive complex behaviors, reducing manual code maintenance
- **Flux Architecture**: Implements unidirectional data flow pattern for predictable state updates and improved debugging
- **Continuous Evolution**: Supports iterative improvements through modular design and data-centric architecture

For detailed architectural decisions and implementation patterns, see [Architecture Decisions](src/assets/md/ArchitectureDecisions.md).

## 🚀 Features

- Add and remove todos with real-time updates
- Real-time search functionality
- Action histor
- Resizable panel layout
- Modern, responsive UI with dark theme support
- Client-side state management with Redux
- Hybrid rendering using Astro and React components

## 🛠️ Technical Stack

### Core Technologies
- **Astro**: Main framework providing excellent performance and hybrid rendering
- **React**: Used for interactive components and state management
- **Redux Toolkit**: Implementation of Flux pattern for SSoT and unidirectional data flow
- **TailwindCSS**: Utility-first CSS framework for styling

### Key Libraries
- **react-icons**: Comprehensive icon collection
- **@reduxjs/toolkit**: Simplified Redux development
- **react-resizable-panels**: Flexible panel layout system

## 📦 Project Organization

```
src/
├── assets/
│   ├── md/                    # Architectural documentation and knowledge base
│   │   ├── ArchitectureDecisions.md
│   │   ├── AgenticWorkflowDesign.md
│   │   ├── MultiPanelDesignConcerns.md
│   │   └── PanelSystemPatterns.md
├── components/
│   ├── panels/               # Panel-based components
│   │   ├── TopBanner.astro
│   │   ├── Sidebar.astro
│   │   ├── SearchAndTodos.jsx
│   │   ├── GeneratePanel.jsx
│   │   ├── ContentDetail.jsx
│   │   ├── ActionLogPanelReact.jsx
│   │   └── ResizablePanels.astro
│   ├── ui/                   # Shared UI components
│   │   ├── ContentDetailView.jsx
│   │   ├── ContentEditor.tsx
│   │   ├── PanelLabel.astro
│   │   ├── ResizeHandle.jsx
│   │   └── placeholder/      # UI state management templates
├── content/                  # Data-driven content management
│   ├── model/               # Core data models and type systems
│   │   ├── card-collection.js
│   │   ├── content_type_detector.js
│   │   ├── database_schemas.js
│   │   ├── event-producer.js
│   │   └── hash/            # Content integrity management
├── features/                # Redux slices for state management
├── layouts/                 # Layout components and templates
├── lib/                    # Utility functions and helpers
├── pages/                  # Astro page routes
└── styles/                 # Global styles and theming
```

## 🏗️ Project Structure

### Data Layer Components

#### Content Model
1. **Card Collection** (`content/model/card-collection.js`)
   - Core data structure implementation
   - Version-controlled content management
   - Event-driven state updates

2. **Type System** (`content/model/content_type_detector.js`)
   - Content type detection and validation
   - Data structure integrity checks
   - Schema enforcement

3. **Event Producer** (`content/model/event-producer.js`)
   - Event-driven architecture implementation
   - State change propagation
   - Flux pattern integration

### UI Components

#### Panel System
1. **ResizablePanels** (`components/panels/ResizablePanels.astro`)
   - Data-driven layout management
   - Pure functional component composition
   - Dynamic panel organization

2. **Content Panels**
   - Search and Generation (`panels/SearchAndTodos.jsx`, `panels/GeneratePanel.jsx`)
   - Content Display (`panels/ContentDetail.jsx`)
   - Action Logging (`panels/ActionLogPanelReact.jsx`)

3. **UI Elements** (`components/ui/`)
   - Reusable pure components
   - State-driven placeholders
   - Type-safe content editors

### Documentation
- Comprehensive architectural documentation in `assets/md/`
- Design patterns and decisions
- System workflow specifications

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

## Project Documentation

### To-Do Plan Subproject

This repository includes a subproject `to-do-plan` located in the `Docs/to-do-plan` directory. It provides additional documentation and resources related to the project.

#### Accessing the Subproject

To clone the repository with the subproject:
```bash
git clone --recursive git@github.com:benkoo/redux_todo_in_astro.git
```

Or after cloning, initialize the submodule:
```bash
git submodule init
git submodule update
```

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
