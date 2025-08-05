"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Search, Share2, BookOpen, ChevronDown, ChevronUp, ThumbsUp } from "lucide-react"
import { Layout } from "@/components/layout"
import { useLanguage } from "../contexts/LanguageContext"

// Tipos para posts y comentarios
interface Comment {
  content: string;
  userName: string;
}
interface Post {
  id: string;
  content: string;
  comments: Comment[];
  likes: string[];
  userId: string;
  userName?: string;
  createdAt: string;
}

const EMOJIS = ["😀", "😂", "😍", "👍", "🎉", "😢", "😎", "🙏", "👏", "🔥"];

export default function Comunidad() {
  const { t, language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState<string>("")
  const [profile, setProfile] = useState<{ name: string; subjects: string[] }>({ name: '', subjects: [] })

  useEffect(() => {
    fetch("https://planbackend.us-east-1.elasticbeanstalk.com/api/posts")
      .then(res => res.json())
      .then((data: Post[]) => {
        setPosts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Obtener perfil del usuario
  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('email') : '';
    if (email) {
      fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/registration/get-teacher?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then((data: { name: string; subjects: string[] }) => {
          setProfile(data)
        })
        .catch(() => setProfile({ name: '', subjects: [] }))
    }
  }, [])

  const handleNewPost = async () => {
    if (!newPost.trim()) return;
    const email = typeof window !== 'undefined' ? localStorage.getItem('email') : '';
    const res = await fetch("https://planbackend.us-east-1.elasticbeanstalk.com/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost, userId: "Profe Invitado", email })
    });
    const post: Post = await res.json();
    setPosts([...posts, post]);
    setNewPost("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Mostrar los posts del más reciente al más viejo
  const filteredPosts = posts
    .filter(post => post.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice() // copia para no mutar el original
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // ordenar por createdAt descendente

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/50 pb-10">
        {/* Top search bar */}
        <div className="border-b border-blue-100 bg-white py-4 px-4 shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
              <Input
                placeholder={t('community.inicio.searchPlaceholder')}
                className="pl-12 pr-4 py-2.5 border border-blue-100 rounded-lg bg-white shadow-sm focus:ring-1 focus:ring-blue-200 text-base transition-all"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Tabs defaultValue="feed">
              <TabsList className="bg-white p-1 rounded-lg shadow-sm border border-blue-100">
                <TabsTrigger value="feed" className="rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
                  {t('community.feed')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            {/* Left column - User profile */}
            <div className="w-full">
              <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden sticky top-24">
                <div className="p-5 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-2xl font-medium mb-4 shadow-sm">
                    {profile.name ? getInitials(profile.name) : 'M'}
                  </div>
                  <h2 className="text-lg font-semibold text-center mb-3 text-slate-800">{profile.name || 'Nombre del profesor'}</h2>
                  <div className="w-full">
                    <div className="text-sm font-medium text-blue-600 text-center mb-2">Materias:</div>
                    {profile.subjects && profile.subjects.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {profile.subjects.map((subj, idx) => (
                          <span key={idx} className="bg-blue-50 text-blue-600 rounded-lg px-2.5 py-1 text-xs font-medium">{subj}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 text-center">Sin materias registradas</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle column - Posts */}
            <div className="w-full max-w-2xl">
              {/* Nueva publicación */}
              <div className="mb-6 bg-white rounded-xl shadow-sm p-5 border border-blue-100">
                <div className="flex-1 relative">
                  <Input
                    placeholder={t('community.post.placeholder')}
                    className="pl-4 pr-10 py-2.5 border border-blue-100 rounded-lg bg-white shadow-sm focus:ring-1 focus:ring-blue-200 transition-all"
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNewPost();
                      }
                    }}
                  />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-colors"
                    onClick={handleNewPost}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 5L21 12L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center mb-4 px-2">
                <span className="text-slate-700 font-medium">{t('community.post.forYou')}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Posts dinámicos */}
              <div className="space-y-5">
                {loading ? (
                  <div className="flex items-center justify-center min-h-[200px] bg-white rounded-xl border border-blue-100 shadow-sm">
                    <div className="text-center text-slate-400 py-8">Cargando publicaciones...</div>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[200px] bg-white rounded-xl border border-blue-100 shadow-sm">
                    <div className="text-center text-slate-400 py-8">No hay publicaciones.</div>
                  </div>
                ) : (
                  filteredPosts.map(post => (
                    <ElegantPostCard
                      key={post.id}
                      post={post}
                      t={t}
                      setPosts={setPosts}
                      posts={posts}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// ElegantPostCard: tarjeta con panel de comentarios colapsable y badges
interface ElegantPostCardProps {
  post: Post;
  t: any;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  posts: Post[];
}

// Utilidad para iniciales
function getInitials(name: string) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
}

function ElegantPostCard({ post, t, setPosts, posts }: ElegantPostCardProps) {
  const [comment, setComment] = useState<string>("")
  const [sending, setSending] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const emojiPanelRef = useRef<HTMLDivElement>(null)
  const userId = "123" // Simulación de usuario autenticado

  useEffect(() => {
    if (!showEmojis) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(event.target as Node) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(event.target as Node)
      ) {
        setShowEmojis(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojis]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    const email = typeof window !== 'undefined' ? localStorage.getItem('email') : '';
    const res = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/posts/${post.id}/comment?userEmail=${encodeURIComponent(email || '')}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comment)
    });
    const updatedPost: Post = await res.json();
    setPosts(posts.map((p: Post) => p.id === post.id ? updatedPost : p));
    setComment("");
    setSending(false);
    setShowEmojis(false);
  };

  // Like
  const handleLike = async () => {
    const res = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/posts/${post.id}/like`, {
      method: "POST"
    })
    const updatedPost: Post = await res.json()
    setPosts(posts.map((p: Post) => p.id === post.id ? updatedPost : p))
  }

  const hasLiked = post.likes?.includes(userId)
  const displayName = post.userName || post.userId || 'Usuario';
  const initials = getInitials(displayName);
  const fecha = '' // Simulación, reemplaza por la fecha real si la tienes

  // Manejar Enter para enviar comentario
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !sending) {
      e.preventDefault();
      handleComment();
    }
  }

  // Insertar emoji en el input
  const insertEmoji = (emoji: string) => {
    setComment(comment + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  }

  return (
    <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 mb-4 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-base font-bold text-white shadow-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-800 leading-tight">{displayName}</div>
          <div className="text-xs text-slate-400 leading-tight">{fecha}</div>
        </div>
        <button className="text-slate-400 hover:text-blue-500 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      {/* Content */}
      <div className="text-slate-700 mb-4 whitespace-pre-line text-[15px] leading-relaxed">{post.content}</div>
      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-blue-100 pt-4 pb-2 text-sm">
        <button
          className={`flex items-center gap-1.5 font-medium transition-all ${hasLiked ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
          onClick={handleLike}
        >
          <svg className="w-5 h-5" fill={hasLiked ? '#3b82f6' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 21h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-5.31l.95-4.57.03-.32a1 1 0 0 0-.99-1.11h-2.28a1 1 0 0 0-.99.79l-1.38 6.59A1 1 0 0 0 8 13h8" />
          </svg>
          Me gusta
          <span className="ml-1 font-medium">{post.likes?.length || 0}</span>
        </button>
        <div className="flex items-center gap-1.5 text-slate-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-medium">{post.comments?.length || 0}</span>
        </div>
      </div>
      {/* Input comentario */}
      <div className="flex items-center gap-2 sm:gap-3 mt-4 relative">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
          M
        </div>
        <input
          ref={inputRef}
          className="flex-1 border border-blue-100 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-200 transition-all"
          placeholder="Escribe un comentario..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          ref={emojiBtnRef}
          className="text-lg sm:text-xl px-1.5 sm:px-2 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0"
          type="button"
          onClick={() => setShowEmojis(v => !v)}
          tabIndex={-1}
        >
          😊
        </button>
        {showEmojis && (
          <div ref={emojiPanelRef} className="absolute bottom-12 right-0 bg-white border border-blue-100 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 z-10">
            {EMOJIS.map(e => (
              <button
                key={e}
                className="text-xl sm:text-2xl hover:bg-blue-50 rounded-lg transition-colors"
                type="button"
                onClick={() => insertEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2 sm:p-2.5 transition-all disabled:opacity-50 shadow-sm flex-shrink-0"
          onClick={handleComment}
          disabled={sending}
        >
          <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
      {/* Comentarios */}
      <div className="mt-4 space-y-3 bg-blue-50/30 rounded-lg p-4">
        {post.comments?.map((c: Comment, idx) => (
          <div key={idx} className="flex items-start gap-3 bg-white rounded-lg shadow-sm border border-blue-100 p-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {getInitials(c.userName)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-slate-800">{c.userName}</span>
                <span className="text-xs text-slate-400">Hace 1 h</span>
              </div>
              <div className="text-slate-700 text-[15px] leading-snug break-words">{c.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CollaboratorItem({
  name,
  image,
  imageColor,
  badge,
  points,
  t
}: {
  name: string
  image: string
  imageColor: string
  badge?: string
  points: number
  t: any
}) {
  return (
    <div className="flex items-center gap-3 bg-white/60 rounded-xl px-3 py-2 shadow border border-blue-100">
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${imageColor} flex items-center justify-center text-white font-bold text-lg shadow`}
      >
        {image}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-base font-bold truncate text-blue-900">{name}</p>
          {badge && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold ml-1">{badge}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 text-blue-700 font-bold">
        <BookOpen className="w-4 h-4" />
        <span className="text-sm">{points} {t('community.points')}</span>
      </div>
    </div>
  )
} 