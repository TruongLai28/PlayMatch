'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { 
  Home, 
  Search, 
  Library, 
  Heart, 
  Settings, 
  User,
  Gamepad2,
  TrendingUp,
  Star,
  Sparkles
} from "lucide-react"

// Menu items for navigation
const mainNavItems = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Library",
    url: "/library",
    icon: Library,
  },
]

const discoverItems = [
  {
    title: "Get Recommendations",
    url: "/recommendations",
    icon: Sparkles,
  },
  {
    title: "Popular Games",
    url: "/popular",
    icon: TrendingUp,
  },
  {
    title: "New Releases",
    url: "/new",
    icon: Gamepad2,
  },
  {
    title: "Top Rated",
    url: "/top-rated",
    icon: Star,
  },
]

const personalItems = [
  {
    title: "Favorites",
    url: "/favorites",
    icon: Heart,
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="border-2 border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b-2 border-sidebar-border relative bg-gradient-to-r from-sidebar-bg to-sidebar-accent">
        {/* Centered title + icon */}
        <div className="flex items-center justify-center gap-3 -translate-x-2">
          <Gamepad2 className="h-7 w-7 text-sidebar-primary" />
          <span className="font-bold text-xl text-sidebar-foreground tracking-tight">PlayMatch</span>
        </div>

        {/* Keep toggle visible in the header but absolutely positioned so it doesn't affect centering */}
        <div className="absolute top-2 right-2">
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3 p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all duration-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none !outline-none" style={{outline: 'none !important', boxShadow: 'none !important'}}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Discover Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary font-semibold uppercase tracking-wider text-sm">Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {discoverItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3 p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all duration-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none !outline-none" style={{outline: 'none !important', boxShadow: 'none !important'}}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Personal Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary font-semibold uppercase tracking-wider text-sm">Your Games</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3 p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all duration-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none !outline-none" style={{outline: 'none !important', boxShadow: 'none !important'}}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

  <SidebarFooter className="p-4 border-t-2 border-sidebar-border bg-gradient-to-r from-sidebar-bg to-sidebar-accent">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/profile" className="flex items-center gap-3 p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all duration-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none !outline-none" style={{outline: 'none !important', boxShadow: 'none !important'}}>
                <User className="h-5 w-5" />
                <span className="font-medium">Profile</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/settings" className="flex items-center gap-3 p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-all duration-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none !outline-none" style={{outline: 'none !important', boxShadow: 'none !important'}}>
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}