export type UserRole = 'student' | 'staff' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id?: string;
  institution_id?: string;
}

export type ComplaintCategory = 'academic' | 'administrative' | 'hostel' | 'technical' | 'infrastructure' | 'other';
export type ComplaintPriority = 'high' | 'medium' | 'low';
export type ComplaintSentiment = 'angry' | 'frustrated' | 'neutral' | 'positive';
export type ComplaintStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated' | 'rejected';

export interface AIAnalysis {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  sentiment: ComplaintSentiment;
  priority_score: number;
  sentiment_score: number;
  category_confidence?: number;
  priority_confidence?: number;
  reason_for_priority: string;
  reason_for_category: string;
  keywords: string[];
  tags: string[];
  suggested_title?: string;
  similar_complaints?: string[];
  suggested_resolution?: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  sentiment: ComplaintSentiment;
  status: ComplaintStatus;
  department_id: string;
  department_name: string;
  ai_analysis: AIAnalysis;
  sla_deadline: string;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
  cluster_id?: string;
  institution_id?: string;
  feedback?: { rating: number; comment: string };
  notes: ComplaintNote[];
  timeline: TimelineEvent[];
  audit_log: AuditEntry[];
}

export interface ComplaintNote {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  status: ComplaintStatus;
  description: string;
  user_name: string;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  user_name: string;
  details: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  category: ComplaintCategory;
}

export interface Institution {
  id: string;
  name: string;
  type: 'university' | 'iit' | 'nit' | 'iiit' | 'college' | 'deemed';
  state: string;
}

export const DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Academic Office', category: 'academic' },
  { id: 'dept-2', name: 'Administration', category: 'administrative' },
  { id: 'dept-3', name: 'Hostel Management', category: 'hostel' },
  { id: 'dept-4', name: 'IT Department', category: 'technical' },
  { id: 'dept-5', name: 'Infrastructure & Maintenance', category: 'infrastructure' },
  { id: 'dept-6', name: 'General Office', category: 'other' },
];

