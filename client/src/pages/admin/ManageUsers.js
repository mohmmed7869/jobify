import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiSearch, FiFilter, FiMoreVertical, FiUser, 
  FiShield, FiMail, FiCheckCircle, FiXCircle,
  FiTrash2, FiEdit2, FiActivity, FiArrowLeft, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users', {
        params: {
          page,
          limit: 10,
          role: roleFilter,
          isActive: statusFilter === '' ? undefined : (statusFilter === 'active' ? 'true' : 'false'),
          search: searchTerm
        }
      });
      setUsers(res.data.data);
      setTotalPages(Math.ceil(res.data.total / 10));
    } catch (error) {
      toast.error('خطأ في تحميل المستخدمين');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });
      toast.success('تم تحديث حالة المستخدم بنجاح');
      fetchUsers();
    } catch (error) {
      toast.error('فشل في تحديث حالة المستخدم');
    }
  };

  if (loading && page === 1) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen mesh-bg pb-20 pt-8" dir="rtl">
      <div className="premium-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-black text-slate-900 mb-2">إدارة المستخدمين</h1>
            <p className="text-slate-500 font-bold flex items-center gap-2">
              <FiShield className="text-primary-500" /> إدارة صلاحيات وحسابات مستخدمي المنصة
            </p>
          </div>
          
          <div className="flex items-center gap-4 animate-slide-up">
            <div className="glass-card p-2 flex items-center gap-4">
              <div className="text-center px-4 border-l border-slate-100">
                <div className="text-2xl font-black text-slate-900">{users.length}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">مستخدم حالي</div>
              </div>
              <div className="text-center px-4">
                <div className="text-2xl font-black text-primary-600">
                  {users.filter(u => u.isActive).length}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">نشط</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 relative group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                className="premium-input pr-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <select
                className="premium-input appearance-none"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">جميع الأدوار</option>
                <option value="jobseeker">باحث عن عمل</option>
                <option value="employer">صاحب عمل</option>
                <option value="admin">مسؤول</option>
              </select>
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button type="submit" className="btn-premium-primary py-3">
              تطبيق التصفية
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">الدور</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">تاريخ الانضمام</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-xl shadow-inner group-hover:from-primary-500 group-hover:to-primary-600 group-hover:text-white transition-all duration-500">
                          {user.name?.charAt(0) || <FiUser />}
                        </div>
                        <div>
                          <div className="font-black text-slate-900">{user.name || 'مستخدم غير معروف'}</div>
                          <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <FiMail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                        user.role === 'employer' ? 'bg-blue-100 text-blue-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {user.role === 'admin' ? 'مسؤول' : user.role === 'employer' ? 'صاحب عمل' : 'باحث عن عمل'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-YE') : 'غير متوفر'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span className={`text-xs font-black ${user.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {user.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                          className={`p-2 rounded-xl transition-all ${
                            user.isActive 
                              ? 'text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white' 
                              : 'text-emerald-500 bg-emerald-50 hover:bg-emerald-500 hover:text-white'
                          }`}
                          title={user.isActive ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                        >
                          {user.isActive ? <FiXCircle size={18} /> : <FiCheckCircle size={18} />}
                        </button>
                        <button className="p-2 text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                          <FiEdit2 size={18} />
                        </button>
                        <button className="p-2 text-slate-400 bg-slate-50 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="btn-premium-outline py-2 px-4 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              <FiArrowRight /> السابق
            </button>
            <div className="text-xs font-black text-slate-500">
              صفحة {page} من {totalPages}
            </div>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="btn-premium-outline py-2 px-4 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              التالي <FiArrowLeft />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
