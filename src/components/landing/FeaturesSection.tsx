import { motion } from 'framer-motion';
import { Brain, BarChart3, Shield, Clock, Zap, MessageSquare, Users, AlertTriangle, FileSearch, GitBranch, Star, Bell } from 'lucide-react';

const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'NLP Classification',
    desc: 'Automatically categorizes complaints into Academic, Admin, Hostel, and Technical using keyword extraction and sentiment analysis.',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Smart Prioritization',
    desc: 'AI assigns priority scores based on urgency keywords, sentiment, and severity with full explainability.',
  },
  {
    icon: <GitBranch className="h-6 w-6" />,
    title: 'Auto Routing',
    desc: 'Complaints are automatically routed to the right department with workload-based staff assignment.',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'SLA Engine',
    desc: 'Built-in SLA tracking (24h/3d/5d) with automatic escalation when deadlines are breached.',
  },
  {
    icon: <FileSearch className="h-6 w-6" />,
    title: 'Duplicate Detection',
    desc: 'Jaccard similarity scoring detects duplicate complaints and groups them into clusters.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Analytics Dashboard',
    desc: 'Charts, heatmaps, trends, department performance, and root cause analysis for admins.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'RBAC Security',
    desc: 'Four roles — Student, Staff, Admin, Super Admin — with row-level security policies.',
  },
  {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: 'Smart Escalation',
    desc: 'Escalation based on SLA breach, sentiment severity, and urgency score — not just time.',
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Notes & Chat',
    desc: 'Staff can add resolution notes. Full communication thread per complaint.',
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: 'Feedback System',
    desc: 'Students rate resolutions with 1-5 stars. Feedback drives quality analytics.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Multi-Tenant',
    desc: 'Supports 140+ Indian institutions — IITs, NITs, Central and State Universities.',
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: 'Audit Trail',
    desc: 'Every action logged: submission, AI classification, routing, status changes, feedback.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section className="py-24 px-4" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">Everything You Need to Resolve Grievances</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From AI-powered classification to real-time analytics — IntelliResolve handles the entire complaint lifecycle.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map(f => (
            <motion.div
              key={f.title}
              variants={item}
              className="group rounded-xl border bg-card p-6 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                {f.icon}
              </div>
              <h3 className="font-bold text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
