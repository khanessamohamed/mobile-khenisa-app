import { useState } from 'react';

function EditCustomerForm({ customer, onUpdate, onCancel }) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [branch, setBranch] = useState(customer.branch);

  const handleSubmit = (e) => {
    e.preventDefault();

    onUpdate(customer.id, {
      name,
      phone,
      branch,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white rounded-lg shadow mb-4 space-y-3"
    >
      <h2 className="font-bold text-lg">تعديل بيانات العميل</h2>

      <input
        type="text"
        placeholder="اسم العميل"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        placeholder="رقم الهاتف"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <select
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
        className="w-full p-2 border rounded"
        required
      >
        <option value="">اختر الفرع</option>
        <option value="الرئيسي">الرئيسي</option>
        <option value="بسنتواي">بسنتواي</option>
        <option value="دمنهور">دمنهور</option>
        <option value="الزاوية">الزاوية</option>
      </select>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          حفظ التعديل
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

export default EditCustomerForm;
