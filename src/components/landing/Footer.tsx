import { Brain } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm">IntelliResolve</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} IntelliResolve. AI-Driven E-Complaint Management for Educational Institutions.
        </p>
      </div>
    </footer>
  );
}
