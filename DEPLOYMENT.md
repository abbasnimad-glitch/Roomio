# Roomio — คู่มือติดตั้งใช้งานจริง (Deployment Guide)

คู่มือนี้พาไปทีละขั้นตอน ตั้งแต่ศูนย์จนเว็บใช้งานได้จริงบนอินเทอร์เน็ต แบ่งเป็น 8 ส่วนใหญ่ ทำตามลำดับได้เลย

> **ข้อควรรู้ก่อนเริ่ม:** การเพิ่มที่พัก/ผู้ให้บริการทำได้ผ่าน Owner Dashboard (`/dashboard/owner`) และ Provider Dashboard (`/dashboard/provider`) ในตัวเว็บแล้ว ไม่จำเป็นต้องใช้ Supabase Table Editor อีกต่อไป (ยกเว้นกรณีแก้ไขข้อมูลเชิงลึกที่ไม่มี UI รองรับ)

---

## ส่วนที่ 1: เตรียมบัญชีที่ต้องใช้ทั้งหมด

ต้องสมัคร 4 บัญชีนี้ (ทุกอันมี free tier):

1. **GitHub** — github.com — เก็บโค้ด
2. **Supabase** — supabase.com — ฐานข้อมูล + ระบบล็อกอิน + เก็บรูปภาพ
3. **Vercel** — vercel.com — โฮสต์เว็บ (แนะนำ เพราะรองรับ Next.js แบบไม่ต้องตั้งค่าอะไรเพิ่ม)
   - ทางเลือก: **Cloudflare Pages** — ตรงตาม tech stack ที่ตั้งใจไว้ในสเปกเดิม แต่ setup ซับซ้อนกว่า (ดูส่วนที่ 5.2)
4. **Google Cloud Console** — console.cloud.google.com — สำหรับ Google Maps API key

---

## ส่วนที่ 2: ตั้งค่า Supabase (ฐานข้อมูลหลังบ้าน)

### 2.1 สร้างโปรเจกต์
1. เข้า supabase.com → **New Project**
2. ตั้งชื่อโปรเจกต์ เช่น `roomio-production`
3. ตั้งรหัสผ่านฐานข้อมูล (Database Password) — **เก็บรหัสนี้ไว้ให้ดี** จะใช้อีกทีตอน troubleshoot
4. เลือก Region ที่ใกล้ผู้ใช้งานที่สุด (เช่น Singapore สำหรับผู้ใช้ในไทย)
5. รอ 1-2 นาทีให้โปรเจกต์สร้างเสร็จ

### 2.2 รันฐานข้อมูล (migrations)

ไฟล์ SQL ทั้งหมดอยู่ใน `supabase/migrations/` เรียงลำดับด้วยเลขนำหน้า **ต้องรันตามลำดับเลขจากน้อยไปมาก ห้ามข้าม** เพราะแต่ละไฟล์ต่อยอดจากไฟล์ก่อนหน้า (ดูรายละเอียดและเหตุผลของแต่ละไฟล์ใน `supabase/migrations/README.md`):

1. `0001_initial_schema.sql` — โครงสร้างตารางหลักทั้งหมด
2. `0002_security_rls_column_guards.sql` — ปิดช่องโหว่ RLS ระดับคอลัมน์ (**สำคัญมาก อย่าข้าม**)
3. `0003_owner_dashboard_storage_policies.sql`
4. `0004_admin_user_suspension.sql`
5. `0005_search_performance_indexes.sql`
6. `0006_favorites_realtime.sql`
7. `0007_review_system.sql`
8. `0008_notification_system.sql`
9. `0009_chat_realtime.sql`
10. `0010_avatars_and_provider_images_storage_policies.sql`
11. `0011_service_provider_availability.sql`
12. `0012_premium_listing.sql`
13. `0013_boost_listing.sql`
14. `0014_verification.sql`
15. `0015_payment_system_architecture.sql`
16. `0016_reference_data_rls.sql`
17. `0017_boost_payment_system.sql`
18. `0018_analytics_events.sql`
19. `0019_analytics_query_optimization.sql`

สำหรับแต่ละไฟล์:
1. ไปที่เมนู **SQL Editor** (ไอคอนรูปเทอร์มินัลด้านซ้าย)
2. กด **New query**
3. เปิดไฟล์ตามลำดับเลข → คัดลอกทั้งหมด → วางในช่อง SQL Editor
4. กด **Run** (หรือ Ctrl+Enter)
5. ควรเห็นข้อความ "Success. No rows returned" ก่อนไปไฟล์ถัดไป — ถ้า error ให้อ่านข้อความ error แล้วแจ้งกลับมาได้ ส่วนใหญ่มักเกิดจากรันซ้ำ (ตาราง/policy มีอยู่แล้ว)

