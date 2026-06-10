import { motion } from 'framer-motion';
import { Brain, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-info/10 rounded-full blur-3xl" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative max-w-6xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card/50 backdrop-blur-sm mb-8 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Powered Complaint Management for Education
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="text-foreground">Resolve Grievances</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent">
            Intelligently & Faster
          </span>
        </motion.h1>

        <motion.p
          className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          IntelliResolve uses NLP to automatically classify, prioritize, and route student complaints — 
          reducing resolution time by up to 70% across 140+ Indian institutions.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Link
            to="/login"
            search={{}}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 border rounded-xl text-sm font-semibold hover:bg-accent/50 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            search={{ tab: 'signup' }}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            Sign Up
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="mt-16 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-success" />
            <span>RBAC Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-warning" />
            <span>Real-time SLA Tracking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Brain className="h-4 w-4 text-primary" />
            <span>NLP Classification</span>
          </div>
          <span className="hidden sm:inline">·</span>
          <span>Trusted by 140+ Institutions</span>
        </motion.div>

        {/* Dashboard preview mock */}
        <motion.div
          className="mt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
        >
          <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/5 p-1">
            <div className="rounded-xl bg-gradient-to-br from-card to-muted/30 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
                <span className="text-xs text-muted-foreground ml-2">IntelliResolve Dashboard</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total', value: '1,247', color: 'text-primary' },
                  { label: 'Resolved', value: '982', color: 'text-success' },
                  { label: 'Pending', value: '189', color: 'text-warning' },
                  { label: 'SLA Rate', value: '94%', color: 'text-info' },
                ].map(stat => (
                  <div key={stat.label} className="bg-background/60 rounded-lg p-3 text-center">
                    <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { id: 'GRV-1042', title: 'Exam portal login issue', cat: 'Technical', pri: 'HIGH', priColor: 'bg-destructive/10 text-destructive' },
                  { id: 'GRV-1041', title: 'Hostel water supply disrupted', cat: 'Hostel', pri: 'HIGH', priColor: 'bg-destructive/10 text-destructive' },
                  { id: 'GRV-1040', title: 'Fee receipt not generated', cat: 'Admin', pri: 'MEDIUM', priColor: 'bg-warning/10 text-warning' },
                ].map(row => (
                  <div key={row.id} className="flex items-center justify-between bg-background/40 rounded-lg px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
                      <span className="font-medium text-xs sm:text-sm">{row.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hidden sm:inline">{row.cat}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${row.priColor}`}>{row.pri}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
