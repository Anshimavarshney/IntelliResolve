import { motion } from 'framer-motion';

const stats = [
  { value: '140+', label: 'Institutions Supported' },
  { value: '70%', label: 'Faster Resolution' },
  { value: '4', label: 'User Role Levels' },
  { value: '< 24h', label: 'Avg High-Priority SLA' },
];

export function StatsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
