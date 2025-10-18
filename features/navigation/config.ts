import { Gamepad2, Home, Star } from "lucide-react"

export const mainNavConfig = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
    isActive: true,
  },
  {
    title: "Recommendations", 
    url: "/recommendations",
    icon: Star,
  },
  {
    title: "Games",
    url: "/games",
    icon: Gamepad2,
  },
]