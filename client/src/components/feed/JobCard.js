import React, { useState } from 'react';
import { FiMapPin, FiClock, FiHeart, FiBookmark, FiZap, FiTarget } from 'react-icons/fi';
import { FaHeart, FaBookmark } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getFileUrl } from '../../utils/fileUrl';

const JobCard = ({ job }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Mock match score if not provided
  const matchScore = job.matchScore || Math.floor(Math.random() * 30) + 70;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card p-0 mb-6 group relative overflow-hidden transition-all duration-500 border-none shadow-premium hover:shadow-premium-lg"
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-600/10 transition-colors"></div>
      
      <div className="p-4 sm:p-6">
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-start pointer-events-none z-10">
          {job.urgent ? (
            <div className="bg-red-500 text-white text-[8px] sm:text-[10px] font-black px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-glow animate-pulse uppercase tracking-widest pointer-events-auto">
              عاجل جداً
            </div>
          ) : (
            <div></div> /* Spacer */
          )}

          {/* Match Score Badge */}
          <div className="bg-slate-900/5 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 border border-slate-200/50 pointer-events-auto">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
            <span className="text-[8px] sm:text-[10px] font-black text-slate-700 uppercase tracking-widest truncate">مطابقة {matchScore}%</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-start justify-between mt-8 sm:mt-10 mb-6 gap-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-[1.5rem] sm:rounded-[1.8rem] flex items-center justify-center text-primary-600 font-black text-2xl sm:text-3xl shadow-premium border border-slate-50 relative shrink-0 overflow-hidden self-start"
            >
              {job.companyLogo ? (
                <img src={getFileUrl(job.companyLogo)} alt={job.companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="relative z-10">{job.companyName ? job.companyName.charAt(0) : 'J'}</span>
              )}
            </motion.div>
            
            <div className="space-y-2 sm:space-y-3 min-w-0">
              <Link to={`/jobs/${job._id}`} className="text-xl sm:text-2xl font-black text-slate-900 hover:text-primary-600 transition-colors block leading-tight tracking-tight truncate">
                {job.title}
              </Link>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-primary-600 font-black text-[10px] sm:text-sm flex items-center gap-1.5 bg-primary-50 px-2 sm:px-3 py-1 rounded-lg">
                  <FiTarget size={12} className="sm:w-[14px]" /> {job.companyName}
                </span>
                <span className="text-slate-400 text-[10px] sm:text-xs font-bold flex items-center gap-1.5">
                  <FiMapPin className="text-slate-300" /> {job.location?.city || 'عن بعد'}
                </span>
                <span className="text-slate-400 text-[10px] sm:text-xs font-bold flex items-center gap-1.5">
                  <FiClock className="text-slate-300" /> {new Date(job.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-row md:flex-col gap-2 self-end md:self-start w-full md:w-auto justify-end">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all shadow-sm ${isSaved ? 'text-primary-600 bg-primary-50 border border-primary-100' : 'text-slate-400 bg-slate-50 border border-slate-100 hover:bg-white'}`}
            >
              {isSaved ? <FaBookmark className="text-lg sm:text-xl" /> : <FiBookmark className="text-lg sm:text-xl" />}
            </motion.button>
          </div>
        </div>
        
        <div className="text-slate-500 text-xs sm:text-sm font-medium line-clamp-2 leading-relaxed mb-6 pr-4 border-r-4 border-slate-100/50">
          {job.description}
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          {job.requirements?.skills?.slice(0, 3).map((skill, i) => (
            <span key={i} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 text-slate-600 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-slate-100 transition-colors">
              {skill}
            </span>
          ))}
          {job.requirements?.skills?.length > 3 && (
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 text-slate-400 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black border border-slate-100">
              +{job.requirements.skills.length - 3}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 sm:pt-6 border-t border-slate-100/50 gap-4">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center gap-2 text-[9px] sm:text-[10px] font-black tracking-widest uppercase transition-all shrink-0 ${isLiked ? 'text-primary-600' : 'text-slate-400 hover:text-primary-600'}`}
            >
              <div className={`p-1.5 sm:p-2 rounded-lg ${isLiked ? 'bg-primary-50' : 'bg-slate-50'}`}>
                {isLiked ? <FaHeart className="text-red-500" /> : <FiHeart />}
              </div>
              <span>{isLiked ? (job.likes?.length || 0) + 1 : (job.likes?.length || 0)}</span>
            </motion.button>
            
            <div className="h-4 w-px bg-slate-200 shrink-0"></div>
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] sm:text-[10px] font-black whitespace-nowrap">
                {job.jobType}
              </span>
              {job.salary && (
                <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-[9px] sm:text-[10px] font-black whitespace-nowrap">
                  {job.salary.min}-{job.salary.max}$
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <Link 
              to={`/jobs/${job._id}`}
              className="flex-1 sm:flex-none btn-premium-primary py-2.5 sm:py-3 px-6 sm:px-8 text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group/btn whitespace-nowrap"
            >
              التفاصيل <FiZap className="group-hover/btn:animate-bounce shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;