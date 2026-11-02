import React, { useState, useEffect } from 'react';
import {
  Layers,
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  ShieldCheck,
  MapPin,
  Briefcase,
  Image as ImageIcon,
  Send,
  Plus,
  ThumbsUp,
  Award,
} from 'lucide-react';
import { FeedPost, User } from '../types';

interface KarmyogiFeedViewProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onSelectWorkerById: (workerId: string) => void;
  onBookWorkerById: (workerId: string) => void;
}

export const KarmyogiFeedView: React.FC<KarmyogiFeedViewProps> = ({
  currentUser,
  onOpenLogin,
  onSelectWorkerById,
  onBookWorkerById,
}) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCaption, setNewCaption] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newTags, setNewTags] = useState('Craftsmanship, Handcrafted');
  const [isPosting, setIsPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || 'guest' }),
      });
      const data = await res.json();
      if (res.ok && data.post) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      } else if (res.ok && data.likes !== undefined) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes: data.likes, likedBy: data.likedBy || p.likedBy } : p
          )
        );
      }
    } catch {
      // Graceful fallback
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !currentUser) {
      if (!currentUser) onOpenLogin();
      return;
    }

    try {
      const res = await fetch(`/api/feed/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: currentUser.id,
          userName: currentUser.name,
          userPic: currentUser.profilePic,
          text: text,
          comment: text,
        }),
      });
      const data = await res.json();
      if (res.ok && data.post) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      } else if (res.ok && data.comment) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, data.comment] } : p
          )
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch {
      // Graceful fallback
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (!newCaption.trim()) return;

    setIsPosting(true);
    try {
      const img =
        newImage ||
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80';
      const res = await fetch('/api/feed/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: currentUser.id,
          title: newCaption,
          content: newCaption,
          caption: newCaption,
          photos: [img],
          imageUrl: img,
          tags: newTags.split(',').map((t) => t.trim()),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewCaption('');
        setNewImage('');
        fetchFeed();
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Feed Title & Creation Box */}
      <div className="rounded-3xl bg-white border border-[#E5E1D8] p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#EBF2EA] text-[#5C6E58] border border-[#D2E0D0]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-[#2D2926]">
              Karmyogi Professional Showcase Feed
            </h2>
            <p className="text-xs text-[#8C867E]">
              LinkedIn for Bharat's skilled trade masters: carpenters, electricians, teachers & masons.
            </p>
          </div>
        </div>

        {/* Share your latest work form */}
        <form onSubmit={handleCreatePost} className="space-y-3 pt-2">
          <div className="flex items-start gap-3">
            <img
              src={
                currentUser?.profilePic ||
                'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'
              }
              alt="User"
              className="w-10 h-10 rounded-xl object-cover border border-[#E5E1D8] shrink-0"
            />
            <div className="flex-1 space-y-2">
              <textarea
                rows={2}
                placeholder={
                  currentUser?.role === 'worker'
                    ? `Share a newly completed ${currentUser.occupation} project, technique, or client accomplishment...`
                    : 'Share a home improvement update or recommend a verified worker...'
                }
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] text-xs text-[#2D2926] placeholder-[#8C867E] focus:border-[#8B5E3C]"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="Image URL (e.g. Unsplash or project photo link)..."
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#F9F7F2] border border-[#E5E1D8] text-xs text-[#2D2926] placeholder-[#8C867E] focus:border-[#8B5E3C]"
                />
                <button
                  type="submit"
                  disabled={isPosting || !newCaption.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isPosting ? 'Posting...' : 'Share Work'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Feed Posts Stream */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-3xl bg-white border border-[#E5E1D8] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl bg-white border border-[#E5E1D8] overflow-hidden shadow-sm"
            >
              {/* Post Author Card */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E5E1D8] bg-[#FDFCF9]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={post.workerPic}
                      alt={post.workerName}
                      className="w-11 h-11 rounded-xl object-cover border border-[#E5E1D8]"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-[#5C6E58] text-white p-0.5 rounded-full ring-2 ring-white">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3
                        onClick={() => onSelectWorkerById(post.workerId)}
                        className="text-xs sm:text-sm font-bold text-[#2D2926] hover:text-[#8B5E3C] cursor-pointer transition-colors"
                      >
                        {post.workerName}
                      </h3>
                      <span className="text-[10px] text-[#5C6E58] font-bold bg-[#EBF2EA] px-1.5 py-0.2 rounded border border-[#D2E0D0]">
                        Verified
                      </span>
                    </div>

                    <p className="text-[11px] text-[#8B5E3C] font-semibold">
                      {post.workerOccupation} • {post.workerCity}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onBookWorkerById(post.workerId)}
                  className="px-3 py-1.5 rounded-xl bg-[#EBF2EA] hover:bg-[#5C6E58] text-[#5C6E58] hover:text-white text-xs font-bold transition-all border border-[#D2E0D0] cursor-pointer flex items-center gap-1"
                >
                  <Briefcase className="w-3 h-3" />
                  <span>Hire</span>
                </button>
              </div>

              {/* Caption */}
              <div className="p-4 sm:p-5 pb-3">
                <p className="text-xs sm:text-sm text-[#2D2926] leading-relaxed">{post.caption}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {post.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] text-[#8B5E3C] font-semibold hover:underline cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* High-res Image */}
              {post.imageUrl && (
                <div className="w-full max-h-[420px] overflow-hidden bg-[#F1EDE4]">
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Likes & Comments Counters */}
              <div className="px-5 py-2.5 flex items-center justify-between text-xs text-[#8C867E] border-b border-[#E5E1D8]">
                <div className="flex items-center gap-1 text-[#8B5E3C] font-bold">
                  <ThumbsUp className="w-3.5 h-3.5 fill-[#8B5E3C]" />
                  <span>{post.likesCount} appreciations</span>
                </div>
                <span>{post.comments?.length || 0} comments</span>
              </div>

              {/* Action Bar: Applaud, Comment, Share */}
              <div className="px-4 py-2 flex items-center justify-between gap-1 text-xs text-[#423E3B] border-b border-[#E5E1D8]">
                <button
                  type="button"
                  onClick={() => handleLike(post.id)}
                  className="flex-1 py-2 rounded-xl hover:bg-[#F1EDE4] hover:text-[#2D2926] transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                >
                  <ThumbsUp className="w-4 h-4 text-[#8B5E3C]" />
                  <span>Applaud Work</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectWorkerById(post.workerId)}
                  className="flex-1 py-2 rounded-xl hover:bg-[#F1EDE4] hover:text-[#2D2926] transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                >
                  <Award className="w-4 h-4 text-[#5C6E58]" />
                  <span>View Portfolio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText?.(window.location.href);
                    alert('Post link copied to clipboard!');
                  }}
                  className="flex-1 py-2 rounded-xl hover:bg-[#F1EDE4] hover:text-[#2D2926] transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                >
                  <Share2 className="w-4 h-4 text-[#8C867E]" />
                  <span>Share</span>
                </button>
              </div>

              {/* Comments stream & Add Comment Input */}
              <div className="p-4 bg-[#FDFCF9] space-y-3">
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-2">
                    {post.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2.5 text-xs text-[#423E3B]">
                        <img
                          src={c.userPic}
                          alt={c.userName}
                          className="w-6 h-6 rounded-lg object-cover mt-0.5"
                        />
                        <div className="flex-1 bg-[#F9F7F2] p-2.5 rounded-xl border border-[#E5E1D8]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#2D2926]">{c.userName}</span>
                            <span className="text-[10px] text-[#8C867E]">
                              {new Date(c.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[#423E3B] mt-0.5">{c.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment or congratulate the artisan..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E5E1D8] text-xs text-[#2D2926] placeholder-[#8C867E] focus:border-[#8B5E3C]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(post.id)}
                    className="p-2 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white transition-colors cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
