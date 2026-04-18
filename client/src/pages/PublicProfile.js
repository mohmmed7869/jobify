import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FaUser, FaMapMarkerAlt, FaBriefcase, FaEnvelope, 
  FaPhone, FaLink, FaCalendarAlt, FaClock, FaThumbsUp, 
  FaComment, FaShare, FaPaperPlane, FaMessageSquare 
} from 'react-icons/fa';
import { getFileUrl } from '../utils/fileUrl';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PublicProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && userId !== 'undefined') {
      setLoading(true);
      fetchUserData();
      fetchUserPosts();
    } else {
      setLoading(false);
      setUser(null);
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const res = await axios.get(`/api/users/${userId}`);
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        toast.error('المستخدم غير موجود');
      }
    } catch (err) {
      console.error('Error fetching public profile:', err);
      const message = err.response?.data?.message || 'خطأ في تحميل بيانات المستخدم';
      toast.error(message);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`/api/posts/user/${userId}`);
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
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

  if (loading) return <LoadingSpinner />;
  if (!user) return <div className="text-center py-20">المستخدم غير موجود</div>;

  return (
    <div className="bg-themed-bg min-h-screen pb-20 pt-10" dir="rtl">
      <div className="premium-container max-w-4xl">
        {/* Profile Header */}
        <div className="glass-card overflow-hidden border-none shadow-premium-lg mb-10">
          <div className="h-32 sm:h-48 bg-gradient-to-br from-primary-600 to-accent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          </div>
          
          <div className="px-6 sm:px-10 pb-8">
            <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 sm:-mt-20 mb-8 gap-6">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] border-8 border-white bg-white shadow-premium overflow-hidden">
                {user.profile?.avatar ? (
                  <img src={getFileUrl(user.profile.avatar)} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><FaUser size={48} /></div>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-right">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">{user.name}</h1>
                <p className="text-primary-600 font-bold text-sm sm:text-base uppercase tracking-widest mb-4">{user.role}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 text-sm font-bold">
                  {user.profile?.location?.city && (
                    <span className="flex items-center gap-2"><FaMapMarkerAlt /> {user.profile.location.city}</span>
                  )}
                  <span className="flex items-center gap-2"><FaCalendarAlt /> انضم في {new Date(user.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              {currentUser?._id !== user?._id && (
                <Link 
                  to={`/chat?userId=${user._id}&userName=${user.name}`}
                  className="btn-premium-primary flex items-center gap-2"
                >
                  <FaPaperPlane /> مراسلة
                </Link>
              )}
            </div>

            {user.profile?.bio && (
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <p className="text-slate-600 font-medium leading-relaxed">{user.profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* User Posts Feed */}
        <h3 className="text-xl font-black text-themed-text mb-6 flex items-center gap-3">
          <span className="w-2 h-8 bg-primary-600 rounded-full"></span>
          منشورات {user.name}
        </h3>

        <div className="space-y-8">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post._id} className="formal-card border-none shadow-premium overflow-hidden">
                {/* Post Header */}
                <div className="p-4 sm:p-6 flex justify-between items-center bg-themed-bg-sec/50">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 overflow-hidden shrink-0">
                      {user.profile?.avatar ? (
                        <img src={getFileUrl(user.profile.avatar)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-themed-text text-sm">{user.name}</h4>
                      <p className="text-[10px] text-themed-text-ter font-black flex items-center gap-1">
                        <FaClock className="text-primary-500" /> {new Date(post.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 py-4">
                  <p className="text-themed-text-sec font-medium whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Image */}
                {post.image && (
                  <div className="px-4 pb-6">
                    <img src={getFileUrl(post.image)} alt="" className="rounded-2xl w-full h-auto shadow-md" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex p-2 bg-themed-bg-sec/30 border-t border-primary-100/30">
                  <button 
                    onClick={() => handleLike(post._id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs ${
                      post.likes?.includes(currentUser?.id) ? 'text-primary-600 bg-primary-50' : 'text-themed-text-ter hover:bg-primary-50'
                    }`}
                  >
                    <FaThumbsUp /> {post.likes?.length || 0} تفاعل
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-2 py-3 text-themed-text-ter font-black text-xs">
                    <FaComment /> {post.comments?.length || 0} تعليق
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-20 text-center text-slate-400 font-bold">
              لا توجد منشورات لهذا المستخدم بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
