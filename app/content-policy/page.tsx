export const metadata = { title: "กฎการลงประกาศ" };

export default function ContentPolicyPage() {
  return (
    <div className="container-app max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-ink-900">กฎการลงประกาศ</h1>
      <p className="mt-1 text-sm text-ink-500">มีผลบังคับใช้ตั้งแต่: 20 กรกฎาคม 2569</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-700">
        เพื่อรักษาคุณภาพและความน่าเชื่อถือของแพลตฟอร์ม Roomio ผู้ใช้งานที่ลงประกาศที่พักหรือบริการ
        ต้องปฏิบัติตามกฎดังต่อไปนี้
      </p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-ink-700">
        <section>
          <h2 className="text-lg font-semibold text-ink-900">1. หลักการทั่วไป</h2>
          <p className="mt-2">
            ทุกประกาศที่ลงบน Roomio ต้องเป็นข้อมูลจริง ถูกต้อง และเป็นปัจจุบัน ทั้งในส่วนของที่พัก ผู้ให้บริการ
            รูปภาพ และราคา
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink-900">2. สิ่งที่ห้ามลงประกาศโดยเด็ดขาด</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>ห้องหรือที่พักที่ไม่มีอยู่จริง</strong> — ประกาศที่พักปลอมหรือไม่มีตัวตนจริง</li>
            <li><strong>ราคาไม่ตรงกับความเป็นจริง</strong> — การตั้งราคาล่อใจแล้วเรียกเก็บราคาจริงที่สูงกว่าตอนติดต่อ</li>
            <li>
              <strong>รูปภาพไม่ตรงกับสถานที่จริง</strong> — ใช้รูปจากที่อื่น รูปตัดต่อ หรือรูปที่ทำให้เข้าใจผิดเกี่ยวกับสภาพจริงของที่พัก
            </li>
            <li><strong>ผู้ให้บริการที่ไม่มีตัวตนจริง</strong> หรือไม่มีความสามารถให้บริการตามที่กล่าวอ้าง</li>
            <li><strong>เนื้อหาที่ผิดกฎหมาย</strong> สินค้าหรือบริการที่ผิดกฎหมาย หรือส่งเสริมกิจกรรมผิดกฎหมาย</li>
            <li><strong>ภาพหรือข้อความที่ไม่เหมาะสม</strong> ลามกอนาจาร สร้างความเสื่อมเสีย หรือละเมิดสิทธิผู้อื่น</li>
            <li><strong>ข้อมูลติดต่อปลอม</strong> หรือใช้ตัวตนของผู้อื่นโดยไม่ได้รับอนุญาต</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink-900">3. ความรับผิดชอบของเจ้าของประกาศ</h2>
          <p className="mt-2">เจ้าของที่พักและผู้ให้บริการที่ลงประกาศบน Roomio มีหน้าที่:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>อัปเดตสถานะประกาศให้เป็นปัจจุบัน (เช่น ห้องว่าง/เต็ม)</li>
            <li>ตอบกลับผู้สนใจตามความเหมาะสม</li>
            <li>ไม่เรียกเก็บค่าใช้จ่ายเพิ่มเติมที่ไม่ได้ระบุไว้ในประกาศโดยไม่แจ้งล่วงหน้า</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink-900">4. กระบวนการตรวจสอบ</h2>
          <p className="mt-2">
            ประกาศทุกรายการจะถูกตรวจสอบโดยทีมงานก่อนเผยแพร่สู่สาธารณะ Roomio
            ขอสงวนสิทธิ์ในการปฏิเสธหรือระงับประกาศที่ไม่เป็นไปตามกฎนี้
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink-900">5. บทลงโทษเมื่อฝ่าฝืน</h2>
          <p className="mt-2 font-medium text-ink-900">
            กรณีทั่วไป (เช่น ข้อมูลไม่ครบถ้วน รูปภาพไม่ชัดเจน)
          </p>
          <p className="mt-1">ทีมงานจะแจ้งเตือนและให้โอกาสแก้ไขก่อน</p>
          <p className="mt-3 font-medium text-ink-900">
            กรณีร้ายแรง (เช่น ข้อมูลเท็จ การหลอกลวง เนื้อหาผิดกฎหมาย)
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>ลบประกาศทันทีโดยไม่แจ้งล่วงหน้า</li>
            <li>ระงับบัญชีผู้ใช้งานชั่วคราวหรือถาวร ขึ้นอยู่กับความร้ายแรง</li>
            <li>ในกรณีที่เข้าข่ายการกระทำผิดกฎหมาย Roomio อาจดำเนินการแจ้งหน่วยงานที่เกี่ยวข้อง</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink-900">6. การอุทธรณ์</h2>
          <p className="mt-2">
            หากผู้ใช้งานเห็นว่าประกาศหรือบัญชีของตนถูกลบ/ระงับโดยไม่เป็นธรรม สามารถติดต่อขอชี้แจงได้ผ่านหน้า{" "}
            <a href="/support" className="font-medium text-primary-600 underline">
              ติดต่อเรา
            </a>{" "}
            ทีมงานจะพิจารณาและตอบกลับภายในระยะเวลาอันสมควร
          </p>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-ink-100/40 p-4">
          <p>
            กฎการลงประกาศนี้เป็นส่วนหนึ่งของ{" "}
            <a href="/terms" className="font-medium text-primary-600 underline">
              ข้อตกลงการใช้งาน
            </a>{" "}
            การฝ่าฝืนถือเป็นการฝ่าฝืนข้อตกลงการใช้งานด้วยเช่นกัน
          </p>
        </section>
      </div>
    </div>
  );
}
