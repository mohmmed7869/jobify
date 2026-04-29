import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiBriefcase, FiFileText, FiUser } from 'react-icons/fi';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Hide bottom nav on desktop, or if not logged in as jobseeker/employer
  if (!user || user.role === 'admin') return null;

  const isActive = (path) => location.pathname.startsWith(path) ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600';

  const jobseekerLinks = [
    { to: '/dashboard', icon: <FiHome size={20} />, label: 'الرئيسية' },
    { to: '/jobs', icon: <FiBriefcase size={20} />, label: 'الوظائف' },
    { to: '/ai-coach', icon: <span className="text-xl leading-none">✨</span>, label: 'المساعد' },
    { to: '/resume-builder', icon: <FiFileText size={20} />, label: 'السيرة' },
    { to: '/profile', icon: <FiUser size={20} />, label: 'الحساب' },
  ];

  const employerLinks = [
    { to: '/employer/dashboard', icon: <FiHome size={20} />, label: 'الرئيسية' },
    { to: '/employer/jobs', icon: <FiBriefcase size={20} />, label: 'وظائفي' },
    { to: '/employer/post-job', icon: <span className="text-xl leading-none font-bold">+</span>, label: 'نشر وظيفة' },
    { to: '/employer/applications', icon: <FiFileText size={20} />, label: 'الطلبات' },
    { to: '/employer/profile', icon: <FiUser size={20} />, label: 'الحساب' },
  ];

  const links = user.role === 'jobseeker' ? jobseekerLinks : employerLinks;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {links.map((link, idx) => (
          <Link
            key={idx}
            to={link.to}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive(link.to)}`}
          >
            {link.icon}
            <span className="text-[10px] font-semibold">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
