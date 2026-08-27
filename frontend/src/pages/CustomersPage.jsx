import { useState, useEffect } from 'react';

import {
  getCustomers,
  deleteCustomer,
  addCustomer,
  searchCustomers,
  updateCustomer,
  getSmsSettings,
} from '../api/customers';

import CustomerCard from '../components/CustomerCard';
import AddCustomerForm from '../components/AddCustomerForm';
import SmsSettings from '../components/SmsSettings';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [importingExcel, setImportingExcel] = useState(false);


  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [inactiveDays, setInactiveDays] = useState('');

  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // قائمة العملاء في الإرسال الجماعي
  const [bulkCustomers, setBulkCustomers] = useState([]);
  const [bulkIndex, setBulkIndex] = useState(0);
  const [bulkMessageTemplate, setBulkMessageTemplate] = useState('');

  useEffect(() => {
    getCustomers()
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);

      setCustomers((currentCustomers) =>
        currentCustomers.filter((c) => c.id !== id)
      );

      setSelectedCustomers((current) =>
        current.filter((customerId) => customerId !== id)
      );
    } catch (err) {
      alert('حصل خطأ أثناء الحذف: ' + err.message);
    }
  };

  const handleAdd = async (customerData) => {
    try {
      const newCustomer = await addCustomer(customerData);

      setCustomers((currentCustomers) => [
        ...currentCustomers,
        newCustomer.customer,
      ]);
    } catch (err) {
      alert('حصل خطأ أثناء الإضافة: ' + err.message);
    }
  };

  const handleSearch = async (e) => {
  const query = e.target.value;
  setSearchQuery(query);

  try {
    let data = [];

    // أولاً: نجيب العملاء حسب الفرع المختار
    if (selectedBranch) {
      const url =
        'http://172.20.10.4:5000/customers/by-branch?branch=' +
        encodeURIComponent(selectedBranch);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('فشل في جلب عملاء الفرع');
      }

      const result = await response.json();

      data = result.customers;
    } else {
      const result = await getCustomers();

      data = result;
    }

    // ثانياً: فلترة العملاء حسب مدة عدم الزيارة
    if (inactiveDays) {
      const now = new Date();

      data = data.filter((customer) => {
        // العميل اللي ملوش زيارة يتعتبر غير نشط
        if (!customer.last_visit_date) {
          return true;
        }

        const lastVisit = new Date(
          customer.last_visit_date
        );

        const days =
          (now - lastVisit) /
          (1000 * 60 * 60 * 24);

        return days >= Number(inactiveDays);
      });
    }

    // ثالثاً: البحث داخل النتيجة بعد تطبيق الفلاتر
    if (query.trim()) {
      const searchText = query
        .trim()
        .toLowerCase();

      data = data.filter((customer) => {
        const name = (
          customer.name || ''
        ).toLowerCase();

        const phone = (
          customer.phone || ''
        ).toLowerCase();

        return (
          name.includes(searchText) ||
          phone.includes(searchText)
        );
      });
    }

    setCustomers(data);
    setSelectedCustomers([]);
  } catch (err) {
    setError(err.message);
  }
};

  const handleBranchChange = async (e) => {
    const branch = e.target.value;
    setSelectedBranch(branch);

    try {
      if (!branch) {
        const data = await getCustomers();
        setCustomers(data);
        setSelectedCustomers([]);
        return;
      }

      const url =
        'http://172.20.10.4:5000/customers/by-branch?branch=' +
        encodeURIComponent(branch);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('فشل في جلب عملاء الفرع');
      }

      const data = await response.json();

      setCustomers(data.customers);
      setSelectedCustomers([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInactiveChange = async (e) => {
  const days = e.target.value;
  setInactiveDays(days);

  try {
    if (!days) {
  if (selectedBranch) {
    const url =
      'http://172.20.10.4:5000/customers/by-branch?branch=' +
      encodeURIComponent(selectedBranch);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('فشل في جلب عملاء الفرع');
    }

    const data = await response.json();

    setCustomers(data.customers);
    setSelectedCustomers([]);
    return;
  }

  const data = await getCustomers();
  setCustomers(data);
  setSelectedCustomers([]);
  return;
}

    let url =
      'http://172.20.10.4:5000/customers/inactive?days=' +
      days;

    // لو فيه فرع محدد، نضيفه للبحث
    if (selectedBranch) {
      url +=
        '&branch=' +
        encodeURIComponent(selectedBranch);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        'فشل في جلب العملاء غير النشطين'
      );
    }

    const data = await response.json();

    setCustomers(data);
    setSelectedCustomers([]);
  } catch (err) {
    setError(err.message);
  }
};

const handleUpdate = async (id, customerData) => {
  try {
    const updatedCustomer = await updateCustomer(
      id,
      customerData
    );

    setCustomers((currentCustomers) =>
      currentCustomers.map((customer) =>
        customer.id === id
          ? updatedCustomer.customer
          : customer
      )
    );
  } catch (err) {
    alert('حصل خطأ أثناء تعديل العميل: ' + err.message);
  }
};

const handleRegisterVisit = async (customer) => {
  try {
    const updatedCustomer = await updateCustomer(
      customer.id,
      {
        last_visit_date: new Date().toISOString(),
      }
    );

    setCustomers((currentCustomers) =>
      currentCustomers.map((c) =>
        c.id === customer.id
          ? updatedCustomer.customer
          : c
      )
    );

    alert(`تم تسجيل زيارة ${customer.name} بنجاح`);
  } catch (err) {
    console.error('خطأ في تسجيل الزيارة:', err);
    alert(
      'حصل خطأ أثناء تسجيل الزيارة: ' +
      err.message
    );
  }
};

  // تحديد أو إلغاء تحديد عميل
  const toggleCustomer = (id) => {
    setSelectedCustomers((current) => {
      if (current.includes(id)) {
        return current.filter(
          (customerId) => customerId !== id
        );
      }

      return [...current, id];
    });
  };

  // تحديد كل العملاء الظاهرين
  const toggleSelectAll = () => {
    if (
      customers.length > 0 &&
      selectedCustomers.length === customers.length
    ) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(
        customers.map((customer) => customer.id)
      );
    }
  };

  // تجهيز الإرسال الجماعي
  const handleBulkWhatsApp = async () => {
    if (selectedCustomers.length === 0) {
      alert('اختار عميل واحد على الأقل');
      return;
    }

    try {
      const settings = await getSmsSettings();

      const selected = customers.filter((customer) =>
        selectedCustomers.includes(customer.id)
      );

      if (selected.length === 0) {
        alert('مفيش عملاء محددين');
        return;
      }

      setBulkCustomers(selected);
      setBulkIndex(0);
      setBulkMessageTemplate(settings.message_template);

      // فتح أول عميل مباشرة
      openWhatsAppCustomer(
        selected[0],
        settings.message_template
      );
    } catch (err) {
      alert(
        'حصل خطأ أثناء تجهيز رسائل الواتساب: ' +
          err.message
      );
    }
  };

  // فتح واتساب لعميل واحد
  const openWhatsAppCustomer = (
    customer,
    messageTemplate
  ) => {
    const message = messageTemplate
      .replaceAll(
        '{{اسم_العميل}}',
        customer.name
      )
      .replaceAll(
        '{{اسم_الفرع}}',
        customer.branch
      );

    const phoneNumber = customer.phone.replace(/^0/, '');

    const whatsappUrl =
      'https://wa.me/20' +
      phoneNumber +
      '?text=' +
      encodeURIComponent(message);

    window.open(whatsappUrl, '_blank');
  };

  // فتح العميل التالي
  const handleNextWhatsApp = () => {
    const nextIndex = bulkIndex + 1;

    if (nextIndex >= bulkCustomers.length) {
      alert('تم الانتهاء من كل العملاء المحددين');

      setBulkCustomers([]);
      setBulkIndex(0);
      return;
    }

    setBulkIndex(nextIndex);

    openWhatsAppCustomer(
      bulkCustomers[nextIndex],
      bulkMessageTemplate
    );
  };

  // إلغاء الإرسال الجماعي
  const handleCancelBulk = () => {
    setBulkCustomers([]);
    setBulkIndex(0);
    setBulkMessageTemplate('');
  };

