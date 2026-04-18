import React, { useState } from 'react';
import { FiHeart, FiMessageCircle, FiShare2, FiMoreHorizontal } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const PostCard = ({ post }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="glass-card mb-6 overflow-hidden animate-slide-up hover-card group">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-accent rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-premium group-hover:rotate-6 transition-transform">
              {post.user?.name ? post.user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg leading-tight hover:text-primary-600 cursor-pointer transition-colors">
                {post.user?.name}
              </h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                {new Date(post.createdAt).toLocaleDateString('ar-EG')} • <span className="text-primary-500">العالمية 🌐</span>
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:bg-slate-50 p-2.5 rounded-xl transition-all border border-transparent hover:border-slate-100">
            <FiMoreHorizontal size={20} />
          </button>
        </div>

        <div className="text-slate-700 leading-relaxed mb-6 text-base font-medium whitespace-pre-wrap">
          {post.content}
        </div>
      </div>

      {post.image && (
        <div className="bg-slate-50 border-y border-slate-100 overflow-hidden">
          <img src={post.image} alt="Post content" className="w-full h-auto max-h-[600px] object-contain mx-auto group-hover:scale-[1.02] transition-transform duration-700" />
        </div>
      )}

      <div className="px-6 py-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <FiHeart size={10} className="text-white fill-current" />
            </div>
          </div>
          <span className="text-primary-600">{isLiked ? (post.likes?.length || 0) + 1 : (post.likes?.length || 0)}</span>
        </div>
        <div className="flex gap-4">
          <span className="hover:text-primary-600 cursor-pointer transition-colors">{post.comments?.length || 0} تعليق</span>
          <span className="hover:text-primary-600 cursor-pointer transition-colors">{post.shares || 0} مشاركة</span>
        </div>
      </div>

      <div className="px-3 py-2 flex items-center gap-2">
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs ${isLiked ? 'text-primary-600 bg-primary-50' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {isLiked ? <FaHeart className="text-red-500 text-lg" /> : <FiHeart className="text-lg" />} أعجبني
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-black text-xs">
          <FiMessageCircle className="text-lg" /> تعليق
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-black text-xs">
          <FiShare2 className="text-lg" /> مشاركة
        </button>
      </div>
    </div>
  );
};

export default PostCard;