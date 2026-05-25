import { collection, doc, addDoc, updateDoc, increment, getDocs, getDoc, query, orderBy, limit, where, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from './firebase';
import { CommunityPost, PostReply } from '../types';

export const communityCollection = collection(db, 'community_posts');
export const repliesCollection = collection(db, 'post_replies');

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

export const createPost = async (title: string, content: string, type: CommunityPost['type'], locationName: string, mediaUrl?: string) => {
  const user = getEffectiveUser();
  if (!user) throw new Error("Must be logged in to post.");

  const newPost: Omit<CommunityPost, 'id'> = {
    title,
    content,
    authorId: user.uid,
    authorName: user.displayName || 'Anonymous Explorer',
    authorPhoto: user.photoURL || undefined,
    type,
    locationName,
    rating: 0,
    upvotes: 0,
    upvotedBy: [],
    downvotes: 0,
    mediaUrls: mediaUrl ? [mediaUrl] : [],
    createdAt: new Date().toISOString(),
    repliesCount: 0
  };

  const docRef = await addDoc(communityCollection, newPost);
  return docRef.id;
};

export const upvotePost = async (postId: string) => {
  const user = getEffectiveUser();
  if (!user) throw new Error("Must be logged in to upvote.");

  const postRef = doc(db, 'community_posts', postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  const data = postSnap.data() as CommunityPost;
  const hasUpvoted = data.upvotedBy?.includes(user.uid);

  if (hasUpvoted) {
    await updateDoc(postRef, {
      upvotes: increment(-1),
      upvotedBy: arrayRemove(user.uid)
    });
  } else {
    await updateDoc(postRef, {
      upvotes: increment(1),
      upvotedBy: arrayUnion(user.uid)
    });
  }
};

export const addReply = async (postId: string, content: string) => {
  const user = getEffectiveUser();
  if (!user) throw new Error("Must be logged in to reply.");

  const newReply: Omit<PostReply, 'id'> = {
    postId,
    authorId: user.uid,
    authorName: user.displayName || 'Anonymous Explorer',
    authorPhoto: user.photoURL || undefined,
    content,
    createdAt: new Date().toISOString(),
    upvotes: 0,
    upvotedBy: []
  };

  await addDoc(repliesCollection, newReply);
  const postRef = doc(db, 'community_posts', postId);
  await updateDoc(postRef, {
    repliesCount: increment(1)
  });
};

export const subscribeToPosts = (filter: string, callback: (posts: CommunityPost[]) => void) => {
  const q = query(communityCollection, orderBy('createdAt', 'desc'), limit(100));

  return onSnapshot(q, (snapshot) => {
    let posts: CommunityPost[] = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() } as CommunityPost);
    });
    
    if (filter === 'Trending') {
      posts = posts.sort((a, b) => b.upvotes - a.upvotes).slice(0, 20);
    } else {
      posts = posts.filter(p => p.type === filter);
    }
    
    callback(posts);
  });
};

export const subscribeToReplies = (postId: string, callback: (replies: PostReply[]) => void) => {
  const q = query(repliesCollection, where('postId', '==', postId));
  
  return onSnapshot(q, (snapshot) => {
    let replies: PostReply[] = [];
    snapshot.forEach(doc => {
      replies.push({ id: doc.id, ...doc.data() } as PostReply);
    });
    replies = replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    callback(replies);
  });
};
