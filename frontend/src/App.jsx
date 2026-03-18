import { useState } from 'react'

function App() {
  return (
    // Sử dụng class của Tailwind: min-h-screen, flex, bg-green-500, v.v.
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-green-500 mb-4">
        Spotify Clone Project
      </h1>
      <p className="text-lg text-gray-400">
        Tailwind CSS v3 đã hoạt động thành công!
      </p>
    </div>
  )
}

export default App