-- 0021_add_university_thai_names.sql
-- Adds Thai names for universities, backfilled for the i18n language switcher.
ALTER TABLE universities ADD COLUMN IF NOT EXISTS name_th text;

UPDATE universities SET name_th = 'มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่' WHERE id = 1;
UPDATE universities SET name_th = 'มหาวิทยาลัยหาดใหญ่' WHERE id = 2;
UPDATE universities SET name_th = 'มหาวิทยาลัยราชภัฏสงขลา' WHERE id = 3;
UPDATE universities SET name_th = 'มหาวิทยาลัยทักษิณ วิทยาเขตสงขลา' WHERE id = 4;
UPDATE universities SET name_th = 'มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย' WHERE id = 5;