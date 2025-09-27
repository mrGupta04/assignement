# 🎮 Playable Ads SaaS – Backend Prototype

A backend prototype for a **Playable Ads SaaS** platform, built with **TypeScript**, **Node.js**, **Express**, **Prisma**, **PostgreSQL**, **Redis/BullMQ**, and **FFmpeg**.

This backend allows users to:

- Manage projects  
- Upload assets (images/videos)  
- Enqueue asynchronous video rendering jobs  
- Log analytics events (`play`, `click`, `impression`)  
- Authenticate users with JWT  

---

## 🚀 Features

### 🔗 API + Database
- `POST /projects` → Create a new project  
- `POST /projects/:id/assets` → Upload an asset (image/video)  
- `POST /projects/:id/render` → Enqueue a render job  
- `GET /jobs/:id` → Check job status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)  
- `POST /analytics` → Log analytics events (`play`, `click`, `impression`)  

Database schema is managed with **Prisma ORM**.  
Models: `User`, `Project`, `Asset`, `Job`, `Analytics`

---

### ⚙️ Job Queue
- **BullMQ + Redis** handle asynchronous video rendering  
- Workers simulate video rendering using **FFmpeg**:
  - Overlay text on video  
  - Compress videos  
- Rendered videos stored in `/outputs` folder  

---

### 📊 Analytics Logging
API accepts analytics events:
```json
{
  "projectId": "project_id_here",
  "eventType": "click"
}
```

---

## ✨ Bonus Features
- Docker support – run backend anywhere  
- Swagger/OpenAPI docs at `/api-docs`  
- JWT Authentication for secure endpoints  

---

## 🛠️ Tech Stack
- Node.js + Express  
- Prisma ORM + PostgreSQL  
- Redis + BullMQ  
- FFmpeg (video processing)  
- Docker (containerization)  
- Swagger (API documentation)  
- JWT Authentication  

---

## 📦 Prerequisites
- Node.js >= 18  
- PostgreSQL  
- Redis  
- Docker (optional but recommended)  

---

## ⚡ Setup Instructions

1. **Clone Repository**
```bash
git clone https://github.com/mrGupta04/assignement.git
cd assignement
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Variables**  
Create `.env` file in project root:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/playable_ads
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret
PORT=3000
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
```

4. **Prisma Setup**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Start Redis & Postgres**  
Using Docker Compose:
```bash
docker-compose up -d
```

6. **Run Backend**
```bash
node src/server.js
```
Server will start at → [http://localhost:3000](http://localhost:3000)

7. **API Documentation**  
Swagger docs available at:  
👉 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 📂 Project Structure
```
src/
├── controllers/       # Express controllers
├── services/          # Business logic
├── routes/            # API routes
├── workers/           # Job queue workers
├── utils/             # Utilities (Swagger setup, etc.)
├── types/             # TypeScript types/interfaces
prisma/
├── schema.prisma      # Database schema
uploads/                # Uploaded files
outputs/                # Rendered videos
```

---

## 📡 API Endpoints

### Projects

**Create Project**  
`POST /api/projects`
```json
{
  "title": "My First Ad",
  "description": "Playable video ad"
}
```

**Upload Asset**  
`POST /api/projects/:id/assets`  
Upload a file via `multipart/form-data`.

**Enqueue Render**  
`POST /api/projects/:id/render`

### Jobs

**Check Job Status**  
`GET /api/jobs/:id`

### Analytics

**Log Event**  
`POST /api/analytics`
```json
{
  "projectId": "project_id_here",
  "eventType": "click"
}
```

---

## 🐳 Docker Support

**Build Docker Image**
```bash
docker build -t playable-ads-backend .
```

**Run with Docker Compose**
```bash
docker-compose up -d
```
This starts backend, PostgreSQL, and Redis.  
Volumes persist `uploads/` and `outputs/`.

---

## 📝 Notes
- Ensure Redis and PostgreSQL are running before backend starts  
- Assets stored in `/uploads`  
- Rendered outputs in `/outputs`  
- Jobs processed asynchronously via BullMQ  
