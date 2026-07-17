import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, CheckCircle, MapPin, Edit, User, Send, Heart, Home, Plus,
  Settings, MessageCircle, Users, LogOut, Trash2, KeyRound, Sparkles, MailWarning, ClipboardList,
  Star, Calendar, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  signOut, updateProfile, sendPasswordResetEmail, deleteUser, sendEmailVerification
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection,
  onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuth } from './AuthContext';

// ---------- matching ----------
const PREF_FIELDS = [
  { key: 'sleep', label: 'Sleep Schedule 🌙', options: ['Early Bird', 'Flexible', 'Night Owl'], weight: 15 },
  { key: 'cleanliness', label: 'Cleanliness 🧹', options: ['Very Tidy', 'Moderate', 'Relaxed'], weight: 15 },
  { key: 'social', label: 'Social Energy 🎉', options: ['Homebody', 'Balanced', 'Social Butterfly'], weight: 10 },
  { key: 'food', label: 'Food Preference 🥗', options: ['Vegetarian', 'Eggetarian', 'Non-vegetarian'], weight: 15 },
  { key: 'smoking', label: 'Smoking 🚭', options: ['Non-smoker', 'Okay around smokers', 'Smoker'], weight: 10 },
  { key: 'guests', label: 'Guests 👥', options: ['Rarely', 'Sometimes', 'Often'], weight: 10 },
  { key: 'noise', label: 'Noise Tolerance 🔇', options: ['Need silence', 'Moderate', "Don't mind noise"], weight: 10 },
  { key: 'pets', label: 'Pets 🐾', options: ['Love pets', 'Okay with pets', 'No pets'], weight: 10 },
  { key: 'wfh', label: 'Work Style 💻', options: ['Work from home', 'Hybrid', 'Office / College'], weight: 5 },
];

// Score normalized over the questions BOTH people have answered,
// so older/partial profiles still get a fair 0-100
const scoreMatch = (mine, theirs) => {
  let score = 0;
  let totalWeight = 0;
  for (const f of PREF_FIELDS) {
    const a = f.options.indexOf(mine?.[f.key]);
    const b = f.options.indexOf(theirs?.[f.key]);
    if (a === -1 || b === -1) continue;
    totalWeight += f.weight;
    const dist = Math.abs(a - b);
    score += f.weight * (dist === 0 ? 1 : dist === 1 ? 0.5 : 0);
  }
  return totalWeight === 0 ? 0 : Math.round((score / totalWeight) * 100);
};

const CORE_KEYS = ['sleep', 'cleanliness', 'social'];
const hasPrefs = (p) =>
  p && CORE_KEYS.every((k) => {
    const f = PREF_FIELDS.find((x) => x.key === k);
    return f.options.includes(p.preferences?.[k]);
  });

// "✔ Same sleep schedule / ⚠ Different guests preference" summary
const explainMatch = (mine, theirs) => {
  const positives = [];
  const warnings = [];
  for (const f of PREF_FIELDS) {
    const a = f.options.indexOf(mine?.[f.key]);
    const b = f.options.indexOf(theirs?.[f.key]);
    if (a === -1 || b === -1) continue;
    const plain = f.label.replace(/[^\w\s/]/g, '').trim().toLowerCase();
    const d = Math.abs(a - b);
    if (d === 0) positives.push(`Same ${plain}`);
    else if (d === 1) positives.push(`Similar ${plain}`);
    else warnings.push(`Different ${plain} — you: ${mine[f.key]}, her: ${theirs[f.key]}`);
  }
  return { positives, warnings };
};

// Personality chips derived from questionnaire answers
const personalityChips = (p) => {
  if (!p) return [];
  const pr = p.preferences || {};
  const maps = {
    sleep: { 'Early Bird': '🌅 Early riser', 'Night Owl': '🌙 Night owl' },
    cleanliness: { 'Very Tidy': '🧹 Organized', 'Relaxed': '🧘 Easy-going' },
    social: { 'Homebody': '🏠 Homebody', 'Social Butterfly': '🎉 Social butterfly' },
    food: { 'Vegetarian': '🥗 Vegetarian', 'Eggetarian': '🍳 Eggetarian', 'Non-vegetarian': '🍗 Non-vegetarian' },
    smoking: { 'Non-smoker': '🚭 Non-smoker' },
    noise: { 'Need silence': '🤫 Works quietly' },
    pets: { 'Love pets': '🐾 Pet lover' },
    wfh: { 'Work from home': '💻 Works from home' },
  };
  const chips = [];
  for (const k of Object.keys(maps)) {
    if (maps[k][pr[k]]) chips.push(maps[k][pr[k]]);
  }
  if (p.userType) chips.push(p.userType === 'Student' ? '🎓 Student' : '💼 Working');
  if (p.budget) chips.push(`💰 ₹${Number(p.budget).toLocaleString('en-IN')}/mo budget`);
  return chips;
};

const REVIEW_TAGS = ['Clean & tidy', 'Great communication', 'Friendly', 'Pays on time', 'Respects privacy'];

const ICEBREAKERS = [
  "What does your ideal Sunday look like? ☀️",
  "Early bird or night owl — and how loud is your alarm? ⏰",
  "What's your go-to comfort food? 🍜",
  "Music while cooking: yes or no? 🎶",
  "What's one house rule you can't live without?",
  "Chai or coffee? This decides everything ☕",
  "What show are you currently binge-watching? 📺",
  "How do you feel about surprise guests?",
  "What's your cleaning style — daily tidy or weekend deep-clean? 🧹",
  "If we get a plant for the flat, who waters it? 🌱",
];
const chatIdFor = (a, b) => [a, b].sort().join('_');
const initialOf = (name) => (name || '?').trim().charAt(0).toUpperCase();
const sameCity = (a, b) => a && b && a.trim().toLowerCase() === b.trim().toLowerCase();

const AMENITIES = ['WiFi', 'AC', 'Furnished', 'Attached Bathroom', 'Kitchen Access', 'Parking'];

const CHECKLIST = [
  { id: 'rent', label: 'Agree on rent split & due date' },
  { id: 'deposit', label: 'Decide how the security deposit is shared' },
  { id: 'bills', label: 'Plan electricity, WiFi & utility bills' },
  { id: 'cleaning', label: 'Set a cleaning schedule' },
  { id: 'groceries', label: 'Discuss groceries & cooking arrangements' },
  { id: 'guests', label: 'Agree on guests & overnight-visitor policy' },
  { id: 'quiet', label: 'Set quiet hours for study / work' },
  { id: 'safety', label: 'Exchange emergency contacts' },
  { id: 'landlord', label: 'Get both names on the rental agreement' },
  { id: 'agreement', label: 'Write down everything you agreed on' },
];
const EMPTY_LISTING = { title: '', city: '', rent: '', roomType: 'Private Room', description: '', amenities: [] };

