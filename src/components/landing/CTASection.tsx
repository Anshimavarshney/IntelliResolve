import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="relative rounded-2xl bg-gradient-to-br from-primary to-info p-10 sm:p-16 text-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Grievance Resolution?
            </h2>
            <p className="text-white/80 text-sm sm:text-base mb-8 max-w-lg mx-auto">
              Join institutions across India using AI to resolve student complaints faster, smarter, and more transparently.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                search={{}}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white/20 text-white border border-white/30 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                search={{ tab: 'signup' }}
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-primary rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-lg"
              >
                Sign Up
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