export const INSTITUTIONS: Institution[] = [
  { id: 'inst-1', name: 'IIT Bombay', type: 'iit', state: 'Maharashtra' },
  { id: 'inst-2', name: 'IIT Delhi', type: 'iit', state: 'Delhi' },
  { id: 'inst-3', name: 'IIT Madras', type: 'iit', state: 'Tamil Nadu' },
  { id: 'inst-4', name: 'IIT Kanpur', type: 'iit', state: 'Uttar Pradesh' },
  { id: 'inst-5', name: 'IIT Kharagpur', type: 'iit', state: 'West Bengal' },
  { id: 'inst-6', name: 'IIT Roorkee', type: 'iit', state: 'Uttarakhand' },
  { id: 'inst-7', name: 'IIT Guwahati', type: 'iit', state: 'Assam' },
  { id: 'inst-8', name: 'IIT Hyderabad', type: 'iit', state: 'Telangana' },
  { id: 'inst-9', name: 'IIT Indore', type: 'iit', state: 'Madhya Pradesh' },
  { id: 'inst-10', name: 'IIT (BHU) Varanasi', type: 'iit', state: 'Uttar Pradesh' },
  { id: 'inst-11', name: 'IIT Dhanbad (ISM)', type: 'iit', state: 'Jharkhand' },
  { id: 'inst-12', name: 'IIT Patna', type: 'iit', state: 'Bihar' },
  { id: 'inst-13', name: 'IIT Gandhinagar', type: 'iit', state: 'Gujarat' },
  { id: 'inst-14', name: 'IIT Jodhpur', type: 'iit', state: 'Rajasthan' },
  { id: 'inst-15', name: 'IIT Bhubaneswar', type: 'iit', state: 'Odisha' },
  { id: 'inst-16', name: 'IIT Tirupati', type: 'iit', state: 'Andhra Pradesh' },
  { id: 'inst-17', name: 'IIT Palakkad', type: 'iit', state: 'Kerala' },
  { id: 'inst-18', name: 'IIT Mandi', type: 'iit', state: 'Himachal Pradesh' },
  { id: 'inst-19', name: 'IIT Ropar', type: 'iit', state: 'Punjab' },
  { id: 'inst-20', name: 'IIT Jammu', type: 'iit', state: 'Jammu & Kashmir' },
  { id: 'inst-21', name: 'IIT Goa', type: 'iit', state: 'Goa' },
  { id: 'inst-22', name: 'IIT Dharwad', type: 'iit', state: 'Karnataka' },
  { id: 'inst-23', name: 'IIT Bhilai', type: 'iit', state: 'Chhattisgarh' },
  { id: 'inst-30', name: 'NIT Trichy', type: 'nit', state: 'Tamil Nadu' },
  { id: 'inst-31', name: 'NIT Warangal', type: 'nit', state: 'Telangana' },
  { id: 'inst-32', name: 'NIT Surathkal', type: 'nit', state: 'Karnataka' },
  { id: 'inst-33', name: 'NIT Calicut', type: 'nit', state: 'Kerala' },
  { id: 'inst-34', name: 'NIT Rourkela', type: 'nit', state: 'Odisha' },
  { id: 'inst-35', name: 'MNIT Jaipur', type: 'nit', state: 'Rajasthan' },
  { id: 'inst-36', name: 'MNNIT Allahabad', type: 'nit', state: 'Uttar Pradesh' },
  { id: 'inst-37', name: 'NIT Durgapur', type: 'nit', state: 'West Bengal' },
  { id: 'inst-38', name: 'VNIT Nagpur', type: 'nit', state: 'Maharashtra' },
  { id: 'inst-39', name: 'NIT Kurukshetra', type: 'nit', state: 'Haryana' },
  { id: 'inst-40', name: 'NIT Silchar', type: 'nit', state: 'Assam' },
  { id: 'inst-41', name: 'NIT Hamirpur', type: 'nit', state: 'Himachal Pradesh' },
  { id: 'inst-42', name: 'NIT Jalandhar', type: 'nit', state: 'Punjab' },
  { id: 'inst-43', name: 'NIT Srinagar', type: 'nit', state: 'Jammu & Kashmir' },
  { id: 'inst-44', name: 'NIT Patna', type: 'nit', state: 'Bihar' },
  { id: 'inst-45', name: 'NIT Raipur', type: 'nit', state: 'Chhattisgarh' },
  { id: 'inst-46', name: 'NIT Agartala', type: 'nit', state: 'Tripura' },
  { id: 'inst-47', name: 'NIT Meghalaya', type: 'nit', state: 'Meghalaya' },
  { id: 'inst-48', name: 'NIT Manipur', type: 'nit', state: 'Manipur' },
  { id: 'inst-49', name: 'NIT Mizoram', type: 'nit', state: 'Mizoram' },
  { id: 'inst-50', name: 'NIT Nagaland', type: 'nit', state: 'Nagaland' },
  { id: 'inst-51', name: 'NIT Arunachal Pradesh', type: 'nit', state: 'Arunachal Pradesh' },
  { id: 'inst-52', name: 'NIT Sikkim', type: 'nit', state: 'Sikkim' },
  { id: 'inst-53', name: 'NIT Goa', type: 'nit', state: 'Goa' },
  { id: 'inst-54', name: 'NIT Delhi', type: 'nit', state: 'Delhi' },
  { id: 'inst-55', name: 'NIT Uttarakhand', type: 'nit', state: 'Uttarakhand' },
  { id: 'inst-56', name: 'NIT Puducherry', type: 'nit', state: 'Puducherry' },
  { id: 'inst-57', name: 'NIT Andhra Pradesh', type: 'nit', state: 'Andhra Pradesh' },
  { id: 'inst-58', name: 'NIT Jamshedpur', type: 'nit', state: 'Jharkhand' },
  { id: 'inst-59', name: 'NIT Surat', type: 'nit', state: 'Gujarat' },
  { id: 'inst-60', name: 'IIIT Hyderabad', type: 'iiit', state: 'Telangana' },
  { id: 'inst-61', name: 'IIIT Bangalore', type: 'iiit', state: 'Karnataka' },
  { id: 'inst-62', name: 'IIIT Allahabad', type: 'iiit', state: 'Uttar Pradesh' },
  { id: 'inst-63', name: 'IIIT Delhi', type: 'iiit', state: 'Delhi' },
  { id: 'inst-64', name: 'ABV-IIITM Gwalior', type: 'iiit', state: 'Madhya Pradesh' },
  { id: 'inst-65', name: 'IIITDM Jabalpur', type: 'iiit', state: 'Madhya Pradesh' },
  { id: 'inst-66', name: 'IIITDM Kancheepuram', type: 'iiit', state: 'Tamil Nadu' },
  { id: 'inst-67', name: 'IIIT Kottayam', type: 'iiit', state: 'Kerala' },
  { id: 'inst-68', name: 'IIIT Sri City', type: 'iiit', state: 'Andhra Pradesh' },
  { id: 'inst-69', name: 'IIIT Lucknow', type: 'iiit', state: 'Uttar Pradesh' },
  { id: 'inst-70', name: 'IIIT Vadodara', type: 'iiit', state: 'Gujarat' },
  { id: 'inst-80', name: 'University of Delhi', type: 'university', state: 'Delhi' },
  { id: 'inst-81', name: 'Jawaharlal Nehru University (JNU)', type: 'university', state: 'Delhi' },
  { id: 'inst-82', name: 'Banaras Hindu University (BHU)', type: 'university', state: 'Uttar Pradesh' },
  { id: 'inst-83', name: 'Aligarh Muslim University (AMU)', type: 'university', state: 'Uttar Pradesh' },
  { id: 'inst-84', name: 'University of Hyderabad', type: 'university', state: 'Telangana' },
  { id: 'inst-85', name: 'Jamia Millia Islamia', type: 'university', state: 'Delhi' },
  { id: 'inst-86', name: 'Visva-Bharati University', type: 'university', state: 'West Bengal' },
  { id: 'inst-87', name: 'Pondicherry University', type: 'university', state: 'Puducherry' },
  { id: 'inst-88', name: 'Central University of Kerala', type: 'university', state: 'Kerala' },
  { id: 'inst-89', name: 'Central University of Rajasthan', type: 'university', state: 'Rajasthan' },
  { id: 'inst-90', name: 'Central University of Punjab', type: 'university', state: 'Punjab' },
  { id: 'inst-91', name: 'Central University of Gujarat', type: 'university', state: 'Gujarat' },
  { id: 'inst-92', name: 'Central University of Tamil Nadu', type: 'university', state: 'Tamil Nadu' },
  { id: 'inst-93', name: 'Central University of Karnataka', type: 'university', state: 'Karnataka' },
  { id: 'inst-94', name: 'Central University of Jharkhand', type: 'university', state: 'Jharkhand' },
  { id: 'inst-95', name: 'Central University of Bihar', type: 'university', state: 'Bihar' },
  { id: 'inst-96', name: 'Central University of Haryana', type: 'university', state: 'Haryana' },
  { id: 'inst-97', name: 'Central University of Himachal Pradesh', type: 'university', state: 'Himachal Pradesh' },
  { id: 'inst-98', name: 'Central University of Jammu', type: 'university', state: 'Jammu & Kashmir' },
  { id: 'inst-99', name: 'Central University of Kashmir', type: 'university', state: 'Jammu & Kashmir' },
  { id: 'inst-100', name: 'Tezpur University', type: 'university', state: 'Assam' },
  { id: 'inst-101', name: 'Assam University', type: 'university', state: 'Assam' },
  { id: 'inst-102', name: 'Nagaland University', type: 'university', state: 'Nagaland' },
  { id: 'inst-103', name: 'Manipur University', type: 'university', state: 'Manipur' },
  { id: 'inst-104', name: 'Mizoram University', type: 'university', state: 'Mizoram' },
  { id: 'inst-105', name: 'Tripura University', type: 'university', state: 'Tripura' },
  { id: 'inst-106', name: 'Sikkim University', type: 'university', state: 'Sikkim' },
  { id: 'inst-107', name: 'Rajiv Gandhi University', type: 'university', state: 'Arunachal Pradesh' },
  { id: 'inst-108', name: 'North-Eastern Hill University (NEHU)', type: 'university', state: 'Meghalaya' },
  { id: 'inst-109', name: 'Mahatma Gandhi Central University', type: 'university', state: 'Bihar' },
  { id: 'inst-120', name: 'Anna University', type: 'university', state: 'Tamil Nadu' },
  { id: 'inst-121', name: 'Savitribai Phule Pune University', type: 'university', state: 'Maharashtra' },
  { id: 'inst-122', name: 'University of Mumbai', type: 'university', state: 'Maharashtra' },
  { id: 'inst-123', name: 'University of Calcutta', type: 'university', state: 'West Bengal' },
  { id: 'inst-124', name: 'Jadavpur University', type: 'university', state: 'West Bengal' },
  { id: 'inst-125', name: 'University of Madras', type: 'university', state: 'Tamil Nadu' },
  { id: 'inst-126', name: 'Osmania University', type: 'university', state: 'Telangana' },
  { id: 'inst-127', name: 'Gujarat University', type: 'university', state: 'Gujarat' },
  { id: 'inst-128', name: 'University of Rajasthan', type: 'university', state: 'Rajasthan' },
  { id: 'inst-129', name: 'Panjab University', type: 'university', state: 'Chandigarh' },
  { id: 'inst-130', name: 'University of Kerala', type: 'university', state: 'Kerala' },
  { id: 'inst-131', name: 'Andhra University', type: 'university', state: 'Andhra Pradesh' },
  { id: 'inst-132', name: 'University of Mysore', type: 'university', state: 'Karnataka' },
  { id: 'inst-133', name: 'Bangalore University', type: 'university', state: 'Karnataka' },
  { id: 'inst-134', name: 'University of Lucknow', type: 'university', state: 'Uttar Pradesh' },
  { id: 'inst-135', name: 'Patna University', type: 'university', state: 'Bihar' },
  { id: 'inst-136', name: 'Gauhati University', type: 'university', state: 'Assam' },
  { id: 'inst-137', name: 'JNTU Hyderabad', type: 'university', state: 'Telangana' },
  { id: 'inst-138', name: 'VTU Belgaum', type: 'university', state: 'Karnataka' },
  { id: 'inst-139', name: 'Shivaji University', type: 'university', state: 'Maharashtra' },
  { id: 'inst-140', name: 'Dr. Babasaheb Ambedkar Marathwada University', type: 'university', state: 'Maharashtra' },
  { id: 'inst-141', name: 'Utkal University', type: 'university', state: 'Odisha' },
  { id: 'inst-142', name: 'Berhampur University', type: 'university', state: 'Odisha' },
  { id: 'inst-143', name: 'Sambalpur University', type: 'university', state: 'Odisha' },
  { id: 'inst-144', name: 'Kurukshetra University', type: 'university', state: 'Haryana' },
  { id: 'inst-145', name: 'Maharshi Dayanand University', type: 'university', state: 'Haryana' },
  { id: 'inst-146', name: 'University of Allahabad', type: 'university', state: 'Uttar Pradesh' },
  { id: 'inst-147', name: 'Mahatma Gandhi University, Kottayam', type: 'university', state: 'Kerala' },
  { id: 'inst-148', name: 'Cochin University of Science and Technology', type: 'university', state: 'Kerala' },
  { id: 'inst-149', name: 'Bharathiar University', type: 'university', state: 'Tamil Nadu' },
  { id: 'inst-150', name: 'Bharathidasan University', type: 'university', state: 'Tamil Nadu' },
  { id: 'inst-160', name: 'BITS Pilani', type: 'deemed', state: 'Rajasthan' },
  { id: 'inst-161', name: 'VIT Vellore', type: 'deemed', state: 'Tamil Nadu' },
  { id: 'inst-162', name: 'SRM Institute of Science and Technology', type: 'deemed', state: 'Tamil Nadu' },
  { id: 'inst-163', name: 'Manipal Academy of Higher Education', type: 'deemed', state: 'Karnataka' },
  { id: 'inst-164', name: 'Amity University', type: 'deemed', state: 'Uttar Pradesh' },
  { id: 'inst-165', name: 'Thapar Institute of Engineering', type: 'deemed', state: 'Punjab' },
  { id: 'inst-166', name: 'Symbiosis International University', type: 'deemed', state: 'Maharashtra' },
  { id: 'inst-167', name: 'Lovely Professional University', type: 'deemed', state: 'Punjab' },
  { id: 'inst-168', name: 'Chandigarh University', type: 'deemed', state: 'Punjab' },
  { id: 'inst-169', name: 'Christ University', type: 'deemed', state: 'Karnataka' },
  { id: 'inst-170', name: 'PSG College of Technology', type: 'college', state: 'Tamil Nadu' },
  { id: 'inst-171', name: 'College of Engineering, Pune (COEP)', type: 'college', state: 'Maharashtra' },
  { id: 'inst-172', name: 'RV College of Engineering', type: 'college', state: 'Karnataka' },
  { id: 'inst-173', name: 'BMS College of Engineering', type: 'college', state: 'Karnataka' },
  { id: 'inst-174', name: 'Netaji Subhas University of Technology (NSUT)', type: 'university', state: 'Delhi' },
  { id: 'inst-175', name: 'Delhi Technological University (DTU)', type: 'university', state: 'Delhi' },
  { id: 'inst-176', name: 'Indraprastha Institute of Information Technology Delhi', type: 'iiit', state: 'Delhi' },
  { id: 'inst-177', name: 'LNMIIT Jaipur', type: 'deemed', state: 'Rajasthan' },
  { id: 'inst-178', name: 'DAIICT Gandhinagar', type: 'deemed', state: 'Gujarat' },
  { id: 'inst-179', name: 'IIIT Pune', type: 'iiit', state: 'Maharashtra' },
  { id: 'inst-180', name: 'Shiv Nadar University', type: 'deemed', state: 'Uttar Pradesh' },
];

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  academic: 'Academic',
  administrative: 'Administrative',
  hostel: 'Hostel',
  technical: 'Technical',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  escalated: 'Escalated',
  rejected: 'Rejected',
};

export const SLA_HOURS: Record<ComplaintPriority, number> = {
  high: 24,
  medium: 72,
  low: 120,
};

export const INSTITUTION_TYPE_LABELS: Record<Institution['type'], string> = {
  university: 'University',
  iit: 'IIT',
  nit: 'NIT',
  iiit: 'IIIT',
  college: 'College',
  deemed: 'Deemed University',
};