const card = 'p-4 rounded-xl bg-blue-900/50 backdrop-blur-sm border border-blue-400/20 transition-colors';
const inputCls = 'w-full px-3 py-2 rounded-lg bg-blue-950/80 border border-blue-400/30 text-white focus:outline-none focus:border-blue-400';
const labelCls = 'block text-sm text-blue-200 mb-1';

// ---------- preferences form (shared by onboarding + profile) ----------
const PreferencesFields = ({ value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {PREF_FIELDS.map((f) => (
      <div key={f.key}>
        <label className={labelCls}>{f.label}</label>
        <select
          className={inputCls}
          value={value?.[f.key] || ''}
          onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
        >
          <option value="" disabled>Select…</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    ))}
  </div>
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('matches');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  // chat state
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMsg, setTypedMsg] = useState('');
  const chatBottomRef = useRef(null);

  // forms
  const [prefsDraft, setPrefsDraft] = useState({});
  const [profileForm, setProfileForm] = useState({
    name: '', age: '', occupation: '', location: '', org: '', userType: '', budget: '', moveIn: ''
  });
  const [saving, setSaving] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [foodFilter, setFoodFilter] = useState('');

  // match interactions
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // room listings
  const [listings, setListings] = useState([]);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingForm, setListingForm] = useState(EMPTY_LISTING);

  // rent split calculator
  const [splitRent, setSplitRent] = useState('');
  const [splitUtils, setSplitUtils] = useState('');
  const [splitPeople, setSplitPeople] = useState(2);

  // visits
  const [visits, setVisits] = useState([]);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitDraft, setVisitDraft] = useState({ date: '', time: '', note: '' });

  // reviews (for the open match modal)
  const [matchReviews, setMatchReviews] = useState([]);
  const [showRateForm, setShowRateForm] = useState(false);
  const [myStars, setMyStars] = useState(0);
  const [myTags, setMyTags] = useState([]);

  // agreement generator
  const [agreement, setAgreement] = useState({
    roommateName: '', rent: '', deposit: '', notice: '30 days', quietHours: '10 PM – 7 AM'
  });

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'there';

  // ---------- data loading ----------
  const loadProfile = async () => {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const data = snap.exists() ? snap.data() : null;
    setProfile(data);
    setPrefsDraft(data?.preferences || {});
    setProfileForm({
      name: data?.name || user.displayName || '',
      age: data?.age || '',
      occupation: data?.occupation || '',
      location: data?.location || '',
      org: data?.org || '',
      userType: data?.userType || '',
      budget: data?.budget || '',
      moveIn: data?.moveIn || '',
    });
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([
      loadProfile(),
      getDocs(collection(db, 'users')).then((snap) =>
        setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.id !== user.uid))
      ),
    ])
      .catch(() => toast.error('Could not load your data. Please refresh.'))
      .finally(() => setProfileLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // live room listings
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snap) => setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // live visits
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'visits'), where('participants', 'array-contains', user.uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((v) => new Date(v.at) >= new Date(Date.now() - 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(a.at) - new Date(b.at));
      setVisits(list);
    });
  }, [user]);

  // load reviews when a match profile opens
  useEffect(() => {
    if (!selectedMatch) { setMatchReviews([]); setShowRateForm(false); return; }
    getDocs(query(collection(db, 'reviews'), where('revieweeId', '==', selectedMatch.id)))
      .then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMatchReviews(list);
        const mine = list.find((r) => r.reviewerId === user.uid);
        setMyStars(mine?.stars || 0);
        setMyTags(mine?.tags || []);
      })
      .catch(() => setMatchReviews([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatch?.id]);

  // live chat list
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.lastMsgAt?.toMillis?.() || 0) - (a.lastMsgAt?.toMillis?.() || 0));
      setChats(list);
    });
  }, [user]);

  // live messages for the open chat
  useEffect(() => {
    if (!selectedChatId) { setMessages([]); return; }
    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('at', 'asc'),
      limit(200)
    );
    return onSnapshot(q, (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [selectedChatId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (selectedChatId && messages.length) {
      localStorage.setItem('sakhi_seen_' + selectedChatId, String(Date.now()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ---------- actions ----------
  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const savePreferences = async () => {
    const missing = PREF_FIELDS.some((f) => !f.options.includes(prefsDraft?.[f.key]));
    if (missing) { toast.error('Please answer all the questions.'); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: profileForm.name || displayName,
        email: user.email,
        preferences: prefsDraft,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await loadProfile();
      toast.success('Preferences saved! Finding your matches…');
    } catch {
      toast.error('Could not save preferences. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!profileForm.name.trim()) { toast.error('Name is required.'); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: profileForm.name.trim(),
        age: profileForm.age,
        occupation: profileForm.occupation,
        location: profileForm.location,
        org: profileForm.org,
        userType: profileForm.userType,
        budget: profileForm.budget,
        moveIn: profileForm.moveIn,
        email: user.email,
        preferences: prefsDraft,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await updateProfile(auth.currentUser, { displayName: profileForm.name.trim() });
      await loadProfile();
      toast.success('Profile updated!');
    } catch {
      toast.error('Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const openChatWith = async (other) => {
    const id = chatIdFor(user.uid, other.id);
    try {
      await setDoc(doc(db, 'chats', id), {
        participants: [user.uid, other.id],
        participantNames: {
          [user.uid]: profile?.name || displayName,
          [other.id]: other.name || other.email?.split('@')[0] || 'User',
        },
      }, { merge: true });
      openChat(id);
      setActiveTab('messages');
    } catch {
      toast.error('Could not open chat. Try again.');
    }
  };

  const sendMessage = async () => {
    const text = typedMsg.trim();
    if (!text || !selectedChatId) return;
    setTypedMsg('');
    try {
      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
        from: user.uid,
        text,
        at: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMsg: text,
        lastMsgAt: serverTimestamp(),
        lastFrom: user.uid,
      });
    } catch {
      toast.error('Message failed to send.');
    }
  };

  const saveListing = async () => {
    if (!listingForm.title.trim() || !listingForm.city.trim() || !listingForm.rent) {
      toast.error('Title, city and rent are required.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'listings'), {
        ...listingForm,
        title: listingForm.title.trim(),
        city: listingForm.city.trim(),
        rent: Number(listingForm.rent),
        ownerId: user.uid,
        ownerName: profile?.name || displayName,
        createdAt: serverTimestamp(),
      });
      setListingForm(EMPTY_LISTING);
      setShowListingForm(false);
      toast.success('Room posted! 🏠');
    } catch {
      toast.error('Could not post the room. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteListing = async (listingId) => {
    if (!window.confirm('Remove this room listing?')) return;
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      toast.success('Listing removed.');
    } catch {
      toast.error('Could not remove listing.');
    }
  };

  const toggleSaved = async (matchId) => {
    const saved = profile?.savedIds || [];
    const updated = saved.includes(matchId) ? saved.filter((id) => id !== matchId) : [...saved, matchId];
    setProfile((p) => ({ ...(p || {}), savedIds: updated }));
    try {
      await setDoc(doc(db, 'users', user.uid), { savedIds: updated }, { merge: true });
    } catch {
      toast.error('Could not save. Check your connection.');
    }
  };

  const blockAndReport = async (other) => {
    const sure = window.confirm(
      `Report and block ${other.name || 'this member'}? She will no longer appear in your matches or messages.`
    );
    if (!sure) return;
    const updated = [...(profile?.blockedIds || []), other.id];
    setProfile((p) => ({ ...(p || {}), blockedIds: updated }));
    setSelectedMatch(null);
    try {
      await setDoc(doc(db, 'users', user.uid), { blockedIds: updated }, { merge: true });
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reportedId: other.id,
        reportedName: other.name || '',
        createdAt: serverTimestamp(),
      });
      toast.success('Reported and blocked. Stay safe! 💙');
    } catch {
      toast.error('Could not complete the report. Try again.');
    }
  };

  const toggleChecklistItem = async (itemId) => {
    const current = !!profile?.checklist?.[itemId];
    const updated = { ...(profile?.checklist || {}), [itemId]: !current };
    setProfile((p) => ({ ...(p || {}), checklist: updated }));
    try {
      await setDoc(doc(db, 'users', user.uid), { checklist: updated }, { merge: true });
    } catch {
      toast.error('Could not save. Check your connection.');
    }
  };

  const resendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success('Verification email sent — check your inbox!');
    } catch {
      toast.error('Could not send email. Try again in a few minutes.');
    }
  };

  const scheduleVisit = async () => {
    if (!visitDraft.date || !visitDraft.time) { toast.error('Pick a date and time.'); return; }
    const chat = chats.find((c) => c.id === selectedChatId);
    if (!chat) return;
    try {
      await addDoc(collection(db, 'visits'), {
        participants: chat.participants,
        names: chat.participantNames || {},
        at: `${visitDraft.date}T${visitDraft.time}`,
        note: visitDraft.note.trim(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      const when = new Date(`${visitDraft.date}T${visitDraft.time}`).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
      });
      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
        from: user.uid,
        text: `📅 Room visit scheduled: ${when}${visitDraft.note ? ` — ${visitDraft.note.trim()}` : ''}`,
        at: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMsg: '📅 Room visit scheduled', lastMsgAt: serverTimestamp(), lastFrom: user.uid,
      });
      setShowVisitForm(false);
      setVisitDraft({ date: '', time: '', note: '' });
      toast.success('Visit scheduled! 📅');
    } catch {
      toast.error('Could not schedule the visit.');
    }
  };

  const cancelVisit = async (visitId) => {
    if (!window.confirm('Cancel this visit?')) return;
    try { await deleteDoc(doc(db, 'visits', visitId)); toast.success('Visit cancelled.'); }
    catch { toast.error('Could not cancel.'); }
  };

  const submitReview = async () => {
    if (!myStars) { toast.error('Pick a star rating first.'); return; }
    try {
      await setDoc(doc(db, 'reviews', `${user.uid}_${selectedMatch.id}`), {
        reviewerId: user.uid,
        revieweeId: selectedMatch.id,
        stars: myStars,
        tags: myTags,
        createdAt: serverTimestamp(),
      });
      setMatchReviews((prev) => [
        ...prev.filter((r) => r.reviewerId !== user.uid),
        { reviewerId: user.uid, revieweeId: selectedMatch.id, stars: myStars, tags: myTags },
      ]);
      setShowRateForm(false);
      toast.success('Review saved! ⭐');
    } catch {
      toast.error('Could not save the review.');
    }
  };

  const generateAgreement = () => {
    if (!agreement.roommateName.trim() || !agreement.rent) {
      toast.error('Roommate name and rent are required.');
      return;
    }
    const myName = profile?.name || displayName;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const rent = Number(agreement.rent).toLocaleString('en-IN');
    const half = Math.ceil(Number(agreement.rent) / 2).toLocaleString('en-IN');
    const w = window.open('', '_blank');
    if (!w) { toast.error('Please allow pop-ups to print the agreement.'); return; }
    w.document.write(`<!doctype html><html><head><title>Roommate Agreement</title>
      <style>
        body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #1a1a2e; line-height: 1.7; padding: 0 24px; }
        h1 { text-align: center; border-bottom: 3px double #3949ab; padding-bottom: 12px; color: #283593; }
        h2 { color: #3949ab; margin-top: 28px; font-size: 1.1rem; }
        .sig { display: flex; justify-content: space-between; margin-top: 70px; }
        .sig div { border-top: 1px solid #333; padding-top: 6px; width: 40%; text-align: center; }
        .meta { text-align: center; color: #555; }
        @media print { body { margin: 10mm; } }
      </style></head><body>
      <h1>Roommate Agreement</h1>
      <p class="meta">Made on ${today} • Generated with Saakhi</p>
      <p>This agreement is between <strong>${myName}</strong> and <strong>${agreement.roommateName.trim()}</strong>, who have agreed to live together as roommates on the following terms:</p>
      <h2>1. Rent</h2>
      <p>Total monthly rent is <strong>₹${rent}</strong>, split equally — <strong>₹${half} each</strong>, payable by the 5th of every month.</p>
      ${agreement.deposit ? `<h2>2. Security Deposit</h2><p>The security deposit of <strong>₹${Number(agreement.deposit).toLocaleString('en-IN')}</strong> is shared equally and refundable on move-out per the landlord's terms.</p>` : ''}
      <h2>${agreement.deposit ? 3 : 2}. Bills & Utilities</h2>
      <p>Electricity, water, WiFi, and shared groceries are split equally. Records kept in a shared note or app.</p>
      <h2>${agreement.deposit ? 4 : 3}. Cleaning</h2>
      <p>Common areas are cleaned on an alternating weekly schedule. Each roommate keeps her own room tidy.</p>
      <h2>${agreement.deposit ? 5 : 4}. Quiet Hours & Guests</h2>
      <p>Quiet hours: <strong>${agreement.quietHours}</strong>. Overnight guests need advance notice to the other roommate.</p>
      <h2>${agreement.deposit ? 6 : 5}. Notice Period</h2>
      <p>Either roommate may move out with <strong>${agreement.notice}</strong> written notice, and will pay her share of rent for that period.</p>
      <div class="sig"><div>${myName}</div><div>${agreement.roommateName.trim()}</div></div>
      <script>window.print();</` + `script></body></html>`);
    w.document.close();
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch {
      toast.error('Could not send reset email. Try again later.');
    }
  };

  const handleDeleteAccount = async () => {
    const sure = window.confirm(
      'Delete your Saakhi account permanently? Your profile and matches will be removed. This cannot be undone.'
    );
    if (!sure) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(auth.currentUser);
      toast.success('Account deleted. Take care! 💙');
      navigate('/');
    } catch (err) {
      if (err?.code === 'auth/requires-recent-login') {
        toast.error('For security, please sign out, log in again, and then delete your account.');
      } else {
        toast.error('Could not delete account. Try again.');
      }
    }
  };

  // ---------- derived ----------
  const iHavePrefs = hasPrefs(profile);
  const blockedIds = profile?.blockedIds || [];
  const savedIds = profile?.savedIds || [];
  const allCandidates = iHavePrefs
    ? allUsers
        .filter((u) => hasPrefs(u) && !blockedIds.includes(u.id))
        .map((u) => ({ ...u, score: scoreMatch(profile.preferences, u.preferences) }))
        .sort((a, b) => b.score - a.score)
    : [];
  const candidates = allCandidates
    .filter((u) => !cityFilter.trim() || (u.location || '').toLowerCase().includes(cityFilter.trim().toLowerCase()))
    .filter((u) => !showSavedOnly || savedIds.includes(u.id))
    .filter((u) => !budgetMax || !u.budget || Number(u.budget) <= Number(budgetMax))
    .filter((u) => !foodFilter || u.preferences?.food === foodFilter);

  const bestMatches = allCandidates.slice(0, 3);

  const visibleChats = chats.filter(
    (c) => !(c.participants || []).some((p) => p !== user.uid && blockedIds.includes(p))
  );

  const completeness = (() => {
    if (!profile) return 0;
    const fields = [
      profile.name, profile.age, profile.occupation, profile.location,
      profile.preferences?.sleep, profile.preferences?.cleanliness, profile.preferences?.social,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })();

  // unread = last message from the other person, newer than when I last opened the chat
  const isUnread = (chat) =>
    chat.lastFrom && chat.lastFrom !== user.uid &&
    (chat.lastMsgAt?.toMillis?.() || 0) > Number(localStorage.getItem('sakhi_seen_' + chat.id) || 0);
  const unreadCount = visibleChats.filter(isUnread).length;

  const openChat = (chatId) => {
    setSelectedChatId(chatId);
    localStorage.setItem('sakhi_seen_' + chatId, String(Date.now()));
  };

  const otherNameOf = (chat) => {
    const otherUid = (chat.participants || []).find((p) => p !== user.uid);
    return chat.participantNames?.[otherUid] || 'User';
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const scoreColor = (s) => (s >= 75 ? 'text-emerald-400' : s >= 50 ? 'text-blue-400' : 'text-slate-300');

  const tabs = [
    { id: 'matches', label: 'Matches', icon: Users },
    { id: 'rooms', label: 'Rooms', icon: Home },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'checklist', label: 'Checklist', icon: ClipboardList },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ---------- render ----------
  return (
    <div className="relative min-h-screen w-full text-white bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900">
      <div className="fixed top-0 -left-40 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 -right-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Navbar */}
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="fixed top-0 left-0 w-full bg-blue-900/80 backdrop-blur-xl shadow-lg z-20 border-b border-blue-400/20"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <span className="text-2xl font-extrabold text-blue-400 tracking-tight drop-shadow-lg">
                Saakhi
              </span>

              <div className="flex space-x-1 sm:space-x-2">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`relative px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 text-sm sm:text-base transition ${
                      activeTab === t.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-transparent hover:bg-blue-400/20 text-blue-200'
                    }`}
                  >
                    <t.icon size={16} />
                    <span className="hidden sm:inline">{t.label}</span>
                    {t.id === 'messages' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[11px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-white text-sm hidden md:block">
                  Hi, <span className="font-medium">{displayName}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="text-blue-200 hover:text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.nav>

        <div className="pt-24">
          {user && !user.emailVerified && (
            <div className="mb-6 flex items-center gap-3 flex-wrap bg-amber-500/15 border border-amber-400/40 rounded-lg px-4 py-3 text-sm">
              <MailWarning className="w-5 h-5 text-amber-300 flex-shrink-0" />
              <span className="text-amber-100 flex-1">
                Please verify your email address to keep your account secure.
              </span>
              <button
                onClick={resendVerification}
                className="px-3 py-1.5 bg-amber-500/80 hover:bg-amber-500 rounded font-semibold text-amber-950"
              >
                Resend Email
              </button>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <h1 className="text-2xl md:text-3xl font-bold">
              {greeting}, <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">{displayName}</span> 👋
            </h1>
            <p className="text-blue-200 text-sm mt-1">Let's find you the perfect roommate.</p>
          </motion.div>

          {profileLoading ? (
            <div className="flex justify-center pt-20">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* ---------------- MATCHES ---------------- */}
              {activeTab === 'matches' && (
                <div>
                  {!iHavePrefs ? (
                    /* Onboarding: no fake data for new users */
                    <div className={`${card} max-w-2xl mx-auto p-8 text-center`}>
                      <Sparkles className="w-10 h-10 text-blue-300 mx-auto mb-3" />
                      <h2 className="text-2xl font-bold mb-2">Welcome, {displayName}! 👋</h2>
                      <p className="text-blue-200 mb-6">
                        Tell us how you like to live, and we'll match you with compatible roommates.
                        Your matches appear only after this — no guesswork.
                      </p>
                      <div className="text-left">
                        <PreferencesFields value={prefsDraft} onChange={setPrefsDraft} />
                      </div>
                      <button
                        onClick={savePreferences}
                        disabled={saving}
                        className="mt-6 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save & Find Matches'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-4">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Matches', value: allCandidates.length, icon: Heart, tint: 'text-pink-300 bg-pink-500/15' },
                            { label: 'Conversations', value: chats.length, icon: MessageCircle, tint: 'text-blue-300 bg-blue-500/15' },
                            { label: 'Profile Complete', value: completeness + '%', icon: User, tint: 'text-emerald-300 bg-emerald-500/15' },
                          ].map((s) => (
                            <div key={s.label} className={`${card} flex items-center gap-3 py-3`}>
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.tint}`}>
                                <s.icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xl font-bold leading-tight">{s.value}</div>
                                <div className="text-xs text-blue-200 truncate">{s.label}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Today's Best Matches */}
                        {bestMatches.length > 0 && (
                          <div className={`${card} p-4`}>
                            <h2 className="font-semibold mb-3 flex items-center gap-2">
                              <Sparkles size={16} className="text-amber-300" /> Today's Best Matches
                            </h2>
                            <div className="flex gap-3 flex-wrap">
                              {bestMatches.map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => setSelectedMatch(m)}
                                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-800/50 border border-blue-400/30 hover:border-blue-300 transition"
                                >
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold">
                                    {initialOf(m.name)}
                                  </div>
                                  <span className="text-sm font-medium">{m.name?.split(' ')[0]}</span>
                                  <span className={`text-sm font-bold ${scoreColor(m.score)}`}>{m.score}%</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h2 className="text-xl font-semibold">Your Matches</h2>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setShowSavedOnly((s) => !s)}
                              className={`px-3 py-1.5 rounded-lg text-sm border transition flex items-center gap-1.5 ${
                                showSavedOnly
                                  ? 'bg-pink-500/25 border-pink-400/60 text-pink-200'
                                  : 'bg-blue-950/80 border-blue-400/30 text-blue-200 hover:border-blue-400'
                              }`}
                            >
                              <Heart size={14} className={showSavedOnly ? 'fill-pink-400 text-pink-400' : ''} /> Saved
                            </button>
                            <input
                              type="text"
                              placeholder="City…"
                              value={cityFilter}
                              onChange={(e) => setCityFilter(e.target.value)}
                              className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-400/30 text-sm text-white focus:outline-none focus:border-blue-400 w-28"
                            />
                            <input
                              type="number"
                              placeholder="Max ₹/mo"
                              value={budgetMax}
                              onChange={(e) => setBudgetMax(e.target.value)}
                              className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-400/30 text-sm text-white focus:outline-none focus:border-blue-400 w-28"
                            />
                            <select
                              value={foodFilter}
                              onChange={(e) => setFoodFilter(e.target.value)}
                              className="px-2 py-1.5 rounded-lg bg-blue-950/80 border border-blue-400/30 text-sm text-white focus:outline-none focus:border-blue-400"
                            >
                              <option value="">Any food</option>
                              <option>Vegetarian</option>
                              <option>Eggetarian</option>
                              <option>Non-vegetarian</option>
                            </select>
                          </div>
                        </div>
                        {candidates.length === 0 ? (
                          <div className={`${card} p-8 text-center`}>
                            <Heart className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                            <p className="font-medium mb-1">
                              {cityFilter.trim() ? `No matches in "${cityFilter.trim()}"` : 'No matches yet'}
                            </p>
                            <p className="text-sm text-blue-200">
                              {cityFilter.trim()
                                ? 'Try clearing the city filter to see all your matches.'
                                : "Saakhi is growing! You'll see compatible roommates here as more women join and set their preferences."}
                            </p>
                          </div>
                        ) : (
                          candidates.map((m) => (
                            <div key={m.id} className={`${card} hover:border-blue-400/40 transition`}>
                              <div
                                className="flex justify-between items-center gap-3 flex-wrap cursor-pointer"
                                onClick={() => setSelectedMatch(m)}
                                title="View profile"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                                    {initialOf(m.name)}
                                  </div>
                                  <div>
                                    <h3 className="font-medium">{m.name || 'Saakhi member'}</h3>
                                    <p className="text-sm text-gray-300 flex items-center gap-1 flex-wrap">
                                      {m.occupation && <span>{m.occupation}</span>}
                                      {m.location && (
                                        <span className="flex items-center">
                                          <MapPin className="w-3 h-3 mr-0.5" />{m.location}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${scoreColor(m.score)}`}>{m.score}% Match</p>
                                  {sameCity(m.location, profile?.location) && (
                                    <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">
                                      Same city
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => openChatWith(m)}
                                  className="px-4 py-1.5 text-sm rounded-full bg-blue-500 hover:bg-blue-600 transition font-medium flex items-center gap-1.5"
                                >
                                  <MessageCircle size={14} /> Message
                                </button>
                                <button
                                  onClick={() => toggleSaved(m.id)}
                                  title={savedIds.includes(m.id) ? 'Remove from saved' : 'Save for later'}
                                  className={`p-2 rounded-full border transition ${
                                    savedIds.includes(m.id)
                                      ? 'bg-pink-500/25 border-pink-400/60'
                                      : 'border-blue-400/30 hover:border-pink-400/60'
                                  }`}
                                >
                                  <Heart size={15} className={savedIds.includes(m.id) ? 'fill-pink-400 text-pink-400' : 'text-blue-200'} />
                                </button>
                                <button
                                  onClick={() => setSelectedMatch(m)}
                                  className="ml-auto text-sm text-blue-300 hover:underline"
                                >
                                  View Profile →
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="space-y-4">
                        {completeness < 100 && (
                          <div className={card}>
                            <h2 className="text-lg font-semibold mb-2">Complete Your Profile</h2>
                            <div className="w-full h-2 bg-blue-950 rounded-full overflow-hidden mb-2">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all"
                                style={{ width: completeness + '%' }}
                              ></div>
                            </div>
                            <p className="text-sm text-blue-200 mb-2">{completeness}% done — complete profiles get better matches!</p>
                            <button
                              onClick={() => setActiveTab('profile')}
                              className="text-sm text-blue-300 hover:underline flex items-center"
                            >
                              <Edit className="w-4 h-4 mr-1" /> Finish Profile
                            </button>
                          </div>
                        )}

                        <div className={card}>
                          <h2 className="text-lg font-semibold mb-2">Your Preferences</h2>
                          <ul className="text-sm space-y-1 text-blue-100">
                            {PREF_FIELDS.filter((f) => profile.preferences[f.key]).map((f) => (
                              <li key={f.key}>{f.label}: <span className="text-white">{profile.preferences[f.key]}</span></li>
                            ))}
                          </ul>
                          <button
                            onClick={() => setActiveTab('profile')}
                            className="mt-3 text-sm text-blue-300 hover:underline flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit Preferences
                          </button>
                        </div>

                        {visits.length > 0 && (
                          <div className={card}>
                            <h2 className="text-lg font-semibold mb-2 flex items-center">
                              <Calendar className="w-5 h-5 mr-2" /> Upcoming Visits
                            </h2>
                            <ul className="space-y-2">
                              {visits.map((v) => {
                                const otherUid = (v.participants || []).find((p) => p !== user.uid);
                                return (
                                  <li key={v.id} className="text-sm bg-white/5 rounded-lg px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-medium">{v.names?.[otherUid] || 'Roommate'}</span>
                                      <button onClick={() => cancelVisit(v.id)} className="text-xs text-red-300 hover:underline">
                                        Cancel
                                      </button>
                                    </div>
                                    <div className="text-blue-200">
                                      {new Date(v.at).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                                    </div>
                                    {v.note && <div className="text-xs text-blue-200/80 mt-0.5">{v.note}</div>}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        <div className={card}>
                          <h2 className="text-lg font-semibold mb-2 flex items-center">
                            <Shield className="w-5 h-5 mr-2" /> Safety First
                          </h2>
                          <ul className="text-sm space-y-1.5 text-blue-100">
                            <li>✓ Meet first in public places</li>
                            <li>✓ Never share financial details in chat</li>
                            <li>✓ Verify identity before moving in</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- ROOMS ---------------- */}
              {activeTab === 'rooms' && (
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-xl font-semibold">Rooms Available</h2>
                    <button
                      onClick={() => setShowListingForm((s) => !s)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                    >
                      <Plus size={16} /> {showListingForm ? 'Cancel' : 'Post Your Room'}
                    </button>
                  </div>

                  {/* Rent split calculator */}
                  <div className={`${card} p-4`}>
                    <h3 className="font-semibold mb-3">💰 Rent Split Calculator</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Total Rent (₹)</label>
                        <input className={inputCls} type="number" min="0" placeholder="15000"
                          value={splitRent} onChange={(e) => setSplitRent(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Bills (₹)</label>
                        <input className={inputCls} type="number" min="0" placeholder="2000"
                          value={splitUtils} onChange={(e) => setSplitUtils(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Roommates</label>
                        <select className={inputCls} value={splitPeople}
                          onChange={(e) => setSplitPeople(Number(e.target.value))}>
                          {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    {(Number(splitRent) > 0 || Number(splitUtils) > 0) && (
                      <p className="mt-3 text-center text-lg">
                        Each pays{' '}
                        <span className="font-bold text-emerald-300">
                          ₹{Math.ceil((Number(splitRent || 0) + Number(splitUtils || 0)) / splitPeople).toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-blue-200"> /month</span>
                      </p>
                    )}
                  </div>

                  {showListingForm && (
                    <div className={`${card} p-5`}>
                      <h3 className="font-semibold mb-4">Post a room for rent</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Title *</label>
                          <input className={inputCls} placeholder="e.g. Sunny room in 2BHK near metro"
                            value={listingForm.title}
                            onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>City *</label>
                          <input className={inputCls} placeholder="e.g. Noida"
                            value={listingForm.city}
                            onChange={(e) => setListingForm({ ...listingForm, city: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Rent (₹/month) *</label>
                          <input className={inputCls} type="number" min="0" placeholder="e.g. 8000"
                            value={listingForm.rent}
                            onChange={(e) => setListingForm({ ...listingForm, rent: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Room Type</label>
                          <select className={inputCls} value={listingForm.roomType}
                            onChange={(e) => setListingForm({ ...listingForm, roomType: e.target.value })}>
                            <option>Private Room</option>
                            <option>Shared Room</option>
                            <option>Entire Flat</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Description</label>
                          <textarea className={`${inputCls} min-h-[70px]`} placeholder="Nearby landmarks, house rules, flatmates…"
                            value={listingForm.description}
                            onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Amenities</label>
                          <div className="flex flex-wrap gap-2">
                            {AMENITIES.map((a) => {
                              const on = listingForm.amenities.includes(a);
                              return (
                                <button key={a} type="button"
                                  onClick={() => setListingForm({
                                    ...listingForm,
                                    amenities: on
                                      ? listingForm.amenities.filter((x) => x !== a)
                                      : [...listingForm.amenities, a],
                                  })}
                                  className={`px-3 py-1 rounded-full text-xs border transition ${
                                    on
                                      ? 'bg-blue-500 border-blue-400 text-white'
                                      : 'bg-transparent border-blue-400/40 text-blue-200 hover:border-blue-400'
                                  }`}
                                >
                                  {a}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={saveListing}
                        disabled={saving}
                        className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold disabled:opacity-60"
                      >
                        {saving ? 'Posting…' : 'Post Room'}
                      </button>
                    </div>
                  )}

                  {listings.length === 0 ? (
                    <div className={`${card} p-8 text-center`}>
                      <Home className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                      <p className="font-medium mb-1">No rooms posted yet</p>
                      <p className="text-sm text-blue-200">
                        Have a spare room? Be the first to post it and find your roommate!
                      </p>
                    </div>
                  ) : (
                    listings.map((l) => (
                      <div key={l.id} className={`${card} hover:border-blue-400/40 transition`}>
                        <div className="flex justify-between items-start gap-3 flex-wrap">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg">{l.title}</h3>
                            <p className="text-sm text-gray-300 flex items-center gap-2 flex-wrap mt-0.5">
                              <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5" />{l.city}</span>
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs">{l.roomType}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-400">₹{Number(l.rent).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-blue-200">per month</p>
                          </div>
                        </div>
                        {l.description && <p className="text-sm text-blue-100 mt-2">{l.description}</p>}
                        {l.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {l.amenities.map((a) => (
                              <span key={a} className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-blue-200">✓ {a}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-400/10">
                          <div className="flex items-center gap-2 text-sm text-blue-200">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                              {initialOf(l.ownerName)}
                            </div>
                            {l.ownerId === user.uid ? 'Posted by you' : l.ownerName}
                          </div>
                          {l.ownerId === user.uid ? (
                            <button
                              onClick={() => deleteListing(l.id)}
                              className="px-3 py-1.5 text-sm rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/40 transition flex items-center gap-1"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => openChatWith({ id: l.ownerId, name: l.ownerName })}
                              className="px-4 py-1.5 text-sm rounded-full bg-blue-500 hover:bg-blue-600 transition font-medium flex items-center gap-1.5"
                            >
                              <MessageCircle size={14} /> Message
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ---------------- MESSAGES ---------------- */}
              {activeTab === 'messages' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 bg-blue-950/60 p-4 rounded-lg max-h-[530px] overflow-y-auto">
                    {visibleChats.length === 0 ? (
                      <div className="text-center py-10 text-blue-200 text-sm">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
                        No conversations yet.<br />Message a match to start chatting!
                      </div>
                    ) : (
                      visibleChats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => openChat(chat.id)}
                          className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 transition ${
                            selectedChatId === chat.id ? 'bg-blue-700/40' : 'hover:bg-blue-800/40'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-lg font-bold">
                            {initialOf(otherNameOf(chat))}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="font-medium text-blue-200">{otherNameOf(chat)}</div>
                            <div className="text-xs text-gray-300 truncate">{chat.lastMsg || 'Say hi! 👋'}</div>
                          </div>
                          {isUnread(chat) && <div className="ml-2 w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="md:col-span-2 bg-blue-950/60 p-4 rounded-lg flex flex-col h-[500px]">
                    {selectedChatId ? (
                      <>
                        <div className="flex items-center mb-3 pb-3 border-b border-blue-400/20">
                          <User className="w-6 h-6 mr-2 text-blue-200" />
                          <span className="font-semibold">
                            {otherNameOf(chats.find((c) => c.id === selectedChatId) || {})}
                          </span>
                          <button
                            onClick={() => setShowVisitForm((s) => !s)}
                            className="ml-auto px-3 py-1.5 text-xs rounded-full bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/40 transition flex items-center gap-1.5"
                          >
                            <Calendar size={13} /> Schedule Visit
                          </button>
                        </div>

                        {showVisitForm && (
                          <div className="mb-3 p-3 rounded-lg bg-blue-900/60 border border-blue-400/30">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <input type="date" className={inputCls} value={visitDraft.date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setVisitDraft({ ...visitDraft, date: e.target.value })} />
                              <input type="time" className={inputCls} value={visitDraft.time}
                                onChange={(e) => setVisitDraft({ ...visitDraft, time: e.target.value })} />
                            </div>
                            <input type="text" className={inputCls} placeholder="Note (e.g. address, landmark)…"
                              value={visitDraft.note}
                              onChange={(e) => setVisitDraft({ ...visitDraft, note: e.target.value })} />
                            <button
                              onClick={scheduleVisit}
                              className="mt-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold"
                            >
                              Confirm Visit
                            </button>
                          </div>
                        )}
                        <div className="flex-1 overflow-y-auto mb-4 pr-2">
                          {messages.length === 0 && (
                            <div className="text-center text-blue-200/70 text-sm pt-10">
                              This is the beginning of your conversation. Say hi! 👋
                            </div>
                          )}
                          {messages.map((msg) => (
                            <div key={msg.id} className={`mb-2 flex ${msg.from === user.uid ? 'justify-end' : ''}`}>
                              <div className={`p-2 px-3 rounded-lg text-sm max-w-xs ${
                                msg.from === user.uid ? 'bg-violet-500/80' : 'bg-blue-600/80'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                          <div ref={chatBottomRef} />
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => setTypedMsg(ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)])}
                            title="Suggest an icebreaker question"
                            className="px-3 py-2 rounded-l-lg bg-blue-950/80 border-r border-blue-400/20 text-amber-300 hover:text-amber-200"
                          >
                            <Sparkles size={18} />
                          </button>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-blue-950/80 text-white focus:outline-none"
                            placeholder="Type your message… (✨ for an icebreaker)"
                            value={typedMsg}
                            onChange={(e) => setTypedMsg(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                          />
                          <button
                            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-r-lg disabled:opacity-50"
                            onClick={sendMessage}
                            disabled={!typedMsg.trim()}
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 flex-1 flex items-center justify-center">
                        Select a conversation to start chatting.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------- CHECKLIST ---------------- */}
              {activeTab === 'checklist' && (() => {
                const doneCount = CHECKLIST.filter((i) => profile?.checklist?.[i.id]).length;
                const pct = Math.round((doneCount / CHECKLIST.length) * 100);
                return (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className={`${card} p-6`}>
                      <h2 className="text-xl font-bold flex items-center mb-1">
                        <ClipboardList className="w-5 h-5 mr-2" /> Roommate Agreement Checklist
                      </h2>
                      <p className="text-sm text-blue-200 mb-4">
                        Things to sort out with your roommate before moving in together — tick them off as you go.
                      </p>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-2 bg-blue-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full transition-all"
                            style={{ width: pct + '%' }}
                          ></div>
                        </div>
                        <span className="text-sm text-blue-200 whitespace-nowrap">{doneCount}/{CHECKLIST.length} done</span>
                      </div>
                      <ul className="space-y-2">
                        {CHECKLIST.map((item) => {
                          const done = !!profile?.checklist?.[item.id];
                          return (
                            <li key={item.id}>
                              <button
                                onClick={() => toggleChecklistItem(item.id)}
                                className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg border transition ${
                                  done
                                    ? 'bg-emerald-500/10 border-emerald-400/40'
                                    : 'bg-blue-900/50 border-blue-400/20 hover:border-blue-400/50'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  done ? 'bg-emerald-500 border-emerald-500' : 'border-blue-300'
                                }`}>
                                  {done && <CheckCircle className="w-4 h-4 text-white" />}
                                </span>
                                <span className={done ? 'line-through text-blue-200/70' : 'text-white'}>
                                  {item.label}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      {pct === 100 && (
                        <p className="mt-4 text-center text-emerald-300 font-medium">
                          🎉 All set! You're ready for harmonious co-living.
                        </p>
                      )}
                    </div>

                    {/* Agreement generator */}
                    <div className={`${card} p-6`}>
                      <h2 className="text-xl font-bold flex items-center mb-1">
                        <FileText className="w-5 h-5 mr-2" /> Roommate Agreement Generator
                      </h2>
                      <p className="text-sm text-blue-200 mb-4">
                        Fill in the details and get a print-ready agreement (save it as PDF from the print dialog).
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Roommate's Name *</label>
                          <input className={inputCls} value={agreement.roommateName}
                            onChange={(e) => setAgreement({ ...agreement, roommateName: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Total Monthly Rent (₹) *</label>
                          <input className={inputCls} type="number" min="0" value={agreement.rent}
                            onChange={(e) => setAgreement({ ...agreement, rent: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Security Deposit (₹)</label>
                          <input className={inputCls} type="number" min="0" value={agreement.deposit}
                            onChange={(e) => setAgreement({ ...agreement, deposit: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Notice Period</label>
                          <select className={inputCls} value={agreement.notice}
                            onChange={(e) => setAgreement({ ...agreement, notice: e.target.value })}>
                            <option>15 days</option>
                            <option>30 days</option>
                            <option>60 days</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Quiet Hours</label>
                          <input className={inputCls} value={agreement.quietHours}
                            onChange={(e) => setAgreement({ ...agreement, quietHours: e.target.value })} />
                        </div>
                      </div>
                      <button
                        onClick={generateAgreement}
                        className="mt-4 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold flex items-center gap-2"
                      >
                        <FileText size={16} /> Generate & Print
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ---------------- PROFILE ---------------- */}
              {activeTab === 'profile' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className={`${card} p-6`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                        {initialOf(displayName)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{displayName}</h2>
                        <p className="text-sm text-blue-200">{user?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Full Name</label>
                        <input className={inputCls} value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>Age</label>
                        <input className={inputCls} type="number" value={profileForm.age}
                          onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>Occupation</label>
                        <input className={inputCls} value={profileForm.occupation}
                          onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>City / Preferred Location</label>
                        <input className={inputCls} value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>University / Company</label>
                        <input className={inputCls} value={profileForm.org}
                          onChange={(e) => setProfileForm({ ...profileForm, org: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>I am a…</label>
                        <select className={inputCls} value={profileForm.userType}
                          onChange={(e) => setProfileForm({ ...profileForm, userType: e.target.value })}>
                          <option value="" disabled>Select…</option>
                          <option>Student</option>
                          <option>Working</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Budget (₹/month)</label>
                        <input className={inputCls} type="number" min="0" placeholder="e.g. 10000"
                          value={profileForm.budget}
                          onChange={(e) => setProfileForm({ ...profileForm, budget: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>Move-in Date</label>
                        <input className={inputCls} type="date" value={profileForm.moveIn}
                          onChange={(e) => setProfileForm({ ...profileForm, moveIn: e.target.value })} />
                      </div>
                    </div>

                    {personalityChips(profile).length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold mt-6 mb-2">Your Personality Snapshot</h3>
                        <p className="text-xs text-blue-200 mb-2">Auto-generated from your answers — this is how matches see you.</p>
                        <div className="flex flex-wrap gap-1.5">
                          {personalityChips(profile).map((chip) => (
                            <span key={chip} className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-blue-100">
                              {chip}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    <h3 className="text-lg font-semibold mt-6 mb-3">Lifestyle Preferences</h3>
                    <PreferencesFields value={prefsDraft} onChange={setPrefsDraft} />

                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="mt-6 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- SETTINGS ---------------- */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className={`${card} p-6`}>
                    <h2 className="text-lg font-semibold mb-4">Account</h2>
                    <div className="text-sm space-y-2 text-blue-100">
                      <p>Email: <span className="text-white">{user?.email}</span></p>
                      <p>Member since:{' '}
                        <span className="text-white">
                          {user?.metadata?.creationTime
                            ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                            : '—'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className={`${card} p-6`}>
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <KeyRound className="w-5 h-5 mr-2" /> Security
                    </h2>
                    <p className="text-sm text-blue-200 mb-3">
                      We'll email you a secure link to change your password.
                    </p>
                    <button
                      onClick={handlePasswordReset}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold"
                    >
                      Send Password Reset Email
                    </button>
                  </div>

                  <div className={`${card} p-6`}>
                    <h2 className="text-lg font-semibold mb-4">Session</h2>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>

                  <div className="p-6 rounded-lg bg-red-950/40 border border-red-500/30">
                    <h2 className="text-lg font-semibold mb-2 text-red-300 flex items-center">
                      <Trash2 className="w-5 h-5 mr-2" /> Danger Zone
                    </h2>
                    <p className="text-sm text-red-200/80 mb-3">
                      Permanently delete your account, profile, and matches. This cannot be undone.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm font-semibold"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---------------- MATCH DETAIL MODAL ---------------- */}
      {selectedMatch && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMatch(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-blue-900 border border-blue-400/40 shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                  {initialOf(selectedMatch.name)}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedMatch.name || 'Saakhi member'}</h2>
                  <p className="text-sm text-blue-200">
                    {[selectedMatch.age && `${selectedMatch.age} yrs`, selectedMatch.occupation]
                      .filter(Boolean).join(' • ')}
                  </p>
                  {selectedMatch.location && (
                    <p className="text-sm text-blue-200 flex items-center">
                      <MapPin className="w-3 h-3 mr-0.5" />{selectedMatch.location}
                      {sameCity(selectedMatch.location, profile?.location) && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">Same city</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <span className={`text-xl font-bold ${scoreColor(selectedMatch.score)}`}>
                {selectedMatch.score}%
              </span>
            </div>

            {/* Personality summary */}
            {personalityChips(selectedMatch).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {personalityChips(selectedMatch).map((chip) => (
                  <span key={chip} className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-blue-100">
                    {chip}
                  </span>
                ))}
              </div>
            )}

            {selectedMatch.moveIn && (
              <p className="text-sm text-blue-200 mb-4">
                📅 Move-in: <span className="text-white font-medium">
                  {new Date(selectedMatch.moveIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </p>
            )}

            {/* Why this score */}
            <h3 className="text-sm font-semibold text-blue-200 uppercase tracking-wide mb-2">
              Why {selectedMatch.score}%?
            </h3>
            <div className="bg-white/5 rounded-lg px-4 py-3 mb-5 space-y-1.5 text-sm">
              {(() => {
                const { positives, warnings } = explainMatch(profile?.preferences, selectedMatch.preferences);
                return (
                  <>
                    {positives.map((p) => (
                      <p key={p} className="text-emerald-300">✔ {p}</p>
                    ))}
                    {warnings.map((w) => (
                      <p key={w} className="text-amber-300">⚠ {w}</p>
                    ))}
                    {positives.length === 0 && warnings.length === 0 && (
                      <p className="text-blue-200">She hasn't answered the lifestyle questions yet.</p>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { openChatWith(selectedMatch); setSelectedMatch(null); }}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> Message
              </button>
              <button
                onClick={() => toggleSaved(selectedMatch.id)}
                className={`p-2.5 rounded-lg border transition ${
                  savedIds.includes(selectedMatch.id)
                    ? 'bg-pink-500/25 border-pink-400/60'
                    : 'border-blue-400/30 hover:border-pink-400/60'
                }`}
              >
                <Heart size={18} className={savedIds.includes(selectedMatch.id) ? 'fill-pink-400 text-pink-400' : 'text-blue-200'} />
              </button>
            </div>

            {/* Reviews */}
            <div className="mt-4 pt-3 border-t border-blue-400/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-200 uppercase tracking-wide">Reviews</h3>
                <button
                  onClick={() => setShowRateForm((s) => !s)}
                  className="text-sm text-blue-300 hover:underline"
                >
                  {matchReviews.some((r) => r.reviewerId === user.uid) ? 'Edit your review' : 'Rate her'}
                </button>
              </div>
              {matchReviews.length > 0 ? (
                <div className="mb-2">
                  <span className="text-amber-300 text-lg">
                    {'★'.repeat(Math.round(matchReviews.reduce((s, r) => s + r.stars, 0) / matchReviews.length))}
                  </span>
                  <span className="text-sm text-blue-200 ml-2">
                    {(matchReviews.reduce((s, r) => s + r.stars, 0) / matchReviews.length).toFixed(1)} · {matchReviews.length} review{matchReviews.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {REVIEW_TAGS.filter((t) => matchReviews.some((r) => r.tags?.includes(t))).map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-full text-xs">
                        ✓ {t} · {matchReviews.filter((r) => r.tags?.includes(t)).length}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-blue-200/70 mb-2">No reviews yet.</p>
              )}

              {showRateForm && (
                <div className="bg-white/5 rounded-lg p-3 mt-2">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setMyStars(n)} title={`${n} star${n > 1 ? 's' : ''}`}>
                        <Star
                          size={22}
                          className={n <= myStars ? 'fill-amber-400 text-amber-400' : 'text-blue-300/50'}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {REVIEW_TAGS.map((t) => {
                      const on = myTags.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => setMyTags(on ? myTags.filter((x) => x !== t) : [...myTags, t])}
                          className={`px-2.5 py-1 rounded-full text-xs border transition ${
                            on ? 'bg-blue-500 border-blue-400 text-white' : 'border-blue-400/40 text-blue-200'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={submitReview}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold"
                  >
                    Save Review
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-400/10">
              <button
                onClick={() => blockAndReport(selectedMatch)}
                className="text-sm text-red-300 hover:text-red-200 flex items-center gap-1"
              >
                <Shield size={14} /> Report & Block
              </button>
              <button onClick={() => setSelectedMatch(null)} className="text-sm text-blue-300 hover:underline">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
