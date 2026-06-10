import { useState } from 'react';
import { Brain, Menu, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm">IntelliResolve</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent transition-colors">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login" search={{}} className="hidden md:inline-flex px-4 py-2 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground">
            Sign In
          </Link>
          <Link to="/login" search={{ tab: 'signup' }} className="hidden md:inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            Sign Up
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
          <a href="#features" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">How It Works</a>
          <Link to="/login" search={{}} onClick={() => setOpen(false)} className="block text-sm font-medium">Sign In</Link>
          <Link to="/login" search={{ tab: 'signup' }} onClick={() => setOpen(false)} className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">Sign Up</Link>
        </div>
      )}
    </header>
  );
}
