import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, limit, doc, deleteDoc } from 'firebase/firestore';

const getEffectiveUser = () => {
  if (auth.currentUser) return auth.currentUser;
  const savedGuest = localStorage.getItem('keralaconnect_guest_user');
  if (savedGuest) {
    try {
      return JSON.parse(savedGuest);
    } catch {
      return null;
    }
  }
  return null;
};

const initialPosts = [
  {
    title: 'Fort Kochi Cafe Guide',
    content: "Make sure you visit Kashi Art Cafe. Best chocolate cake in town and a great place to socialize. After that you can take the Ro-Ro ferry right next to the beach, it only costs ₹6 and crosses the harbor in 5 minutes!",
    authorId: 'dummy_1',
    authorName: 'Arjun K.',
    authorPhoto: '',
    type: 'Food',
    locationName: 'Fort Kochi',
    rating: 4.8,
    upvotes: 45,
    upvotedBy: [],
    downvotes: 0,
    mediaUrls: ['https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    repliesCount: 0
  },
  {
    title: 'Hidden Backwater Route',
    content: "If you want to avoid the main tourist heavy boats in Alleppey, take the local government ferry from robust boat jetty to Kuttanad. It takes 2 hours and costs literally ₹20. Best way to see the real village life.",
    authorId: 'dummy_2',
    authorName: 'Meera S.',
    authorPhoto: '',
    type: 'Adventure',
    locationName: 'Alleppey',
    rating: 4.9,
    upvotes: 112,
    upvotedBy: [],
    downvotes: 0,
    mediaUrls: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    repliesCount: 0
  },
  {
    title: 'Munnar Sunrise Point',
    content: "Kolukkumalai is heavily crowded these days. Instead, try Chokramudi peak early morning. Start around 4:30 AM to catch the sunrise. The mist slowly revealing the tea estates is pure magic.",
    authorId: 'dummy_3',
    authorName: 'Rahul V.',
    authorPhoto: '',
    type: 'Viewpoint',
    locationName: 'Munnar',
    rating: 5.0,
    upvotes: 89,
    upvotedBy: [],
    downvotes: 0,
    mediaUrls: ['https://images.unsplash.com/photo-1589416568214-725345759753?auto=format&fit=crop&q=80'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    repliesCount: 0
  }
];

export const seedDatabase = async () => {
  const user = getEffectiveUser();
  if (!user) {
    console.log("Must be signed in to seed database.");
    return;
  }

  // Clear any existing alerts and road reports from Firestore
  try {
    const pSnap = await getDocs(query(collection(db, 'community_posts')));
    const alertTypes = ["Traffic", "Accident", "Weather", "Roadblock", "Transit"];
    for (const docSnap of pSnap.docs) {
      if (alertTypes.includes(docSnap.data().type)) {
        await deleteDoc(doc(db, 'community_posts', docSnap.id));
        console.log(`Successfully deleted existing alert database entry: ${docSnap.id}`);
      }
    }
  } catch (error) {
    console.error("Error clearing existing Firestore alerts:", error);
  }

  const q = query(collection(db, 'community_posts'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    console.log("Database already seeded");
    return;
  }

  for (const post of initialPosts) {
    await addDoc(collection(db, 'community_posts'), {
      ...post,
      authorId: user.uid,
      authorName: user.displayName || 'System Seed',
    });
  }
  console.log("Seeded initial community posts.");
};
