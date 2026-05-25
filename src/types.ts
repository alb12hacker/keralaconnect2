export interface Vehicle {
  id: string;
  driverId: string; // Required. Must be a real driver.
  type: "bus" | "ferry";
  routeNumber: string;
  routeName: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  crowdLevel: "empty" | "moderate" | "crowded" | "full";
  status: "active" | "delayed" | "inactive";
  lastUpdated: string;
}

export interface UserSavedRoute {
  routeId: string;
  routeName: string;
  type: "school" | "college" | "tuition" | "work" | "general";
  savedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  theme: "light" | "dark" | "system";
  reputation: number;
  badges: string[];
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  type: "Food" | "Adventure" | "Viewpoint" | "Culture" | "Transit" | "Traffic" | "Accident" | "Weather" | "Roadblock";
  locationName: string;
  lat?: number;
  lng?: number;
  rating: number;
  upvotes: number;
  upvotedBy: string[];
  downvotes: number;
  mediaUrls: string[];
  createdAt: string;
  repliesCount: number;
}

export interface PostReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
  upvotes: number;
  upvotedBy: string[];
}
