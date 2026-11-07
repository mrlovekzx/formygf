# 🎟️ Love Ticket

เว็บตั๋วพิเศษให้แฟน กด "ใช้ตั๋ว" แล้วตั๋วจะถูกฉีกและหายไป พร้อมหลังบ้านสำหรับสร้าง/ลบ/คืนตั๋ว

## รันในเครื่อง
```bash
npm install
ADMIN_PASSWORD=รหัสของคุณ npm start
```
- หน้าแฟน: http://localhost:3000
- หลังบ้าน: http://localhost:3000/admin.html

## อัพขึ้น GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/ชื่อคุณ/love-ticket.git
git push -u origin main
```

## ออนไลน์ให้แฟนใช้
GitHub Pages รันฝั่งหลังบ้าน (Node) ไม่ได้ ให้เอา repo นี้ไป deploy ที่ Render / Railway / Fly.io
- Build: `npm install`  Start: `npm start`
- ตั้ง Environment Variable `ADMIN_PASSWORD` เป็นรหัสของคุณ
- หมายเหตุ: ข้อมูลเก็บในไฟล์ `data/tickets.json` บนบางแพลตฟอร์มไฟล์จะรีเซ็ตเมื่อ redeploy ควรเปิดใช้ Persistent Disk
