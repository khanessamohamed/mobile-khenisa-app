require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const XLSX = require('xlsx');
const iconv = require('iconv-lite');


const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors({
  origin: [
    'https://mobile-khenisa-frontend.vercel.app'
  ]
}));
const port = process.env.PORT || 5000;

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.get('/', (req, res) => {
  res.send('السيرفر شغال تمام');
});

app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('customers').select('*');

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, customers: data });
});

// API إضافة عميل جديد
app.post('/customers', async (req, res) => {
  const { name, phone, branch, notes } = req.body;

  if (!name || !phone || !branch) {
    return res.status(400).json({
      success: false,
      error: 'الاسم ورقم الهاتف والفرع حقول إجبارية'
    });
  }

  const { data, error } = await supabase
    .from('customers')
    .insert([{ name, phone, branch, notes }])
    .select();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(201).json({ success: true, customer: data[0] });
});

// API عرض كل العملاء
app.get('/customers', async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, customers: data });
});

// API تعديل بيانات عميل
app.put('/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, branch, last_visit_date, last_oil_change_date, notes } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (branch !== undefined) updateData.branch = branch;
  if (last_visit_date !== undefined) updateData.last_visit_date = last_visit_date;
  if (last_oil_change_date !== undefined) updateData.last_oil_change_date = last_oil_change_date;
  if (notes !== undefined) updateData.notes = notes;

  const { data, error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  if (data.length === 0) {
    return res.status(404).json({ success: false, error: 'العميل غير موجود' });
  }

  res.json({ success: true, customer: data[0] });
});

// API البحث عن العملاء (بالاسم أو برقم الهاتف)
app.get('/customers/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ success: false, error: 'يجب إدخال كلمة بحث' });
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, customers: data });
});

// API فلترة العملاء حسب الفرع
app.get('/customers/by-branch', async (req, res) => {
  const { branch } = req.query;

  if (!branch) {
    return res.status(400).json({ success: false, error: 'يجب تحديد اسم الفرع' });
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('branch', branch)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.json({ success: true, customers: data });
});

// GET /customers/inactive?days=30&branch=الفرع الرئيسي
app.get('/customers/inactive', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const branch = req.query.branch;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    let query = supabase
      .from('customers')
      .select('*')
      .or(
        `last_visit_date.lt.${cutoffISO},last_visit_date.is.null`
      );

    // لو فيه فرع محدد، نفلتر عليه
    if (branch) {
      query = query.eq('branch', branch);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// DELETE /customers/:id
app.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'تم حذف العميل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /sms-settings
app.get('/sms-settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sms_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /sms-settings
app.put('/sms-settings', async (req, res) => {
  try {
    const { message_template } = req.body;

    if (!message_template) {
      return res.status(400).json({ error: 'message_template مطلوب' });
    }

    // نجيب أول صف موجود عشان نعرف الـ id بتاعه
    const { data: existing, error: fetchError } = await supabase
      .from('sms_settings')
      .select('id')
      .limit(1)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('sms_settings')
      .update({
        message_template,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /customers/:id/log-sms
app.post('/customers/:id/log-sms', async (req, res) => {
  try {
    const { id } = req.params;

    // نجيب العميل الحالي عشان نعرف sms_count الحالي
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('sms_count')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('customers')
      .update({
        last_sms_date: new Date().toISOString(),
        sms_count: (customer.sms_count || 0) + 1
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /customers/import-excel
app.post(
  '/customers/import-excel',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'من فضلك اختر ملف Excel'
        });
      }

      // قراءة ملف Excel من الذاكرة
      const workbook = XLSX.read(req.file.buffer, {
        type: 'buffer'
      });

      // أول Sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // قراءة Excel كمصفوفة
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
      });

      console.log('Excel Rows:', rows);

      if (!rows.length) {
        return res.status(400).json({
          success: false,
          error: 'ملف Excel فارغ'
        });
      }

      const newCustomers = [];
      let skipped = 0;

      // جلب أرقام العملاء الموجودة حاليًا
      const {
        data: existingCustomers,
        error: existingError
      } = await supabase
        .from('customers')
        .select('phone');

      if (existingError) {
        throw existingError;
      }

      const existingPhones = new Set(
        existingCustomers
          .map((customer) =>
            String(customer.phone || '').trim()
          )
          .filter(Boolean)
      );


const fixArabic = (value) => {
  if (!value) return '';

  try {
    return iconv.decode(
      Buffer.from(String(value), 'latin1'),
      'win1256'
    );
  } catch {
    return String(value);
  }
};


      // نبدأ من الصف الثاني
      // الصف الأول هو أسماء الأعمدة
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        // ترتيب أعمدة Excel:
        // 0 = كود العميل
        // 1 = اسم العميل
        // 2 = الهاتف
        // 3 = العنوان
        // 4 = كود المندوب
        // 5 = اسم المندوب

        const name = fixArabic(row[1]);
const phone = row[2];

let branch = fixArabic(row[5]).trim();

// تحويل اسم الفرع من Excel لاسم الفرع الموجود في النظام
if (branch === 'الفرع الرئيسي') {
  branch = 'الرئيسي';
}

// لو البيانات الأساسية ناقصة نتجاهل الصف
// خصوصًا لو مفيش رقم تليفون
if (!name || !phone || !branch) {
  continue;
}

// الفروع المسموح بها
const allowedBranches = [
  'الرئيسي',
  'دمنهور',
  'الزاوية',
  'بسنتواي'
];

// لو اسم الفرع مش واحد من الفروع المعتمدة نتجاهل الصف
if (!allowedBranches.includes(branch)) {
  continue;
}

let cleanPhone = String(phone).trim();

// Excel ممكن يشيل الصفر الأول من رقم الهاتف
if (
  !cleanPhone.startsWith('0') &&
  cleanPhone.length === 10
) {
  cleanPhone = '0' + cleanPhone;
}

// لو العميل موجود بالفعل نتجاهله
if (existingPhones.has(cleanPhone)) {
  skipped++;
  continue;
}

newCustomers.push({
  name: String(name).trim(),
  phone: cleanPhone,
  branch: branch
});


        // منع تكرار نفس الرقم داخل ملف Excel
        existingPhones.add(cleanPhone);
      }

      // إضافة العملاء الجدد
      let insertedCount = 0;

      if (newCustomers.length > 0) {
        const {
          data,
          error
        } = await supabase
          .from('customers')
          .insert(newCustomers)
          .select();

        if (error) {
          throw error;
        }

        insertedCount = data.length;
      }

      res.json({
        success: true,
        message: 'تم استيراد ملف Excel بنجاح',
        inserted: insertedCount,
        skipped: skipped
      });

    } catch (err) {
      console.error(
        'خطأ في استيراد Excel:',
        err
      );

      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
);

module.exports = app;