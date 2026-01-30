# Frontend Project - React + Tailwind CSS

A modern frontend scaffolding with React, Vite, and Tailwind CSS.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

This will start the Vite dev server at `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
frontend-project/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # React components
│   │   └── HomeStockCard.jsx
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Tailwind directives
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── postcss.config.js   # PostCSS configuration
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS transformations
- **Autoprefixer** - Automatic vendor prefixing

## 💡 Usage Tips

### Tailwind CSS
Use Tailwind's utility classes directly in your JSX:
```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Hello World
</div>
```

### Creating New Components
Add new components in `src/components/`:
```jsx
// src/components/MyComponent.jsx
export default function MyComponent() {
  return <div>My Component</div>
}
```

### Importing Components
```jsx
import MyComponent from './components/MyComponent'
```

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 🎨 Customizing Tailwind

Edit `tailwind.config.js` to customize your theme:
```js
theme: {
  extend: {
    colors: {
      'brand': '#your-color',
    },
  },
}
```

Happy coding! 🎉
