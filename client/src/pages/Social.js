import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../utils/fileUrl';
import { 
  FaThumbsUp, FaComment, FaShare, FaImage, FaPaperPlane, 
  FaEllipsisH, FaUserCircle, FaClock 
} from 'react-icons/fa';

const Social = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get('/api/posts');
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      toast.error('خطأ في تحميل المنشورات');
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !image) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost);
      if (image) formData.append('image', image);

      const res = await axios.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setPosts([res.data.data, ...posts]);
        setNewPost('');
        setImage(null);
        toast.success('تم النشر بنجاح');
      }
    } catch (err) {
      toast.error('خطأ في النشر');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.put(`/api/posts/${postId}/like`);
      if (res.data.success) {
        setPosts(posts.map(p => p._id === postId ? { ...p, likes: res.data.data } : p));
      }
    } catch (err) {
      toast.error('خطأ في التفاعل');
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim()) return;
    try {
      const res = await axios.post(`/api/posts/${postId}/comment`, { text: commentText });
      if (res.data.success) {
        setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data.data } : p));
        setCommentText('');
        setCommentingOn(null);
        toast.success('تم إضافة التعليق');
      }
    } catch (err) {
      toast.error('خطأ في التعليق');
    }
  };

  return (
    <div className="bg-themed-bg min-h-screen pb-10 sm:pb-20 pt-6 sm:pt-10">
      <div className="formal-container max-w-4xl">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-themed-text mb-3 sm:mb-4 tracking-tight">
            المركز <span className="text-primary-600">الاجتماعي المهني</span>
          </h1>
          <p className="text-themed-text-sec font-medium text-sm sm:text-lg tracking-wide">تواصل مع الخبراء، شارك المعرفة، وابنِ شبكتك المهنية</p>
        </div>

        {/* Create Post */}
        <div className="formal-card p-4 sm:p-8 mb-6 sm:mb-10 border-none shadow-premium-lg hover:translate-y-0 mx-2 sm:mx-0">
          <div className="flex gap-4 sm:gap-6">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-accent flex-shrink-0 flex items-center justify-center text-themed-on-primary font-black text-lg sm:text-xl shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <form onSubmit={handlePostSubmit} className="flex-1 min-w-0">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`بماذا تفكر يا ${user?.name?.split(' ')[0]}؟`}
                className="w-full border-none focus:ring-0 text-lg sm:text-xl font-medium resize-none placeholder-themed-text-ter bg-transparent text-themed-text p-0"
                rows="2"
              ></textarea>
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-primary-100/50 gap-4">
                <div className="flex gap-2 w-full sm:w-auto">
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-themed-bg-sec text-themed-text-sec rounded-xl cursor-pointer hover:bg-primary-50 hover:shadow-md hover:text-primary-600 transition-all border border-transparent hover:border-primary-100 flex-1 sm:flex-none">
                    <FaImage className="text-lg sm:text-xl" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">صورة</span>
                    <input type="file" className="hidden" onChange={(e) => setImage(e.target.files[0])} accept="image/*" />
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || (!newPost.trim() && !image)}
                  className="btn-formal-primary w-full sm:w-auto px-8 sm:px-10 py-2.5 sm:py-3 text-[10px] sm:text-sm shadow-glow flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner w-3 h-3 sm:w-4 sm:h-4 border-2 border-themed-on-primary"></div>
                      <span>جاري...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="rotate-180" />
                      <span>نشر الآن</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6 sm:space-y-10 px-2 sm:px-0">
          {posts.map((post) => (
            <div key={post._id} className="formal-card border-none shadow-premium overflow-hidden hover:translate-y-[-4px]">
              {/* Post Header */}
              <div className="p-4 sm:p-6 flex justify-between items-center bg-themed-bg-sec/50">
                <div className="flex gap-3 sm:gap-4">
                  {post.user ? (
                    <>
                      <Link to={`/profile/${post.user._id}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary-100/50 flex items-center justify-center text-primary-600 font-black text-base sm:text-lg border border-primary-100 shadow-inner overflow-hidden shrink-0 hover:border-primary-400 transition-all">
                        {post.user.profile?.avatar ? (
                          <img src={getFileUrl(post.user.profile.avatar)} alt={post.user.name} className="w-full h-full object-cover" />
                        ) : (
                          post.user.name?.charAt(0)
                        )}
                      </Link>
                      <div className="min-w-0">
                        <Link to={`/profile/${post.user._id}`} className="hover:text-primary-600 transition-colors">
                          <h4 className="font-black text-themed-text tracking-tight text-sm sm:text-base truncate">{post.user.name}</h4>
                        </Link>
                        <p className="text-[8px] sm:text-[10px] text-themed-text-ter font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                          <FaClock className="text-primary-500" /> {new Date(post.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        ?
                      </div>
                      <h4 className="font-black text-slate-400 text-sm sm:text-base">مستخدم غير معروف</h4>
                    </div>
                  )}
                </div>
                <button className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-themed-text-ter hover:text-primary-600 transition-colors">
                  <FaEllipsisH />
                </button>
              </div>

              {/* Post Content */}
              <div className="px-5 sm:px-8 pb-4 sm:pb-6 pt-3 sm:pt-4">
                <p className="text-themed-text-sec text-base sm:text-lg leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.image && (
                <div className="px-3 sm:px-4 pb-4 sm:pb-6">
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-primary-100 shadow-lg">
                    <img src={getFileUrl(post.image)} alt="Post content" className="w-full h-auto max-h-[400px] sm:max-h-[600px] object-cover" />
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="px-5 sm:px-8 py-2 sm:py-3 flex justify-between border-y border-primary-100/30 bg-themed-bg-sec/30">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-[8px] sm:text-[10px] font-black text-primary-600 uppercase tracking-widest">{post.likes?.length || 0} تفاعل</span>
                  <span className="w-1 h-1 rounded-full bg-primary-200"></span>
                  <span className="text-[8px] sm:text-[10px] font-black text-themed-text-ter uppercase tracking-widest">{post.comments?.length || 0} تعليق</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex p-1 sm:p-2 bg-themed-bg-sec/50 backdrop-blur-md">
                <button 
                  onClick={() => handleLike(post._id)}
                  className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all font-black text-[10px] sm:text-xs uppercase tracking-widest ${
                    post.likes?.includes(user?.id) ? 'text-primary-600 bg-primary-500/10' : 'text-themed-text-ter hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  <FaThumbsUp className={post.likes?.includes(user?.id) ? 'animate-bounce' : ''} /> 
                  <span>تفاعل</span>
                </button>
                <button 
                  onClick={() => setCommentingOn(commentingOn === post._id ? null : post._id)}
                  className="flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 text-themed-text-ter hover:bg-primary-50 hover:text-primary-600 rounded-lg sm:rounded-xl transition-all font-black text-[10px] sm:text-xs uppercase tracking-widest"
                >
                  <FaComment /> 
                  <span>تعليق</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 text-themed-text-ter hover:bg-primary-50 hover:text-primary-600 rounded-lg sm:rounded-xl transition-all font-black text-[10px] sm:text-xs uppercase tracking-widest">
                  <FaShare /> 
                  <span>مشاركة</span>
                </button>
              </div>

              {/* Comments Section */}
              {commentingOn === post._id && (
                <div className="p-4 sm:p-8 bg-themed-bg-sec/50 border-t border-primary-100 animate-slide-up">
                  <div className="space-y-4 sm:space-y-6 max-h-60 sm:max-h-80 overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
                    {post.comments?.map((comment, idx) => (
                      <div key={idx} className="flex gap-3 sm:gap-4 group">
                        <Link to={`/profile/${comment.user?._id}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-themed-bg border border-primary-100 overflow-hidden shrink-0 shadow-sm flex items-center justify-center font-black text-primary-600 text-xs sm:text-sm hover:border-primary-400 transition-all">
                          {comment.user?.profile?.avatar ? (
                            <img src={getFileUrl(comment.user.profile.avatar)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            comment.user?.name?.charAt(0)
                          )}
                        </Link>
                        <div className="bg-themed-bg p-3 sm:p-5 rounded-xl sm:rounded-2xl rounded-tr-none shadow-sm flex-1 border border-primary-100/50 group-hover:border-primary-300 transition-all">
                          <Link to={`/profile/${comment.user?._id}`} className="hover:text-primary-600 transition-colors">
                            <h5 className="font-black text-themed-text text-xs sm:text-sm mb-1">{comment.user?.name}</h5>
                          </Link>
                          <p className="text-themed-text-sec text-[11px] sm:text-sm leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-8">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="اكتب تعليقاً..."
                      className="flex-1 formal-input py-2 sm:py-3 text-xs sm:text-sm shadow-inner"
                    />
                    <button 
                      onClick={() => handleCommentSubmit(post._id)}
                      className="btn-formal-primary w-10 h-10 sm:w-12 sm:h-12 p-0 flex items-center justify-center shrink-0"
                    >
                      <FaPaperPlane className="rotate-180 text-xs sm:text-sm" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Social;