const handleExcelImport = async () => {
  if (!excelFile) {
    alert('اختار ملف Excel الأول');
    return;
  }

  try {
    setImportingExcel(true);

    const formData = new FormData();
    formData.append('file', excelFile);

    const response = await fetch(
      'http://172.20.10.4:5000/customers/import-excel',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'فشل في استيراد ملف Excel'
      );
    }

    alert(
      `تم استيراد ملف Excel بنجاح ✅\n\n` +
      `العملاء الجدد: ${data.inserted}\n` +
      `العملاء الموجودين بالفعل: ${data.skipped}`
    );

    setExcelFile(null);

    // إعادة تحميل العملاء من قاعدة البيانات
    const customersData = await getCustomers();

    setCustomers(customersData);
    setSelectedCustomers([]);

  } catch (err) {
    console.error('خطأ في استيراد Excel:', err);

    alert(
      'حصل خطأ أثناء استيراد Excel: ' +
      err.message
    );
  } finally {
    setImportingExcel(false);
  }
};


  if (loading) {
    return <p className="p-4">جاري التحميل...</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-red-600">
        خطأ: {error}
      </p>
    );
  }

  return (
    <div className="p-4">

      <h1 className="text-2xl font-bold mb-4">
        قائمة العملاء
      </h1>

      <SmsSettings />

<AddCustomerForm onAdd={handleAdd} />

<div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">

  <h2 className="font-bold text-lg mb-3">
    استيراد العملاء من Excel
  </h2>

  <div className="flex flex-wrap gap-2 items-center">

    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={(e) => {
        setExcelFile(e.target.files[0] || null);
      }}
      className="bg-white border rounded p-2"
    />

    <button
      onClick={handleExcelImport}
      disabled={!excelFile || importingExcel}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {importingExcel
        ? 'جاري الاستيراد...'
        : 'استيراد Excel'}
    </button>

  </div>

  {excelFile && (
    <p className="text-sm text-gray-600 mt-2">
      الملف المختار: {excelFile.name}
    </p>
  )}

  <p className="text-sm text-gray-500 mt-2">
    الأعمدة المطلوبة:
    <strong> اسم العميل - الهاتف - اسم المندوب</strong>
  </p>

</div>

<input
  type="text"
  placeholder="ابحث باسم العميل أو رقم الهاتف"
  value={searchQuery}
  onChange={handleSearch}
  className="w-full p-2 border rounded mb-4"
/>

      <select
        value={selectedBranch}
        onChange={handleBranchChange}
        className="w-full p-2 border rounded mb-4"
      >
        <option value="">كل الفروع</option>
        <option value="الفرع الرئيسي">
          الفرع الرئيسي
        </option>
        <option value="بسنتواي">
          بسنتواي
        </option>
        <option value="دمنهور">
          دمنهور
        </option>
        <option value="الزاوية">
          الزاوية
        </option>
      </select>

      <select
        value={inactiveDays}
        onChange={handleInactiveChange}
        className="w-full p-2 border rounded mb-4"
      >
        <option value="">كل العملاء</option>
        <option value="30">
          لم يزر منذ 30 يوم
        </option>
        <option value="60">
          لم يزر منذ 60 يوم
        </option>
        <option value="90">
          لم يزر منذ 90 يوم
        </option>
        <option value="180">
          لم يزر منذ 6 شهور
        </option>
      </select>

      {/* الإرسال الجماعي */}
      {bulkCustomers.length > 0 && (
        <div className="bg-green-50 border border-green-300 p-4 rounded-lg mb-4">

          <p className="font-bold mb-2">
            إرسال واتساب جماعي
          </p>

          <p className="text-gray-700 mb-3">
            العميل رقم {bulkIndex + 1} من{' '}
            {bulkCustomers.length}
          </p>

          <p className="mb-3">
            العميل الحالي:{' '}
            <strong>
              {bulkCustomers[bulkIndex].name}
            </strong>
          </p>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={handleNextWhatsApp}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              فتح العميل التالي
            </button>

            <button
              onClick={handleCancelBulk}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              إلغاء الإرسال
            </button>

          </div>
        </div>
      )}

      {/* أدوات التحديد */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">

        <div className="flex flex-wrap gap-2 items-center">

          <button
            onClick={toggleSelectAll}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            {selectedCustomers.length === customers.length &&
            customers.length > 0
              ? 'إلغاء تحديد الكل'
              : 'تحديد الكل'}
          </button>

          <button
            onClick={handleBulkWhatsApp}
            disabled={selectedCustomers.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            إرسال واتساب للمحدد
          </button>

          <span className="text-gray-600">
            محدد: {selectedCustomers.length}
          </span>

        </div>
      </div>

      {/* قائمة العملاء */}
      <div className="space-y-3">

        {customers.map((customer) => (
          <div
            key={customer.id}
            className="flex items-start gap-2"
          >

            {/* مربع التحديد */}
            <input
              type="checkbox"
              checked={selectedCustomers.includes(
                customer.id
              )}
              onChange={() =>
                toggleCustomer(customer.id)
              }
              className="w-5 h-5 mt-5 cursor-pointer"
            />

            <div className="flex-1">
              <CustomerCard
                customer={customer}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onRegisterVisit={handleRegisterVisit}
              />
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default CustomersPage;
