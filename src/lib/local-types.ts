export type User = {
  id: string;
  email: string;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  bio: string | null;
  gender: string | null;
  dob: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  push_notifications: boolean;
};

export type PlanOption = {
  theme: string;
  people: string;
  venue: string;
  activities: string;
  decoration: string;
  budget: string;
};

export type EventRow = {
  id: string;
  created_by: string;
  name: string;
  description: string;
  event_type: string;
  budget: string;
  attendees: number;
  location: string;
  event_time: string;
  duration_hours: number;
  catering: boolean;
  image_url: string | null;
  ai_plan: PlanOption | null;
  creator: { full_name: string } | null;
  registrations: { user_id: string }[];
};