> โปรเจกต์ Supabase ใหม่ทั้งหมด: รันทั้ง 19 ไฟล์ตามลำดับ
> โปรเจกต์ที่เคยรันเฉพาะ `schema.sql` เดิมไปแล้ว (ก่อนมี migrations folder): ไฟล์ `0001` มีเนื้อหาเดียวกับ `schema.sql` เดิม ข้ามไปเริ่มที่ `0002` ได้เลย

### 2.3 ตรวจสอบว่าตารางถูกสร้างครบ
ไปที่เมนู **Table Editor** ควรเห็นตารางเหล่านี้: `profiles`, `properties`, `property_images`, `service_providers`, `service_provider_images`, `favorites`, `messages`, `reviews`, `notifications`, `districts`, `universities`, `loyalty_transactions`

### 2.4 ตั้งค่า Authentication
1. ไปที่เมนู **Authentication → Providers** → ตรวจสอบว่า **Email** เปิดใช้งานอยู่ (เปิดเป็นค่าเริ่มต้นอยู่แล้ว)
2. ไปที่ **Authentication → URL Configuration**:
   - **Site URL**: ใส่โดเมนจริงที่จะใช้ เช่น `https://roomio.vercel.app` (จะได้ URL นี้หลังทำส่วนที่ 5 เสร็จ — ย้อนกลับมาใส่ทีหลังได้)
   - **Redirect URLs**: เพิ่ม `https://roomio.vercel.app/**` (ใส่ทั้งโดเมนจริงและ `http://localhost:3000/**` ไว้ด้วยสำหรับตอนพัฒนา)
   - ขั้นตอนนี้สำคัญมาก — ถ้าไม่ตั้ง ลิงก์ยืนยันอีเมล/ลิงก์รีเซ็ตรหัสผ่านจะพาไปที่ localhost แทนเว็บจริง

### 2.5 ตรวจสอบ Storage buckets
ไปที่เมนู **Storage** ควรเห็น 3 buckets ที่สร้างจาก `0001_initial_schema.sql` แล้ว: `property-images`, `provider-images`, `avatars` (ทั้งหมดตั้งเป็น public ไว้แล้ว — สิทธิ์เขียนไฟล์ของแต่ละ bucket มาจาก migrations `0003` และ `0010` ตามลำดับ)

### 2.6 คัดลอกค่า API keys
ไปที่ **Project Settings (ไอคอนเฟือง) → API** แล้วคัดลอกเก็บไว้ 3 ค่านี้ (จะใช้ในส่วนที่ 6):
- **Project URL** → นี่คือ `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → นี่คือ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → นี่คือ `SUPABASE_SERVICE_ROLE_KEY` (เก็บเป็นความลับ ห้ามเผยแพร่หรือใส่ในโค้ดฝั่ง client เด็ดขาด)

---

## ส่วนที่ 3: ตั้งค่า Google Maps API

1. เข้า console.cloud.google.com → สร้างโปรเจกต์ใหม่ (หรือใช้โปรเจกต์เดิม)
2. เมนูซ้าย → **APIs & Services → Library** → ค้นหา **Maps JavaScript API** → กด **Enable**
3. เมนูซ้าย → **APIs & Services → Credentials** → **Create Credentials → API key**
4. คัดลอก API key ที่ได้ (นี่คือ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
5. **สำคัญ (ความปลอดภัย):** กดที่ key ที่สร้าง → **Application restrictions** → เลือก **HTTP referrers** → เพิ่มโดเมนจริง เช่น `https://roomio.vercel.app/*` — ป้องกันคนอื่นแอบใช้ API key ของคุณ
6. ถ้าเพิ่งเปิดบัญชี Google Cloud ใหม่ อาจต้องผูกบัตรเครดิตเพื่อเปิดใช้ billing (Maps API มี free tier ให้ใช้ฟรีในโควต้าที่กำหนด แต่ต้องผูกบัตรไว้ก่อน)

---

## ส่วนที่ 4: เตรียมโค้ดขึ้น GitHub

