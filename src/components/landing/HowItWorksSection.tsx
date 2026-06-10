import { motion } from 'framer-motion';

const steps = [
  { num: '01', title: 'Submit', desc: 'Student describes grievance. AI suggests title and detects duplicates in real-time.' },
  { num: '02', title: 'Classify', desc: 'NLP engine extracts keywords, classifies category, detects sentiment, assigns priority score.' },
  { num: '03', title: 'Route', desc: 'Complaint auto-routed to correct department. Workload balancer assigns to least busy staff.' },
  { num: '04', title: 'Track', desc: 'SLA timer starts. Timeline tracks every status change. Smart escalation if deadline approaches.' },
  { num: '05', title: 'Resolve', desc: 'Staff resolves. Student rates resolution. Data feeds analytics and AI knowledge base.' },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">From Complaint to Resolution in 5 Steps</h2>
        </motion.div>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="flex gap-6 items-start"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex flex-col items-center shrink-0">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {step.num}
                </div>
                {i < steps.length - 1 && <div className="w-0.5 h-16 bg-border" />}
              </div>
              <div className="pb-12">
                <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
