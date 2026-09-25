export interface PictureItem {
  id: string;
  url: string;
  title: string;
  fallbackGradient?: string;
  aspect?: string;
}

export interface PicturePack {
  id: string;
  name: string;
  description: string;
  theme: string;
  pictures: PictureItem[];
}

export const CURATED_PICTURE_PACKS: PicturePack[] = [
  {
    id: "cyberpunk",
    name: "Cyberpunk & Neon Cityscapes",
    description: "High-contrast neon alleyways, holographic towers, and glowing wet streets.",
    theme: "from-cyan-900 via-purple-900 to-pink-900",
    pictures: [
      {
        id: "cyber-1",
        url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1400&auto=format&fit=crop",
        title: "Neon Rain Metropolis",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #030712 100%)",
      },
      {
        id: "cyber-2",
        url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1400&auto=format&fit=crop",
        title: "Arcade Glow Alley",
        fallbackGradient: "radial-gradient(circle at 60% 40%, #831843 0%, #030712 100%)",
      },
      {
        id: "cyber-3",
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1400&auto=format&fit=crop",
        title: "Cyber Highway Horizon",
        fallbackGradient: "radial-gradient(circle at 40% 60%, #134e4a 0%, #022c22 100%)",
      },
      {
        id: "cyber-4",
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1400&auto=format&fit=crop",
        title: "Tokyo Midnight Reflections",
        fallbackGradient: "radial-gradient(circle at 70% 30%, #581c87 0%, #09090b 100%)",
      },
      {
        id: "cyber-5",
        url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1400&auto=format&fit=crop",
        title: "Futuristic Sky Bridge",
        fallbackGradient: "radial-gradient(circle at 30% 70%, #0e7490 0%, #030712 100%)",
      },
      {
        id: "cyber-6",
        url: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1400&auto=format&fit=crop",
        title: "Laser Grid Horizon",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #be185d 0%, #111827 100%)",
      },
    ],
  },
  {
    id: "cosmos",
    name: "Cosmic Nebulae & Deep Space",
    description: "Explosive stellar nurseries, spiral galaxies, auroras, and interstellar dust.",
    theme: "from-indigo-950 via-purple-950 to-blue-950",
    pictures: [
      {
        id: "cosmos-1",
        url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1400&auto=format&fit=crop",
        title: "Orion Stellar Furnace",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #4c1d95 0%, #020617 100%)",
      },
      {
        id: "cosmos-2",
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1400&auto=format&fit=crop",
        title: "Deep Space Violet Nebula",
        fallbackGradient: "radial-gradient(circle at 60% 40%, #312e81 0%, #020617 100%)",
      },
      {
        id: "cosmos-3",
        url: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1400&auto=format&fit=crop",
        title: "Supernova Remnant Core",
        fallbackGradient: "radial-gradient(circle at 40% 50%, #701a75 0%, #020617 100%)",
      },
      {
        id: "cosmos-4",
        url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1400&auto=format&fit=crop",
        title: "Interstellar Dust Cloud",
        fallbackGradient: "radial-gradient(circle at 50% 30%, #1e3a8a 0%, #020617 100%)",
      },
      {
        id: "cosmos-5",
        url: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1400&auto=format&fit=crop",
        title: "Cosmic Aurora Borealis",
        fallbackGradient: "radial-gradient(circle at 50% 70%, #065f46 0%, #020617 100%)",
      },
      {
        id: "cosmos-6",
        url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1400&auto=format&fit=crop",
        title: "Earth Atmospheric Halo",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #0369a1 0%, #020617 100%)",
      },
    ],
  },
  {
    id: "abstract-3d",
    name: "3D Generative & Geometric Art",
    description: "Surreal parametric structures, iridescent fluids, and kinetic glass prisms.",
    theme: "from-amber-950 via-rose-950 to-neutral-950",
    pictures: [
      {
        id: "abs-1",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1400&auto=format&fit=crop",
        title: "Liquid Hologram Wave",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #9f1239 0%, #18181b 100%)",
      },
      {
        id: "abs-2",
        url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1400&auto=format&fit=crop",
        title: "Prismatic Prism Dispersion",
        fallbackGradient: "radial-gradient(circle at 60% 40%, #065f46 0%, #18181b 100%)",
      },
      {
        id: "abs-3",
        url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1400&auto=format&fit=crop",
        title: "Toroidal Kinetic Sculpture",
        fallbackGradient: "radial-gradient(circle at 40% 60%, #b45309 0%, #18181b 100%)",
      },
      {
        id: "abs-4",
        url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1400&auto=format&fit=crop",
        title: "Iridescent Chrome Ribbon",
        fallbackGradient: "radial-gradient(circle at 70% 30%, #7e22ce 0%, #18181b 100%)",
      },
      {
        id: "abs-5",
        url: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1400&auto=format&fit=crop",
        title: "Topographic Wireframe Void",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #0e7490 0%, #18181b 100%)",
      },
      {
        id: "abs-6",
        url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop",
        title: "Surreal Golden Sphere Bloom",
        fallbackGradient: "radial-gradient(circle at 30% 70%, #d97706 0%, #18181b 100%)",
      },
    ],
  },
  {
    id: "vaporwave",
    name: "Retro Synth & Vaporwave",
    description: "80s outrun sunsets, wireframe grids, VHS analog noise, and pastel palettes.",
    theme: "from-fuchsia-950 via-pink-950 to-cyan-950",
    pictures: [
      {
        id: "vhs-1",
        url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1400&auto=format&fit=crop",
        title: "Purple Synthwave Sunset",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #a21caf 0%, #09090b 100%)",
      },
      {
        id: "vhs-2",
        url: "https://images.unsplash.com/photo-1550684847-75bdda21cc95?q=80&w=1400&auto=format&fit=crop",
        title: "Vapor Neon Palm Silhouette",
        fallbackGradient: "radial-gradient(circle at 60% 40%, #0284c7 0%, #09090b 100%)",
      },
      {
        id: "vhs-3",
        url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1400&auto=format&fit=crop",
        title: "Retrowave City Night",
        fallbackGradient: "radial-gradient(circle at 40% 60%, #e11d48 0%, #09090b 100%)",
      },
      {
        id: "vhs-4",
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1400&auto=format&fit=crop",
        title: "Cyber Sunset Gridline",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #4338ca 0%, #09090b 100%)",
      },
      {
        id: "vhs-5",
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1400&auto=format&fit=crop",
        title: "Glitch Dreamscape Corridor",
        fallbackGradient: "radial-gradient(circle at 70% 30%, #15803d 0%, #09090b 100%)",
      },
      {
        id: "vhs-6",
        url: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1400&auto=format&fit=crop",
        title: "Outrun Laser Grid Horizon",
        fallbackGradient: "radial-gradient(circle at 50% 50%, #c026d3 0%, #09090b 100%)",
      },
    ],
  },
];
