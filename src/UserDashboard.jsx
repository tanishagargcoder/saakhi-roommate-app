import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, CheckCircle, MapPin, Edit, User, Send, Heart, Home, Plus,
  Settings, MessageCircle, Users, LogOut, Trash2, KeyRound, Sparkles, MailWarning, ClipboardList
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
  { key: 'sleep', label: 'Sleep Schedule', options: ['Early Bird', 'Flexible', 'Night Owl'], weight: 40 },
  { key: 'cleanliness', label: 'Cleanliness', options: ['Very Tidy', 'Moderate', 'Relaxed'], weight: 30 },
  { key: 'social', label: 'Social Energy', options: ['Homebody', 'Balanced', 'Social Butterfly'], weight: 30 },
];

const scoreMatch = (mine, theirs) => {
  let score = 0;
  for (const f of PREF_FIELDS) {
    const a = f.options.indexOf(mine?.[f.key]);
    const b = f.options.indexOf(theirs?.[f.key]);
    if (a === -1 || b === -1) continue;
    const dist = Math.abs(a - b);
    score += f.weight * (dist === 0 ? 1 : dist === 1 ? 0.5 : 0);
  }
  return Math.round(score);
};

const hasPrefs = (p) => p && PREF_FIELDS.every((f) => f.options.includes(p.preferences?.[f.key]));
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

const card = 'p-4 rounded-lg bg-slate-800/60 backdrop-blur-sm border border-blue-400/20';
const inputCls = 'w-full px-3 py-2 rounded-lg bg-slate-800 border border-blue-400/30 text-white focus:outline-none focus:border-blue-400';
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
  const [profileForm, setProfileForm] = useState({ name: '', age: '', occupation: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [cityFilter, setCityFilter] = useState('');

  // room listings
  const [listings, setListings] = useState([]);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingForm, setListingForm] = useState(EMPTY_LISTING);

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
    if (missing) { toast.error('Please answer all three questions.'); return; }
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
      'Delete your Sakhi account permanently? Your profile and matches will be removed. This cannot be undone.'
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
  const allCandidates = iHavePrefs
    ? allUsers
        .filter((u) => hasPrefs(u))
        .map((u) => ({ ...u, score: scoreMatch(profile.preferences, u.preferences) }))
        .sort((a, b) => b.score - a.score)
    : [];
  const candidates = cityFilter.trim()
    ? allCandidates.filter((u) => (u.location || '').toLowerCase().includes(cityFilter.trim().toLowerCase()))
    : allCandidates;

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
  const unreadCount = chats.filter(isUnread).length;

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
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Navbar */}
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="fixed top-0 left-0 w-full bg-black/20 backdrop-blur-xl shadow-lg z-20 border-b border-blue-400/20"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <span className="text-2xl font-extrabold text-blue-400 tracking-tight drop-shadow-lg">
                Sakhi
              </span>

              <div className="flex space-x-1 sm:space-x-2">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`relative px-3 py-2 rounded font-semibold flex items-center gap-1.5 text-sm sm:text-base ${
                      activeTab === t.id
                        ? 'bg-blue-400 text-white'
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

                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h2 className="text-xl font-semibold">Your Matches</h2>
                          <input
                            type="text"
                            placeholder="Filter by city…"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-blue-400/30 text-sm text-white focus:outline-none focus:border-blue-400 w-44"
                          />
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
                                : "Sakhi is growing! You'll see compatible roommates here as more women join and set their preferences."}
                            </p>
                          </div>
                        ) : (
                          candidates.map((m) => (
                            <div key={m.id} className={`${card} hover:border-blue-400/40 transition`}>
                              <div className="flex justify-between items-center gap-3 flex-wrap">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                                    {initialOf(m.name)}
                                  </div>
                                  <div>
                                    <h3 className="font-medium">{m.name || 'Sakhi member'}</h3>
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
                              <button
                                onClick={() => openChatWith(m)}
                                className="mt-3 px-4 py-1.5 text-sm rounded-full bg-blue-500 hover:bg-blue-600 transition font-medium flex items-center gap-1.5"
                              >
                                <MessageCircle size={14} /> Message
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="space-y-4">
                        {completeness < 100 && (
                          <div className={card}>
                            <h2 className="text-lg font-semibold mb-2">Complete Your Profile</h2>
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
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
                            {PREF_FIELDS.map((f) => (
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
                  <div className="md:col-span-1 bg-slate-900/70 p-4 rounded-lg max-h-[530px] overflow-y-auto">
                    {chats.length === 0 ? (
                      <div className="text-center py-10 text-blue-200 text-sm">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
                        No conversations yet.<br />Message a match to start chatting!
                      </div>
                    ) : (
                      chats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => openChat(chat.id)}
                          className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 transition ${
                            selectedChatId === chat.id ? 'bg-blue-700/40' : 'hover:bg-slate-700/30'
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

                  <div className="md:col-span-2 bg-slate-900/70 p-4 rounded-lg flex flex-col h-[500px]">
                    {selectedChatId ? (
                      <>
                        <div className="flex items-center mb-3 pb-3 border-b border-blue-400/20">
                          <User className="w-6 h-6 mr-2 text-blue-200" />
                          <span className="font-semibold">
                            {otherNameOf(chats.find((c) => c.id === selectedChatId) || {})}
                          </span>
                        </div>
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
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-l-lg bg-slate-800 text-white focus:outline-none"
                            placeholder="Type your message…"
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
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
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
                                    : 'bg-slate-800/60 border-blue-400/20 hover:border-blue-400/50'
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
                    </div>

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
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold flex items-center gap-2"
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
    </div>
  );
};

export default UserDashboard;
