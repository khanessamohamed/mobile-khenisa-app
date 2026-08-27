import API_BASE_URL from './client';

export async function getCustomers() {
  const response = await fetch(`${API_BASE_URL}/customers`);

  if (!response.ok) {
    throw new Error('فشل في جلب العملاء');
  }

  const data = await response.json();
  return data.customers;
}

export async function deleteCustomer(id) {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('فشل في حذف العميل');
  }

  return response.json();
}

export async function addCustomer(customerData) {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    throw new Error('فشل في إضافة العميل');
  }

  return response.json();
}

export async function searchCustomers(query) {
  const response = await fetch(
    `${API_BASE_URL}/customers/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error('فشل في البحث عن العملاء');
  }

  const data = await response.json();
  return data.customers;
}

export async function updateCustomer(id, customerData) {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    throw new Error('فشل في تعديل العميل');
  }

  return response.json();
}

export async function getSmsSettings() {
  const response = await fetch(`${API_BASE_URL}/sms-settings`);

  if (!response.ok) {
    throw new Error('فشل في جلب إعدادات الرسائل');
  }

  return response.json();
}

export async function logSms(id) {
  const response = await fetch(
    `${API_BASE_URL}/customers/${id}/log-sms`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('فشل في تسجيل الرسالة');
  }

  return response.json();
}
