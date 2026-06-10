import { useState } from 'react';
import { Home, FileText, PlusCircle, BarChart3, Users, LogOut, Sun, Moon, ChevronLeft, ChevronRight, Brain, Shield, GraduationCap, Briefcase, Menu, X, Settings } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import type { UserRole } from '@/lib/types';

const ROLE_MENUS: Record<UserRole, { id: string; label: string; icon: React.ReactNode }[]> = {
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { id: 'submit', label: 'New Complaint', icon: <PlusCircle className="h-5 w-5" /> },
    { id: 'complaints', label: 'My Complaints', icon: <FileText className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ],
  staff: [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { id: 'complaints', label: 'Assigned', icon: <FileText className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { id: 'complaints', label: 'All Complaints', icon: <FileText className="h-5 w-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ],
  superadmin: [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { id: 'complaints', label: 'All Complaints', icon: <FileText className="h-5 w-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ],
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="h-5 w-5" />,
  staff: <Briefcase className="h-5 w-5" />,
  admin: <Shield className="h-5 w-5" />,
  superadmin: <Brain className="h-5 w-5" />,
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student', staff: 'Staff', admin: 'Admin', superadmin: 'Super Admin',
};

export function AppSidebar({ role, userName, onLogout, activeView, onNavigate }: {
  role: UserRole; userName: string; onLogout: () => void;
  activeView: string; onNavigate: (view: string) => void;
}) {
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menu = ROLE_MENUS[role];

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
          <Brain className="h-5 w-5" />
        </div>
        {!collapsed && <span className="font-bold text-sm tracking-tight">IntelliResolve</span>}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menu.map(item => {
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button onClick={toggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-colors">
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button onClick={() => setCollapsed(c => !c)}
          className="hidden md:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary">
              {ROLE_ICONS[role]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/50">{ROLE_LABELS[role]}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border rounded-lg shadow-md">
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col bg-sidebar text-sidebar-foreground w-64 min-h-screen z-10">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground/70">
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen`}>
        {sidebarContent}
      </aside>
    </>
  );
}
