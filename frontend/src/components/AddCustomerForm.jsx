import { useState } from 'react';

function AddCustomerForm({ onAdd }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [branch, setBranch] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ name, phone, branch });
    setName('');
    setPhone('');
    setBranch('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white rounded-lg shadow mb-4 space-y-3"
    >
      <h2 className="font-bold text-lg">إضافة عميل جديد</h2>

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

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        إضافة
      </button>
    </form>
  );
}

export default AddCustomerForm;
