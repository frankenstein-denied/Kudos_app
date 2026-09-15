import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '@/lib/firebase'
import { initialsFrom } from '@/lib/utils'

// ---------- Users ----------

export type UserProfile = {
  uid: string
  name: string
  username: string
  bio: string
  photoURL: string
  friendsCount: number
  storiesCount: number
  notifyMessages: boolean
  notifyFriendRequests: boolean
  notifyReactions: boolean
  profileVisibility: 'everyone' | 'friends'
}

export async function ensureUserProfile(user: User) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  const username = (user.email ?? user.uid).split('@')[0].toLowerCase()
  await setDoc(ref, {
    name: user.displayName || username,
    username,
    bio: '',
    photoURL: user.photoURL || '',
    friendsCount: 0,
    storiesCount: 0,
    notifyMessages: true,
    notifyFriendRequests: true,
    notifyReactions: true,
    profileVisibility: 'everyone',
    createdAt: serverTimestamp(),
  })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid,
    name: data.name ?? '',
    username: data.username ?? '',
    bio: data.bio ?? '',
    photoURL: data.photoURL ?? '',
    friendsCount: data.friendsCount ?? 0,
    storiesCount: data.storiesCount ?? 0,
    notifyMessages: data.notifyMessages ?? true,
    notifyFriendRequests: data.notifyFriendRequests ?? true,
    notifyReactions: data.notifyReactions ?? true,
    profileVisibility: data.profileVisibility ?? 'everyone',
  }
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'name' | 'bio' | 'photoURL' | 'notifyMessages' | 'notifyFriendRequests' | 'notifyReactions' | 'profileVisibility'>>,
) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function isFriendWith(uidA: string, uidB: string): Promise<boolean> {
  if (uidA === uidB) return true
  const snap = await getDoc(doc(db, 'friendships', friendshipId(uidA, uidB)))
  return snap.exists()
}

// ---------- Stories ----------

export const REACTION_EMOJIS = ['😊', '🎉', '💙', '🤩', '🌟']

export type Story = {
  id: string
  authorId: string
  authorName: string
  initials: string
  category: string
  emoji: string
  text: string
  createdAt: Timestamp | null
  reactions: number[]
}

const CATEGORY_EMOJI: Record<string, string> = {
  Rant: '💭',
  Achievement: '🏆',
  Appreciation: '🙏',
  Celebration: '🎉',
  Sad: '😢',
  Funny: '😂',
  Thought: '💡',
  Gratitude: '🙏',
  Goal: '🎯',
  Random: '✨',
}

function toStory(id: string, data: any): Story {
  const reactionsMap = data.reactions ?? {}
  return {
    id,
    authorId: data.authorId,
    authorName: data.authorName,
    initials: data.initials,
    category: data.category,
    emoji: data.emoji,
    text: data.text,
    createdAt: data.createdAt ?? null,
    reactions: REACTION_EMOJIS.map((_, i) => reactionsMap[i] ?? 0),
  }
}

export function subscribeStories(cb: (stories: Story[]) => void) {
  const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => toStory(d.id, d.data()))))
}

export function subscribeUserStories(uid: string, cb: (stories: Story[]) => void) {
  const q = query(collection(db, 'stories'), where('authorId', '==', uid), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => toStory(d.id, d.data()))))
}

export async function createStory(user: User, authorName: string, category: string, text: string) {
  await addDoc(collection(db, 'stories'), {
    authorId: user.uid,
    authorName,
    initials: initialsFrom(authorName),
    category,
    emoji: CATEGORY_EMOJI[category] ?? '💬',
    text,
    createdAt: serverTimestamp(),
    reactions: {},
  })
  await updateDoc(doc(db, 'users', user.uid), { storiesCount: increment(1) })
}

export async function reactToStory(storyId: string, reactionIndex: number) {
  await updateDoc(doc(db, 'stories', storyId), { [`reactions.${reactionIndex}`]: increment(1) })
}

// ---------- Friends ----------

export type FriendRequest = { id: string; fromUid: string; toUid: string; profile: UserProfile | null }

function friendshipId(a: string, b: string) {
  return [a, b].sort().join('_')
}

export async function sendFriendRequest(fromUid: string, toUid: string) {
  if (fromUid === toUid) return
  const existing = await getDocs(
    query(collection(db, 'friend_requests'), where('fromUid', '==', fromUid), where('toUid', '==', toUid)),
  )
  if (!existing.empty) return
  await addDoc(collection(db, 'friend_requests'), { fromUid, toUid, createdAt: serverTimestamp() })
}

