'use client'

import { Gamepad2, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="h-6 w-6 text-[#5d4af8]" />
              <h3 className="text-xl font-bold text-white">PlayMatch</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Discover your next favorite game with personalized recommendations powered by advanced algorithms.
            </p>
            <div className="flex space-x-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => window.open('https://github.com/TruongLai28/PlayMatch', '_blank')}
              >
                <Github className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-white">Quick Links</h4>
            <ul className="space-y-1">
              <li>
                <a href="/home" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/recommendations" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Recommendations
                </a>
              </li>
              <li>
                <a href="/docs" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/browse" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Browse Games
                </a>
              </li>

            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-white">Categories</h4>
            <ul className="space-y-1">
              <li>
                <a href="/browse?genre_id=7" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Music
                </a>
              </li>
              <li>
                <a href="/browse?genre_id=31" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Adventure
                </a>
              </li>
              <li>
                <a href="/browse?genre_id=12" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  RPG
                </a>
              </li>
              <li>
                <a href="/browse?genre_id=15" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Strategy
                </a>
              </li>
              <li>
                <a href="/browse?genre_id=32" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Indie
                </a>
              </li>
            </ul>
          </div>


        </div>



        {/* Bottom Section */}
        <div className="mt-8 pt-4 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-zinc-400 text-sm">
            © {currentYear} PlayMatch. All rights reserved.
          </div>
          
        </div>
      </div>
    </footer>
  )
}