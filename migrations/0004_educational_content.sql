CREATE TABLE IF NOT EXISTS educational_content (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample educational content
INSERT INTO educational_content (title, content, category) VALUES
('أهمية الفحوصات الدورية', 'الفحوصات الدورية هي جزء مهم من الرعاية الصحية الوقائية. تساعد في اكتشاف المشاكل الصحية مبكراً قبل ظهور الأعراض، مما يزيد من فرص العلاج الناجح ويقلل من تكاليف الرعاية الصحية على المدى الطويل.', 'عام'),
('فحص الكوليسترول', 'يساعد فحص الكوليسترول في تقييم خطر الإصابة بأمراض القلب والأوعية الدموية. يُنصح بإجراء هذا الفحص كل 4-6 سنوات للبالغين الأصحاء، وأكثر تكراراً للأشخاص الذين لديهم عوامل خطر.', 'قلب'),
('الكشف المبكر عن السرطان', 'الكشف المبكر عن السرطان يمكن أن ينقذ حياتك. تشمل الفحوصات المهمة: تصوير الثدي، مسحة عنق الرحم، فحص القولون، وفحص البروستات. تحدث مع طبيبك حول الجدول الزمني المناسب لك.', 'سرطان');
