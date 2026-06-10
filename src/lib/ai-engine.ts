import type { ComplaintCategory, ComplaintPriority, ComplaintSentiment, AIAnalysis } from './types';

const CATEGORY_KEYWORDS: Record<ComplaintCategory, string[]> = {
  academic: ['exam', 'marks', 'result', 'assignment', 'grade', 'professor', 'lecture', 'class', 'syllabus', 'attendance', 'teacher', 'course', 'semester', 'paper', 'test', 'quiz', 'lab', 'practical', 'project', 'thesis', 'viva', 'internal', 'external', 'evaluation', 'score', 'faculty', 'timetable', 'schedule'],
  administrative: ['fee', 'certificate', 'office', 'document', 'admission', 'scholarship', 'transfer', 'registration', 'id card', 'library', 'fine', 'refund', 'payment', 'receipt', 'form', 'application', 'verification', 'clearance', 'bonafide'],
  hostel: ['room', 'mess', 'water', 'electricity', 'hostel', 'warden', 'food', 'cleanliness', 'bathroom', 'toilet', 'laundry', 'wifi', 'internet', 'noise', 'roommate', 'bed', 'furniture', 'maintenance', 'pest', 'insect', 'mosquito', 'garbage', 'curfew', 'gate', 'visitor'],
  technical: ['portal', 'website', 'login', 'password', 'server', 'system', 'error', 'bug', 'app', 'software', 'crash', 'slow', 'loading', 'access', 'account', 'email', 'download', 'upload', 'link', 'page', 'network', 'database'],
  infrastructure: ['building', 'road', 'parking', 'lift', 'elevator', 'stairs', 'lighting', 'fan', 'ac', 'air conditioning', 'window', 'door', 'bench', 'desk', 'projector', 'smart board', 'playground', 'gym', 'auditorium', 'canteen', 'cafeteria', 'garden', 'washroom'],
  other: [],
};

const HIGH_PRIORITY_KEYWORDS = ['urgent', 'immediately', 'serious', 'critical', 'emergency', 'dangerous', 'threat', 'harassment', 'abuse', 'safety', 'health', 'accident', 'fire', 'flood', 'asap'];
const LOW_PRIORITY_KEYWORDS = ['minor', 'suggestion', 'request', 'improve', 'feedback', 'idea', 'wish', 'would be nice', 'consider', 'optional'];

const ANGRY_WORDS = ['angry', 'furious', 'outraged', 'disgusted', 'terrible', 'worst', 'horrible', 'pathetic', 'useless', 'incompetent', 'ridiculous', 'unacceptable', 'shame', 'disappointed', 'frustrated', 'fed up', 'sick of', 'tired of', 'hate', 'awful', 'nonsense', 'waste', 'corrupt', 'negligence', 'careless', 'irresponsible'];
const POSITIVE_WORDS = ['thank', 'appreciate', 'good', 'great', 'excellent', 'helpful', 'kind', 'wonderful', 'please', 'grateful', 'satisfied', 'happy'];

const STOPWORDS = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'its', 'they', 'them', 'what', 'which', 'who', 'this', 'that', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very']);

function preprocess(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOPWORDS.has(w));
}

function classifyCategory(words: string[], raw: string): { category: ComplaintCategory; score: number; confidence: number; reason: string; matchedKeywords: string[] } {
  const scores: Record<string, { count: number; keywords: string[] }> = {};
  for (const cat of Object.keys(CATEGORY_KEYWORDS)) {
    scores[cat] = { count: 0, keywords: [] };
  }

  const lowerRaw = raw.toLowerCase();
  let totalMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerRaw.includes(kw)) {
        scores[cat].count++;
        scores[cat].keywords.push(kw);
        totalMatches++;
      }
    }
  }

  let bestCat: ComplaintCategory = 'other';
  let bestScore = 0;
  for (const [cat, data] of Object.entries(scores)) {
    if (data.count > bestScore) {
      bestScore = data.count;
      bestCat = cat as ComplaintCategory;
    }
  }

  const matchedKeywords = scores[bestCat]?.keywords || [];
  const confidence = totalMatches > 0 ? Math.min(Math.round((bestScore / Math.max(totalMatches, 1)) * 100), 99) : 30;
  const reason = matchedKeywords.length > 0
    ? `Classified as ${bestCat} due to keywords: '${matchedKeywords.slice(0, 3).join("', '")}'`
    : `Default classification as ${bestCat} (no strong keyword match)`;

  return { category: bestCat, score: Math.min(bestScore / 3, 1), confidence, reason, matchedKeywords };
}

function analyzeSentiment(words: string[], raw: string): { sentiment: ComplaintSentiment; score: number } {
  const lowerRaw = raw.toLowerCase();
  let angryCount = 0;
  let positiveCount = 0;

  for (const w of ANGRY_WORDS) { if (lowerRaw.includes(w)) angryCount++; }
  for (const w of POSITIVE_WORDS) { if (lowerRaw.includes(w)) positiveCount++; }

  const hasExclamation = (raw.match(/!/g) || []).length > 1;
  const hasAllCaps = raw.split(' ').filter(w => w.length > 3 && w === w.toUpperCase()).length > 1;
  if (hasExclamation) angryCount += 0.5;
  if (hasAllCaps) angryCount += 1;

  if (angryCount >= 2) return { sentiment: 'angry', score: -Math.min(angryCount / 4, 1) };
  if (angryCount >= 1) return { sentiment: 'frustrated', score: -0.5 };
  if (positiveCount >= 2) return { sentiment: 'positive', score: Math.min(positiveCount / 3, 1) };
  return { sentiment: 'neutral', score: 0 };
}

