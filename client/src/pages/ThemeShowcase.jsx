import React from 'react';
import FormalButton from '../components/common/FormalButton';
import FormalCard from '../components/common/FormalCard';
import ThemeSwitcher from '../components/common/ThemeSwitcher';
import { FiCheck, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ThemeShowcase = () => {
  return (
    <div className="formal-container py-8">
      <div className="formal-header">
        <h1>عرض الثيم - نظام التصميم الكلاسيكي والتقني</h1>
        <p>استكشف جميع المكونات والأنماط المتوفرة في نظام التصميم الجديد</p>
      </div>

      <div className="mb-12 animate-slide-up">
        <FormalCard header="تبديل الثيم">
          <div className="flex justify-center">
            <ThemeSwitcher />
          </div>
        </FormalCard>
      </div>

      <div className="formal-grid-2 mb-12">
        <FormalCard header="أزرار أساسية" variant="default">
          <div className="space-y-3">
            <FormalButton variant="primary" fullWidth>
              زر أساسي
            </FormalButton>
            <FormalButton variant="secondary" fullWidth>
              زر ثانوي
            </FormalButton>
            <FormalButton variant="outline" fullWidth>
              زر موضح
            </FormalButton>
          </div>
        </FormalCard>

        <FormalCard header="أزرار متقدمة">
          <div className="space-y-3">
            <FormalButton variant="success" fullWidth icon={FiCheck}>
              نجح
            </FormalButton>
            <FormalButton variant="danger" fullWidth icon={FiX}>
              حذف
            </FormalButton>
            <FormalButton variant="primary" fullWidth disabled>
              معطل
            </FormalButton>
          </div>
        </FormalCard>
      </div>

      <div className="formal-grid-2 mb-12">
        <FormalCard header="نماذج الإدخال" variant="alt">
          <div className="space-y-4">
            <div>
              <label className="formal-label">البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="example@example.com"
                className="formal-input"
              />
            </div>
            <div>
              <label className="formal-label">كلمة المرور</label>
              <input
                type="password"
                placeholder="••••••••"
                className="formal-input"
              />
            </div>
            <div>
              <label className="formal-label">الدولة</label>
              <select className="formal-select">
                <option>اختر دولة</option>
                <option>السعودية</option>
                <option>الإمارات</option>
                <option>مصر</option>
              </select>
            </div>
          </div>
        </FormalCard>

        <FormalCard header="نماذج متقدمة">
          <div className="space-y-4">
            <div>
              <label className="formal-label">الملاحظات</label>
              <textarea
                className="formal-textarea"
                placeholder="أدخل ملاحظاتك هنا..."
              ></textarea>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="badge-primary">نشط</span>
              <span className="badge-success">مكتمل</span>
              <span className="badge-warning">قيد الانتظار</span>
              <span className="badge-error">خطأ</span>
            </div>
          </div>
        </FormalCard>
      </div>

      <div className="formal-grid-2 mb-12">
        <div className="alert-success animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-3">
            <FiCheck size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">رسالة نجاح</h4>
              <p className="text-sm">تم إكمال العملية بنجاح</p>
            </div>
          </div>
        </div>

        <div className="alert-warning animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex gap-3">
            <FiAlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">تحذير</h4>
              <p className="text-sm">يرجى الانتباه للنقاط التالية</p>
            </div>
          </div>
        </div>

        <div className="alert-error animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex gap-3">
            <FiX size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">خطأ</h4>
              <p className="text-sm">حدث خطأ أثناء معالجة الطلب</p>
            </div>
          </div>
        </div>

        <div className="alert-info animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex gap-3">
            <FiInfo size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">معلومة</h4>
              <p className="text-sm">هذه معلومة مهمة يجب الانتباه لها</p>
            </div>
          </div>
        </div>
      </div>

      <FormalCard header="جداول رسمية">
        <table className="formal-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>الحالة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>أحمد محمد</td>
              <td>ahmed@example.com</td>
              <td><span className="badge-success">نشط</span></td>
              <td>
                <FormalButton variant="outline" size="sm">
                  تحرير
                </FormalButton>
              </td>
            </tr>
            <tr>
              <td>فاطمة علي</td>
              <td>fatima@example.com</td>
              <td><span className="badge-warning">قيد الانتظار</span></td>
              <td>
                <FormalButton variant="outline" size="sm">
                  تحرير
                </FormalButton>
              </td>
            </tr>
            <tr>
              <td>محمود يوسف</td>
              <td>mahmoud@example.com</td>
              <td><span className="badge-primary">مكتمل</span></td>
              <td>
                <FormalButton variant="outline" size="sm">
                  تحرير
                </FormalButton>
              </td>
            </tr>
          </tbody>
        </table>
      </FormalCard>

      <div className="mt-12 text-center text-slate-600">
        <p className="text-sm">© 2026 Jobify - جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
};

export default ThemeShowcase;