1. แตกไฟล์ zip ที่ได้รับ จะได้โฟลเดอร์ `roomio`
2. เปิด terminal ในโฟลเดอร์นั้น รันคำสั่ง:
   ```bash
   git init
   git add .
   git commit -m "Initial Roomio codebase"
   ```
3. ไปที่ github.com → **New repository** → ตั้งชื่อ เช่น `roomio` → **ห้ามติ๊ก** "Add README" (เพราะมีอยู่แล้ว) → **Create repository**
4. รันคำสั่งตามที่ GitHub แสดง (หน้า "…or push an existing repository") ปกติจะเป็นประมาณนี้:
   ```bash
   git remote add origin https://github.com/<username>/roomio.git
   git branch -M main
   git push -u origin main
   ```

---

## ส่วนที่ 5: Deploy ขึ้นโฮสต์

### 5.1 วิธีแนะนำ: Vercel (ง่ายที่สุดสำหรับ Next.js)

1. เข้า vercel.com → ล็อกอินด้วยบัญชี GitHub
2. กด **Add New → Project**
3. เลือก repository `roomio` ที่เพิ่ง push ไป → กด **Import**
4. Vercel จะตรวจจับว่าเป็น Next.js โปรเจกต์อัตโนมัติ ไม่ต้องตั้งค่า Build Command เพิ่ม
5. ก่อนกด Deploy ให้เปิดส่วน **Environment Variables** แล้วใส่ค่าจากส่วนที่ 2.6 และ 3:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (Project URL จาก Supabase) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon public key) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (service_role key) |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | (Google Maps API key) |
   | `NEXT_PUBLIC_SITE_URL` | `https://roomio.vercel.app` (หรือโดเมนที่ Vercel จะให้ — ดูได้หลัง deploy ครั้งแรก แล้วมาแก้ตรงนี้ทีหลังได้) |

6. กด **Deploy** — รอประมาณ 2-3 นาที
7. เสร็จแล้วจะได้ URL เช่น `https://roomio-xxxx.vercel.app`
8. **ย้อนกลับไปทำ**: เอา URL นี้ไปใส่ใน Supabase → Authentication → URL Configuration (ส่วนที่ 2.4) และใน Google Maps API restrictions (ส่วนที่ 3) แทนค่าชั่วคราวที่ใส่ไว้ก่อนหน้า

### 5.2 ทางเลือก: Cloudflare Pages (ตาม tech stack เดิมในสเปก)

Next.js บน Cloudflare Pages ต้องใช้ adapter พิเศษเพราะ Cloudflare ใช้ Edge Runtime:

```bash
npm install -D @cloudflare/next-on-pages
```

เพิ่ม script ใน `package.json`:
```json
"pages:build": "npx @cloudflare/next-on-pages"
```

ใน Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**:
- Build command: `npx @cloudflare/next-on-pages`
- Build output directory: `.vercel/output/static`
- ใส่ Environment Variables ชุดเดียวกับตารางในข้อ 5.1

**หมายเหตุ:** เส้นทางนี้อาจต้องแก้โค้ดบางจุดที่ใช้ Node.js API ที่ Edge Runtime ไม่รองรับ (เช่นบาง library) — ถ้าเจอ error ตอน build ให้ส่ง error message มาได้ จะช่วยแก้ให้ทีละจุด นี่คือเหตุผลที่แนะนำ Vercel เป็นทางหลักเพราะไม่มีปัญหานี้

---

## ส่วนที่ 6: ตรวจสอบไฟล์ .env (สำหรับรันทดสอบในเครื่องตัวเองด้วย)

ถ้าต้องการรันทดสอบในเครื่องตัวเองก่อน/ระหว่างพัฒนาเพิ่มเติม:
```bash
cp .env.example .env.local
```
แล้วใส่ค่าเดียวกับตารางในส่วนที่ 5.1 (ยกเว้น `NEXT_PUBLIC_SITE_URL` ใช้ `http://localhost:3000`) จากนั้น:
```bash
npm install
npm run dev
```

---

## ส่วนที่ 7: เพิ่มข้อมูลชุดแรก (เพราะยังไม่มี Owner Dashboard)

### 7.1 สร้างแอดมินคนแรก
1. เปิดเว็บที่ deploy แล้ว → สมัครสมาชิกปกติ 1 บัญชี (จะได้ role เป็น `user`)
2. ไปที่ Supabase → **Table Editor → profiles** → หาแถวที่เป็นบัญชีที่เพิ่งสมัคร
3. แก้ค่าคอลัมน์ `role` จาก `user` เป็น `admin` → กด save
4. ล็อกอินใหม่ (หรือ refresh) → ตอนนี้เข้า `/dashboard/admin` ได้แล้ว

