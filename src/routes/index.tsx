import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useStore } from '@/lib/store-context';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Index,
  head: () => ({
    meta: [
      { title: 'IntelliResolve — AI-Driven E-Complaint Management System' },
      { name: 'description', content: 'IntelliResolve uses NLP to automatically classify, prioritize, and route student complaints for faster resolution across 140+ Indian institutions.' },
      { property: 'og:title', content: 'IntelliResolve — AI E-Complaint Management' },
      { property: 'og:description', content: 'NLP-powered complaint classification, prioritization, and routing for universities and colleges' },
    ],
  }),
});

function Index() {
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!store.authLoading && store.currentUser) {
      navigate({ to: '/dashboard' });
    }
  }, [store.authLoading, store.currentUser, navigate]);

  if (store.authLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <HeroSection />
        <StatsSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        <CTASection />
        <Footer />
      </div>
    </ThemeProvider>
  );
}
