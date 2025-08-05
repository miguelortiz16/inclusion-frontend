"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Search, Share2, BookOpen, ChevronDown, ChevronUp, ThumbsUp, Accessibility, Heart, Shield } from "lucide-react"
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
      <div className="min-h-screen pb-10"
           style={{
             background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #dcfce7 100%)',
             position: 'relative',
             overflow: 'hidden'
           }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20"
               style={{ 
                 background: 'radial-gradient(circle, #65cc8a, transparent)',
                 animation: 'float 6s ease-in-out infinite'
               }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full opacity-15"
               style={{ 
                 background: 'radial-gradient(circle, #4ade80, transparent)',
                 animation: 'float 8s ease-in-out infinite reverse'
               }}></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full opacity-10"
               style={{ 
                 background: 'radial-gradient(circle, #65cc8a, transparent)',
                 animation: 'float 7s ease-in-out infinite'
               }}></div>
        </div>
        
        {/* Top search bar */}
        <div className="py-4 px-4 shadow-sm sticky top-0 z-10"
             style={{
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
               backdropFilter: 'blur(20px)',
               borderBottom: '1px solid rgba(101, 204, 138, 0.2)'
             }}>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#65cc8a' }} />
              <Input
                placeholder={t('community.inicio.searchPlaceholder')}
                className="pl-12 pr-4 py-2.5 rounded-lg text-base transition-all"
                style={{
                  border: '1px solid rgba(101, 204, 138, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)'
                }}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Tabs defaultValue="feed">
              <TabsList className="p-1 rounded-lg shadow-sm"
                       style={{
                         background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                         backdropFilter: 'blur(20px)',
                         border: '1px solid rgba(101, 204, 138, 0.2)'
                       }}>
                <TabsTrigger value="feed" className="rounded-md transition-all"
                             style={{
                               background: 'transparent',
                               color: '#000000'
                             }}>
                  {t('community.feed')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            {/* Left column - User profile */}
            <div className="w-full">
              <div className="rounded-xl overflow-hidden sticky top-24"
                   style={{
                     background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                     backdropFilter: 'blur(20px)',
                     border: '1px solid rgba(101, 204, 138, 0.2)',
                     boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
                   }}>
                <div className="p-5 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-2xl font-medium mb-4 shadow-sm"
                       style={{
                         background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                         boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
                       }}>
                    {profile.name ? getInitials(profile.name) : 'M'}
                  </div>
                  <h2 className="text-lg font-semibold text-center mb-3" style={{ color: '#000000' }}>{profile.name || 'Nombre del profesor'}</h2>
                  <div className="w-full">
                    <div className="text-sm font-medium text-center mb-2" style={{ color: '#65cc8a' }}>Materias:</div>
                    {profile.subjects && profile.subjects.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {profile.subjects.map((subj, idx) => (
                          <span key={idx} className="rounded-lg px-2.5 py-1 text-xs font-medium"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                                  color: '#65cc8a',
                                  border: '1px solid rgba(101, 204, 138, 0.3)'
                                }}>{subj}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-center" style={{ color: '#000000' }}>Sin materias registradas</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle column - Posts */}
            <div className="w-full max-w-2xl">
              {/* Nueva publicación */}
              <div className="mb-6 rounded-xl shadow-sm p-5"
                   style={{
                     background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                     backdropFilter: 'blur(20px)',
                     border: '1px solid rgba(101, 204, 138, 0.2)',
                     boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
                   }}>
                <div className="flex-1 relative">
                  <Input
                    placeholder={t('community.post.placeholder')}
                    className="pl-4 pr-10 py-2.5 rounded-lg transition-all"
                    style={{
                      border: '1px solid rgba(101, 204, 138, 0.3)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)'
                    }}
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                    style={{ color: '#65cc8a' }}
                    onClick={handleNewPost}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 5L21 12L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center mb-4 px-2">
                <span className="font-medium" style={{ color: '#000000' }}>{t('community.post.forYou')}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Posts dinámicos */}
              <div className="space-y-5">
                {loading ? (
                  <div className="flex items-center justify-center min-h-[200px] rounded-xl shadow-sm"
                       style={{
                         background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                         backdropFilter: 'blur(20px)',
                         border: '1px solid rgba(101, 204, 138, 0.2)',
                         boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
                       }}>
                    <div className="text-center py-8" style={{ color: '#000000' }}>Cargando publicaciones...</div>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[200px] rounded-xl shadow-sm"
                       style={{
                         background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                         backdropFilter: 'blur(20px)',
                         border: '1px solid rgba(101, 204, 138, 0.2)',
                         boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
                       }}>
                    <div className="text-center py-8" style={{ color: '#000000' }}>No hay publicaciones.</div>
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
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
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
    <div className="rounded-xl p-5 mb-4 transition-all hover:shadow-md"
         style={{
           background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
           backdropFilter: 'blur(20px)',
           border: '1px solid rgba(101, 204, 138, 0.2)',
           boxShadow: '0 16px 32px rgba(101, 204, 138, 0.1)'
         }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-base font-bold text-white shadow-sm"
             style={{
               background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
               boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
             }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium leading-tight" style={{ color: '#000000' }}>{displayName}</div>
          <div className="text-xs leading-tight" style={{ color: '#000000' }}>{fecha}</div>
        </div>
        <button className="transition-colors" style={{ color: '#65cc8a' }}>
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      {/* Content */}
      <div className="mb-4 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: '#000000' }}>{post.content}</div>
      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 pb-2 text-sm"
           style={{ borderTop: '1px solid rgba(101, 204, 138, 0.2)' }}>
        <button
          className="flex items-center gap-1.5 font-medium transition-all"
          style={{ color: hasLiked ? '#65cc8a' : '#000000' }}
          onClick={handleLike}
        >
          <svg className="w-5 h-5" fill={hasLiked ? '#65cc8a' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 21h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-5.31l.95-4.57.03-.32a1 1 0 0 0-.99-1.11h-2.28a1 1 0 0 0-.99.79l-1.38 6.59A1 1 0 0 0 8 13h8" />
          </svg>
          Me gusta
          <span className="ml-1 font-medium">{post.likes?.length || 0}</span>
        </button>
        <div className="flex items-center gap-1.5" style={{ color: '#000000' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-medium">{post.comments?.length || 0}</span>
        </div>
      </div>
      {/* Input comentario */}
      <div className="flex items-center gap-2 sm:gap-3 mt-4 relative">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0"
             style={{
               background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
               boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
             }}>
          M
        </div>
        <input
          ref={inputRef}
          className="flex-1 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-all"
          style={{
            border: '1px solid rgba(101, 204, 138, 0.3)',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
          placeholder="Escribe un comentario..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          ref={emojiBtnRef}
          className="text-lg sm:text-xl px-1.5 sm:px-2 transition-colors flex-shrink-0"
          style={{ color: '#65cc8a' }}
          type="button"
          onClick={() => setShowEmojis(v => !v)}
          tabIndex={-1}
        >
          😊
        </button>
        {showEmojis && (
          <div ref={emojiPanelRef} className="absolute bottom-12 right-0 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 z-10"
               style={{
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 244, 0.95))',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(101, 204, 138, 0.2)',
                 boxShadow: '0 20px 40px rgba(101, 204, 138, 0.2)'
               }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                className="text-xl sm:text-2xl rounded-lg transition-colors"
                style={{
                  background: 'transparent',
                  color: '#000000'
                }}
                type="button"
                onClick={() => insertEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <button
          className="text-white rounded-lg p-2 sm:p-2.5 transition-all disabled:opacity-50 shadow-sm flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
            boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
          }}
          onClick={handleComment}
          disabled={sending}
        >
          <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
      {/* Comentarios */}
      <div className="mt-4 space-y-3 rounded-lg p-4"
           style={{
             background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))'
           }}>
        {post.comments?.map((c: Comment, idx) => (
          <div key={idx} className="flex items-start gap-3 rounded-lg shadow-sm p-4"
               style={{
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(101, 204, 138, 0.2)',
                 boxShadow: '0 8px 16px rgba(101, 204, 138, 0.1)'
               }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm"
                 style={{
                   background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                   boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                 }}>
              {getInitials(c.userName)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm" style={{ color: '#000000' }}>{c.userName}</span>
                <span className="text-xs" style={{ color: '#000000' }}>Hace 1 h</span>
              </div>
              <div className="text-[15px] leading-snug break-words" style={{ color: '#000000' }}>{c.content}</div>
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