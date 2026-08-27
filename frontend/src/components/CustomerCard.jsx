import { useState } from 'react';
import { getSmsSettings, logSms } from '../api/customers';

const formatDate = (date) => {
  if (!date) return 'لا يوجد';

  return new Date(date).toLocaleDateString('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

function CustomerCard({
  customer,
  onDelete,
  onUpdate,
  selected,
  onSelect,
  onRegisterVisit,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [branch, setBranch] = useState(customer.branch);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onUpdate(customer.id, {
      name,
      phone,
      branch,
    });

    setIsEditing(false);
  };

  const handleWhatsApp = async () => {
    try {
      const settings = await getSmsSettings();

      let message = settings.message_template;

      message = message.replaceAll(
        '{{اسم_العميل}}',
        customer.name
      );

      message = message.replaceAll(
        '{{اسم_الفرع}}',
        customer.branch
      );

      const phoneNumber = customer.phone.replace(/^0/, '');

      const whatsappUrl =
        `https://wa.me/20${phoneNumber}?text=` +
        encodeURIComponent(message);

      window.open(whatsappUrl, '_blank');
    } catch (err) {
      alert(
        'حصل خطأ أثناء تجهيز رسالة الواتساب: ' +
          err.message
      );
    }
  };

  const handleSMS = async () => {
    try {
      const settings = await getSmsSettings();

      let message = settings.message_template;

      message = message.replaceAll(
        '{{اسم_العميل}}',
        customer.name
      );

      message = message.replaceAll(
        '{{اسم_الفرع}}',
        customer.branch
      );

      const smsUrl =
        `sms:${customer.phone}?body=` +
        encodeURIComponent(message);

      window.location.href = smsUrl;

      logSms(customer.id).catch((err) => {
        console.error(
          'فشل تسجيل الرسالة:',
          err
        );
      });
    } catch (err) {
      alert(
        'حصل خطأ أثناء تجهيز الرسالة: ' +
          err.message
      );
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded-lg shadow mb-3">
        <h3 className="font-bold text-lg mb-3">
          تعديل بيانات العميل
        </h3>

        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="اسم العميل"
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="رقم الهاتف"
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            value={branch}
            onChange={(e) =>
              setBranch(e.target.value)
            }
            placeholder="الفرع"
            className="w-full p-2 border rounded"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              حفظ التعديل
            </button>

            <button
              type="button"
              onClick={() =>
                setIsEditing(false)
              }
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-3">
      <div className="flex items-start gap-3">

        {/* مربع تحديد العميل */}
        <input
          type="checkbox"
          checked={Boolean(selected)}
          onChange={() => onSelect(customer.id)}
          className="w-5 h-5 mt-1 cursor-pointer"
        />

        {/* بيانات العميل */}
        <div className="flex-1">
          <h3 className="font-bold text-lg">
            {customer.name}
          </h3>

          <p className="text-gray-600">
            📞 {customer.phone}
          </p>

          <p className="text-sm text-gray-500">
            الفرع: {customer.branch}
          </p>

          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>
              آخر زيارة:{' '}
              {formatDate(
                customer.last_visit_date
              )}
            </p>

            <p>
              آخر تغيير زيت:{' '}
              {formatDate(
                customer.last_oil_change_date
              )}
            </p>

            <p>
              آخر رسالة:{' '}
              {formatDate(
                customer.last_sms_date
              )}
            </p>

            <p>
              عدد الرسائل:{' '}
              {customer.sms_count || 0}
            </p>

            {customer.notes && (
              <p>
                الملاحظات: {customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* أزرار العميل */}
<div className="flex gap-2 flex-wrap">

  <button
    onClick={() => onRegisterVisit(customer)}
    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    ✅ تسجيل زيارة
  </button>

  <button
    onClick={handleWhatsApp}
    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
  >
    WhatsApp
  </button>

  <button
    onClick={handleSMS}
    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
  >
    SMS
  </button>

  <button
    onClick={() =>
      setIsEditing(true)
    }
    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    تعديل
  </button>

  <button
    onClick={() =>
      onDelete(customer.id)
    }
    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
  >
    حذف
  </button>

</div>
      </div>
    </div>
  );
}

export default CustomerCard;
