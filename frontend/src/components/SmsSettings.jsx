import { useEffect, useState } from 'react';
import API_BASE_URL from '../api/client';

function SmsSettings() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sms-settings`
      );

      if (!response.ok) {
        throw new Error('فشل في جلب إعدادات الرسالة');
      }

      const data = await response.json();

      setMessage(data.message_template || '');
    } catch (err) {
      alert('حصل خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!message.trim()) {
      alert('اكتب الرسالة أولاً');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/sms-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message_template: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('فشل في حفظ الرسالة');
      }

      alert('تم حفظ الرسالة بنجاح ✅');
    } catch (err) {
      alert('حصل خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow mb-4">
        جاري تحميل إعدادات الرسالة...
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-4">
      <h2 className="text-xl font-bold mb-3">
        ⚙️ إعدادات الرسائل
      </h2>

      <p className="text-sm text-gray-600 mb-2">
        اكتب الرسالة التي تريد استخدامها في WhatsApp و SMS
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows="5"
        className="w-full p-3 border rounded mb-3"
        placeholder="اكتب رسالة العملاء هنا..."
      />

      <div className="text-sm text-gray-600 mb-3">
        <p className="font-bold mb-1">
          الكلمات التي يقدر البرنامج يستبدلها:
        </p>

        <p>
          <code>{'{{اسم_العميل}}'}</code> = اسم العميل
        </p>

        <p>
          <code>{'{{اسم_الفرع}}'}</code> = اسم الفرع
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {saving ? 'جاري الحفظ...' : 'حفظ الرسالة'}
      </button>
    </div>
  );
}

export default SmsSettings;