### 7.2 เพิ่มที่พัก/ผู้ให้บริการรายแรก
ยังไม่มีหน้าให้ owner ลงประกาศเอง ให้แอดมินเพิ่มผ่าน Supabase โดยตรงชั่วคราว:
1. **Table Editor → properties → Insert row** — กรอกข้อมูล (ต้องมี `owner_id` เป็น uuid ของ user บัญชีใดบัญชีหนึ่งในตาราง `profiles`, `district_id` อ้างอิงจากตาราง `districts`, ตั้ง `status` เป็น `approved` เพื่อให้ขึ้นแสดงหน้าเว็บทันที)
2. **Table Editor → property_images → Insert row** — ต้องอัปโหลดรูปเข้า Storage bucket `property-images` ก่อน (ผ่านเมนู Storage) แล้วเอา path มาใส่ในคอลัมน์ `storage_path`
3. ทำแบบเดียวกันสำหรับ `service_providers` / `service_provider_images`

> ขั้นตอนนี้ค่อนข้างมือ (manual) — Owner Dashboard ที่จะสร้างใน Phase ถัดไปจะทำให้ขั้นตอนนี้ง่ายขึ้นมากผ่านฟอร์มในเว็บแทน

---

## ส่วนที่ 8: Checklist ทดสอบก่อนเปิดใช้งานจริง

ทดสอบทีละข้อบนเว็บที่ deploy แล้ว (ไม่ใช่ localhost):

- [ ] หน้าแรกโหลดได้ ไม่ error
- [ ] สมัครสมาชิกได้ → ได้รับอีเมลยืนยัน → คลิกลิงก์แล้วพากลับมาเว็บจริง (ไม่ใช่ localhost)
- [ ] เข้าสู่ระบบได้
- [ ] "ลืมรหัสผ่าน" → ได้รับอีเมล → ตั้งรหัสผ่านใหม่ได้สำเร็จ
- [ ] ค้นหาที่พัก/กรองตัวกรองได้
- [ ] หน้ารายละเอียดที่พักแสดงแผนที่ Google Maps ได้ (ถ้าไม่ขึ้น เช็ค API key restriction ในส่วนที่ 3.5)
- [ ] กดหัวใจ favorite ได้ (ต้องล็อกอินก่อน)
- [ ] เข้า `/profile` เห็นการ์ดสมาชิกและแต้ม
- [ ] เข้า `/dashboard/admin` ด้วยบัญชี admin ได้ เห็นภาพรวม/จัดการผู้ใช้/คิวอนุมัติ
- [ ] เข้า `/support` เห็น QR code ค่าน้ำชาแสดงถูกต้อง
- [ ] ทดสอบเปิดจากมือถือ → กด "Add to Home Screen" ได้ (PWA) — **หมายเหตุ:** ต้องเพิ่มไฟล์ไอคอนจริงที่ `public/icons/icon-192.png` และ `icon-512.png` ก่อน ไม่งั้นไอคอนแอปจะไม่ขึ้น (ตอนนี้ยังเป็นไฟล์ที่อ้างถึงไว้เฉยๆ ยังไม่มีไฟล์จริง)

---

## สรุปลำดับการทำงานแบบย่อ

```
1. สมัคร Supabase → สร้างโปรเจกต์ → รันไฟล์ทั้งหมดใน `supabase/migrations/` ตามลำดับเลข 0001-0011 → เก็บ API keys
2. สมัคร Google Cloud → เปิด Maps JavaScript API → สร้าง API key
3. Push โค้ดขึ้น GitHub
4. เชื่อม GitHub เข้า Vercel → ใส่ environment variables → Deploy
5. เอา URL จริงกลับไปตั้งใน Supabase (Redirect URLs) และ Google Maps (referrer restriction)
6. สมัครสมาชิก 1 บัญชี → ตั้งเป็น admin ผ่าน Supabase Table Editor
7. เพิ่มข้อมูลที่พัก/บริการชุดแรกผ่าน Owner Dashboard (`/dashboard/owner`) หรือ Provider Dashboard (`/dashboard/provider`)
8. ไล่เช็ค checklist ส่วนที่ 8
```

ถ้าติดขั้นตอนไหน หรือเจอ error ระหว่างทำ ส่ง error message มาได้เลย จะช่วยไล่แก้ให้ทีละจุด
