import { FleetViewClient } from '@/components/fleet-view-client';
import { ApiKeyInstructions } from '@/components/api-key-instructions';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { HomeIcon, MapIcon, UsersIcon, BarChartIcon, TruckIcon, Share2Icon, MessageSquareIcon, SettingsIcon, SearchIcon, BellIcon, NewspaperIcon, HelpCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const sidebarNavItems = [
    { href: "#", icon: HomeIcon, label: "Home" },
    { href: "#", icon: MapIcon, label: "Live Map" },
    { href: "#", icon: UsersIcon, label: "Drivers" },
    { href: "#", icon: BarChartIcon, label: "Reports" },
    { href: "#", icon: TruckIcon, label: "Vehicles" },
    { href: "#", icon: Share2Icon, label: "Dispatch" },
    { href: "#", icon: MessageSquareIcon, label: "Messages" },
    { href: "#", icon: SettingsIcon, label: "Settings" },
];

function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-primary px-4 text-primary-foreground sm:px-6">
            <div className='flex items-center gap-2'>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="currentColor" fillOpacity="0.1"/>
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <SidebarTrigger className="flex md:hidden text-primary-foreground hover:text-primary-foreground/80" />
            </div>

            <div className="flex flex-1 items-center justify-between gap-4">
                <div className='hidden md:flex items-center gap-4'>
                    <Button variant='ghost' className='text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground'>
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
                    </Button>
                    <div className="relative w-full max-w-sm">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                        <Input
                            type="search"
                            placeholder="Press / for search"
                            className="bg-primary-foreground/10 border-none pl-10 text-primary-foreground placeholder:text-primary-foreground/60 focus:bg-primary-foreground/20 focus:ring-primary-foreground"
                        />
                    </div>
                     <Button className="bg-sky-500 hover:bg-sky-600 text-white">Create Vehicle</Button>
                </div>
               
                <div className="flex items-center gap-4 md:gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                        <BellIcon className="h-5 w-5" />
                        <span className="sr-only">Activity</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                        <NewspaperIcon className="h-5 w-5" />
                        <span className="sr-only">News</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                        <HelpCircleIcon className="h-5 w-5" />
                        <span className="sr-only">Help</span>
                    </Button>
                    <Avatar>
                        <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="@user" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}

export default async function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <ApiKeyInstructions />;
  }
  
  return (
    <SidebarProvider>
        <div className='flex flex-col h-screen'>
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar variant='sidebar' collapsible='icon' className='bg-card border-r'>
                    <SidebarContent>
                        <SidebarMenu>
                            {sidebarNavItems.map((item) => (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton tooltip={item.label} isActive={item.label === 'Live Map'}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarContent>
                </Sidebar>
                <FleetViewClient apiKey={apiKey} />
            </div>
        </div>
    </SidebarProvider>
  );
}