export async function acceptFriendRequest(requestId: string, fromUid: string, toUid: string) {
  await setDoc(doc(db, 'friendships', friendshipId(fromUid, toUid)), {
    users: [fromUid, toUid],
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'users', fromUid), { friendsCount: increment(1) })
  await updateDoc(doc(db, 'users', toUid), { friendsCount: increment(1) })
  await deleteDoc(doc(db, 'friend_requests', requestId))
}

export async function declineFriendRequest(requestId: string) {
  await deleteDoc(doc(db, 'friend_requests', requestId))
}

async function profilesFor(uids: string[]): Promise<Map<string, UserProfile>> {
  const map = new Map<string, UserProfile>()
  await Promise.all(
    uids.map(async (uid) => {
      const profile = await getUserProfile(uid)
      if (profile) map.set(uid, profile)
    }),
  )
  return map
}

export function subscribeIncomingRequests(uid: string, cb: (requests: FriendRequest[]) => void) {
  const q = query(collection(db, 'friend_requests'), where('toUid', '==', uid))
  return onSnapshot(q, async (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as { fromUid: string; toUid: string }) }))
    const profiles = await profilesFor(rows.map((r) => r.fromUid))
    cb(rows.map((r) => ({ ...r, profile: profiles.get(r.fromUid) ?? null })))
  })
}

export function subscribeSentRequests(uid: string, cb: (requests: FriendRequest[]) => void) {
  const q = query(collection(db, 'friend_requests'), where('fromUid', '==', uid))
  return onSnapshot(q, async (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as { fromUid: string; toUid: string }) }))
    const profiles = await profilesFor(rows.map((r) => r.toUid))
    cb(rows.map((r) => ({ ...r, profile: profiles.get(r.toUid) ?? null })))
  })
}

export function subscribeFriends(uid: string, cb: (friends: UserProfile[]) => void) {
  const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid))
  return onSnapshot(q, async (snap) => {
    const otherUids = snap.docs.map((d) => (d.data().users as string[]).find((u) => u !== uid)!).filter(Boolean)
    const profiles = await profilesFor(otherUids)
    cb(otherUids.map((u) => profiles.get(u)).filter((p): p is UserProfile => Boolean(p)))
  })
}

export async function suggestFriends(uid: string, exclude: Set<string>, max = 8): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, 'users'), where(documentId(), '!=', uid)))
  return snap.docs
    .map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }))
    .filter((p) => !exclude.has(p.uid))
    .slice(0, max)
}

// ---------- Conversations ----------

export type Conversation = { id: string; otherUid: string; otherProfile: UserProfile | null; lastMessage: string; updatedAt: Timestamp | null }
export type Message = { id: string; senderId: string; text: string; createdAt: Timestamp | null }

export function conversationId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join('_')
}

export async function getOrCreateConversation(uidA: string, uidB: string) {
  const id = conversationId(uidA, uidB)
  const ref = doc(db, 'conversations', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      participantIds: [uidA, uidB],
      lastMessage: '',
      updatedAt: serverTimestamp(),
    })
  }
  return id
}

export function subscribeConversations(uid: string, cb: (conversations: Conversation[]) => void) {
  const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', uid))
  return onSnapshot(q, async (snap) => {
    const rows = snap.docs.map((d) => {
      const data = d.data() as { participantIds: string[]; lastMessage: string; updatedAt: Timestamp | null }
      return { id: d.id, otherUid: data.participantIds.find((p) => p !== uid) ?? uid, lastMessage: data.lastMessage, updatedAt: data.updatedAt }
    })
    const profiles = await profilesFor(rows.map((r) => r.otherUid))
    cb(
      rows
        .map((r) => ({ ...r, otherProfile: profiles.get(r.otherUid) ?? null }))
        .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0)),
    )
  })
}

export function subscribeMessages(convId: string, cb: (messages: Message[]) => void) {
  const q = query(collection(db, 'conversations', convId, 'messages'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) }))))
}

export async function sendMessage(convId: string, senderId: string, text: string) {
  await addDoc(collection(db, 'conversations', convId, 'messages'), { senderId, text, createdAt: serverTimestamp() })
  await updateDoc(doc(db, 'conversations', convId), { lastMessage: text, updatedAt: serverTimestamp() })
}
