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
    url: "/",
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
      <SidebarHeader className="p-4 border-b-2 border-sidebar-border relative">
        {/* Centered title + icon */}
        <div className="flex items-center justify-center gap-2 -translate-x-2">
          <Gamepad2 className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold text-lg text-sidebar-foreground">PlayMatch</span>
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
                  <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent">
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Discover Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {discoverItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent">
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Personal Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Your Games</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent">
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

  <SidebarFooter className="p-4 border-t-2 border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent">
              <a href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent">
              <a href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}