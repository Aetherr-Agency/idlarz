# Idle Game

A modern idle/incremental game built with Next.js 14, Tailwind CSS, and Zustand.

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling
- **Zustand**: For state management with persistence
- **tailwind-merge**: For conditional class merging

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/         
│   └── ui/             # Reusable UI components
└── stores/             # Zustand stores
    └── gameStore.ts    # Main game state management
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the game.

## Game Features

- Resource management (Gold)
- Persistent game state using Zustand
- Responsive design with Tailwind CSS
- Dark mode support

## Development

The project follows modern React best practices:
- TypeScript for type safety
- Component-based architecture
- Zustand for simple but powerful state management
- Persistent storage to save game progress
- Tailwind CSS for utility-first styling
