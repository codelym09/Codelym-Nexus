import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Activity,
  Bell,
  CreditCard,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  User,
  Zap,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { useAuth as useAuthHook } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", color: "text-blue-400" },
  { icon: GitBranch, label: "Workflows", path: "/workflows", color: "text-purple-400" },
  { icon: FileText, label: "Log Ingest", path: "/ingest", color: "text-teal-400" },
  { icon: CreditCard, label: "Billing", path: "/billing", color: "text-green-400" },
  { icon: User, label: "Perfil", path: "/profile", color: "text-violet-400" },
  { icon: Shield, label: "Seguridad", path: "/security", color: "text-orange-400", adminOnly: true },
  { icon: Settings, label: "Admin", path: "/admin", color: "text-pink-400", adminOnly: true },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Codelym Nexus</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-center text-white">
              Inicia sesión para continuar
            </h1>
            <p className="text-sm text-text-secondary text-center max-w-sm">
              Accede al panel de control de Codelym Nexus con tu cuenta.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 border-0 text-white font-semibold"
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuthHook();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data: notifications } = trpc.notifications.getNotifications.useQuery(
    { limit: 10 },
    { enabled: !!user, refetchInterval: 60_000 }
  );
  const unreadCount = notifications?.length ?? 0;

  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const activeMenuItem = visibleMenuItems.find(
    (item) => item.path === location || (item.path !== "/" && location.startsWith(item.path))
  );

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-white/10 bg-black/20 backdrop-blur-xl"
          disableTransition={isResizing}
        >
          {/* Header con logo */}
          <SidebarHeader className="h-16 justify-center border-b border-white/10">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 group"
                aria-label="Toggle navigation"
              >
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center shadow-md group-hover:shadow-purple-500/30 transition-shadow">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold tracking-tight truncate text-white text-sm leading-tight">
                      Codelym Nexus
                    </span>
                    <span className="text-[10px] text-text-secondary truncate leading-tight">
                      Control Plane
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          {/* Navegación */}
          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 space-y-0.5">
              {visibleMenuItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location === "/"
                    : location === item.path || location.startsWith(item.path + "/");
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all duration-200 font-normal rounded-lg
                        ${isActive
                          ? "bg-white/15 text-white shadow-sm"
                          : "hover:bg-white/8 text-text-secondary hover:text-white"
                        }`}
                    >
                      <item.icon
                        className={`h-4 w-4 transition-colors ${isActive ? item.color : "text-current"}`}
                      />
                      <span className={`transition-colors ${isActive ? "text-white font-medium" : ""}`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-400 to-teal-400" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* Footer con usuario */}
          <SidebarFooter className="p-3 border-t border-white/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/10 transition-all duration-200 w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border border-white/20 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-purple-500/50 to-teal-500/50 text-white">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "-"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-xs text-text-secondary truncate">
                        {user?.email || "-"}
                      </p>
                      {user?.role === "admin" && (
                        <Badge className="text-[9px] px-1 py-0 h-3.5 bg-purple-500/30 text-purple-300 border-0 shrink-0">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 glass-card border-white/20">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => setLocation("/profile")}
                  className="cursor-pointer text-text-secondary hover:text-white focus:text-white focus:bg-white/10"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Handle de resize */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-purple-500/40 active:bg-purple-500/60 transition-colors duration-150 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Header mobile */}
        {isMobile && (
          <div className="flex border-b border-white/10 h-14 items-center justify-between bg-black/20 backdrop-blur-xl px-3 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors" />
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-400" />
                <span className="font-medium text-white text-sm">
                  {activeMenuItem?.label ?? "Dashboard"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/")}
                className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Notificaciones"
              >
                <Bell className="h-4 w-4 text-text-secondary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-purple-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-text-secondary">Online</span>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-4 md:p-6 transition-all duration-300">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
