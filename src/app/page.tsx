'use client';

import axios from 'axios';
import { Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Document {
  _id: string;
  title: string;
  content: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      router.push(`/builder?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Wand2 className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Website Builder AI
          </h1>
          <p className="text-lg text-gray-300">
            Describe your dream website, and we'll help you build it step by step
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website you want to build..."
              className="w-full h-32 p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
              aria-label="Website description"
            />
            <button
              type="submit"
              className="w-full mt-4 bg-blue-600 text-gray-100 py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Generate Website Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// 'use client'

// import { Input } from "@/components/ui/input"
// import { Card } from "@/components/ui/card"
// import { PlusCircle, Search } from 'lucide-react'
// import { Button } from "@/components/ui/button"
// import { ThemeToggle } from "@/components/theme-toggle"
// import Link from "next/link"
// import { CreateProjectDialog } from "@/components/ui/create-project"
// import { useState } from "react"
// import Image from "next/image"

// export default function Home() {
//   const [isDialogOpen, setIsDialogOpen] = useState(false)
//   return (
//     <div className="flex min-h-screen bg-background">
//       {/* Fixed Sidebar */}
//       <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 lg:block">
//         <div className="flex h-full flex-col justify-between">
//           <div className="space-y-6">
//             <div className="flex items-center justify-between">
//               <h2 className="text-lg font-semibold">Dashboard</h2>
//               <ThemeToggle />
//             </div>
//             <nav className="space-y-2">
//               {/* Create Project Button */}
//               <div className="p-4">
//                 <Button
//                   onClick={() => setIsDialogOpen(true)}
//                   className="w-full justify-start"
//                   variant="outline"
//                 >
//                   <PlusCircle className=" h-4 w-4" />
//                   Create New Project
//                 </Button>
//               </div>
//               <a
//                 className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
//                 href="#"
//               >
//                 Tasks
//               </a>
//               <a
//                 className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
//                 href="#"
//               >
//                 Calendar
//               </a>
//             </nav>
//           </div>
//         </div>
//       </aside>

//       {/* Main content - with padding for sidebar */}
//       <main className="flex-1 p-6 lg:pl-72">
//         {/* Search bar */}
//         <div className="relative mb-6 flex items-center">
//           <div className="relative flex-grow">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
//             <Input
//               className="w-full rounded-3xl pl-9 pr-20"
//               placeholder="Search projects..."
//               type="search"
//             />
//           </div>
//           <Button className="absolute rounded-3xl right-0 top-1/2 -translate-y-1/2 transform">
//             Search
//           </Button>
//         </div>

//         {/* Project grid */}
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {Array.from({ length: 30 }).map((_, i) => (
//             <Link key={i} href={`/project/${i + 1}`}>
//               <Card className="relative hover:bg-muted/50 cursor-pointer transition-colors">
//                 <div className="relative">
//                   <Image
//                     src="https://media.istockphoto.com/id/1843756406/photo/web-development-encompassing-coding-and-design-for-performance-and-creating-insight-reports.webp?a=1&b=1&s=612x612&w=0&k=20&c=CAYbq34zkFLBRh0I5pm-17xzuhXXGZN6agMxI5fwaeo="
//                     width={300} // Adjust width
//                     height={200} // Adjust height
//                     alt="image"
//                     className="w-full h-auto rounded-md object-cover"
//                   />
//                   <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/10 hover:bg-black/50 duration-150 opacity-0 hover:opacity-100 text-white rounded-md">
//                     <h3 className="font-semibold text-lg">Project {i + 1}</h3>
//                     <p className="text-sm">Project description goes here</p>
//                   </div>
//                 </div>
//               </Card>

//             </Link>

//           ))}
//         </div>
//         <CreateProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
//       </main>
//     </div>
//   )
// }









































// {/* <Card
//                 className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
//               >
//                 <Image src="https://media.istockphoto.com/id/1843756406/photo/web-development-encompassing-coding-and-design-for-performance-and-creating-insight-reports.webp?a=1&b=1&s=612x612&w=0&k=20&c=CAYbq34zkFLBRh0I5pm-17xzuhXXGZN6agMxI5fwaeo=" width={100} height={100} alt="image" />
//                 <h3 className="font-semibold">Project {i + 1}</h3>
//                 <p className="text-sm text-muted-foreground">
//                   Project description goes here
//                 </p>
//               </Card> */}