function detectPriority(words: string[], raw: string, sentiment: ComplaintSentiment): { priority: ComplaintPriority; score: number; confidence: number; reason: string } {
  const lowerRaw = raw.toLowerCase();
  const reasons: string[] = [];

  let highCount = 0;
  let lowCount = 0;
  const highMatched: string[] = [];
  const lowMatched: string[] = [];

  for (const kw of HIGH_PRIORITY_KEYWORDS) { if (lowerRaw.includes(kw)) { highCount++; highMatched.push(kw); } }
  for (const kw of LOW_PRIORITY_KEYWORDS) { if (lowerRaw.includes(kw)) { lowCount++; lowMatched.push(kw); } }

  if (sentiment === 'angry') { highCount += 2; reasons.push('negative sentiment detected'); }
  if (sentiment === 'frustrated') { highCount += 1; reasons.push('frustrated tone detected'); }

  if (highCount >= 2) {
    if (highMatched.length) reasons.unshift(`keywords: '${highMatched.join("', '")}'`);
    const confidence = Math.min(60 + highCount * 10, 99);
    return { priority: 'high', score: Math.min(0.6 + highCount * 0.1, 0.99), confidence, reason: `High priority due to ${reasons.join(' and ')}` };
  }
  if (lowCount >= 2 && highCount === 0) {
    return { priority: 'low', score: 0.3, confidence: Math.min(50 + lowCount * 10, 85), reason: `Low priority: appears to be a ${lowMatched.join('/')}` };
  }

  return { priority: 'medium', score: 0.5, confidence: 65, reason: 'Medium priority: standard complaint' };
}

function generateTags(matchedKeywords: string[], priority: ComplaintPriority, sentiment: ComplaintSentiment): string[] {
  const tags = matchedKeywords.slice(0, 4).map(k => `#${k}`);
  if (priority === 'high') tags.push('#urgent');
  if (sentiment === 'angry') tags.push('#angry');
  return tags;
}

function suggestTitle(raw: string, category: ComplaintCategory): string {
  const words = raw.split(/\s+/).slice(0, 8).join(' ');
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
  return `${catLabel} Issue: ${words}${raw.split(/\s+/).length > 8 ? '...' : ''}`;
}

/** Suggest resolution based on past resolved complaints */
export function suggestResolution(description: string, resolved: { description: string; title: string; category: string }[]): string | undefined {
  if (resolved.length === 0) return undefined;
  const words = new Set(preprocess(description));
  let best: { title: string; score: number } | null = null;

  for (const c of resolved) {
    const cWords = new Set(preprocess(c.description));
    const intersection = new Set([...words].filter(w => cWords.has(w)));
    const union = new Set([...words, ...cWords]);
    const score = union.size > 0 ? intersection.size / union.size : 0;
    if (score > 0.3 && (!best || score > best.score)) {
      best = { title: c.title, score };
    }
  }

  if (best) {
    return `Similar complaint "${best.title}" was previously resolved. Review past resolution for guidance (${Math.round(best.score * 100)}% match).`;
  }
  return undefined;
}

export function analyzeComplaint(description: string, resolvedComplaints?: { description: string; title: string; category: string }[]): AIAnalysis {
  const words = preprocess(description);
  const catResult = classifyCategory(words, description);
  const sentResult = analyzeSentiment(words, description);
  const prioResult = detectPriority(words, description, sentResult.sentiment);
  const tags = generateTags(catResult.matchedKeywords, prioResult.priority, sentResult.sentiment);
  const resolution = resolvedComplaints ? suggestResolution(description, resolvedComplaints) : undefined;

  return {
    category: catResult.category,
    priority: prioResult.priority,
    sentiment: sentResult.sentiment,
    priority_score: Math.round(prioResult.score * 100),
    sentiment_score: Math.round(sentResult.score * 100) / 100,
    category_confidence: catResult.confidence,
    priority_confidence: prioResult.confidence,
    reason_for_priority: prioResult.reason,
    reason_for_category: catResult.reason,
    keywords: catResult.matchedKeywords,
    tags,
    suggested_title: suggestTitle(description, catResult.category),
    suggested_resolution: resolution,
  };
}

export function checkDuplicates(description: string, existing: { id: string; title: string; description: string }[]): { id: string; title: string; score: number }[] {
  const words = new Set(preprocess(description));
  return existing.map(c => {
    const cWords = new Set(preprocess(c.description));
    const intersection = new Set([...words].filter(w => cWords.has(w)));
    const union = new Set([...words, ...cWords]);
    const score = union.size > 0 ? intersection.size / union.size : 0;
    return { id: c.id, title: c.title, score: Math.round(score * 100) };
  }).filter(r => r.score > 30).sort((a, b) => b.score - a.score).slice(0, 3);
}