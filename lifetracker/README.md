# LifeTracker — Personal Life Dashboard

A full-stack personal activity tracker. Monitor your daily activities, health, schedule, and journal — live.

---

## Project Structure

```
lifetracker/
├── backend/         → Node.js + Express + MongoDB (deploy to Render)
└── frontend/        → React app (deploy to Netlify)
```

---

## ⚙️ Backend Setup (Render)

### 1. MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user (username + password)
4. Whitelist `0.0.0.0/0` under Network Access (allow all IPs)
5. Get your connection string:  
   `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/lifetracker`

### 2. Deploy to Render
1. Push the `backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Language**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   SESSION_SECRET=any_long_random_string_here
   FRONTEND_URL=https://your-app.netlify.app
   NODE_ENV=production
   ```
6. Deploy. Copy the Render URL (e.g. `https://lifetracker-api.onrender.com`)

---

## 🌐 Frontend Setup (Netlify)

### 1. Set API URL
Create `frontend/.env` file:
```
REACT_APP_API_URL=https://lifetracker-api.onrender.com
```

### 2. Deploy to Netlify
1. Push the `frontend/` folder to a GitHub repo
2. Go to [netlify.com](https://netlify.com) → New Site from Git
3. Settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variable:
   - `REACT_APP_API_URL` = your Render backend URL
5. Deploy!

The `netlify.toml` file handles React Router redirects automatically.

---

## 🔐 First Time Setup

1. Open your live website
2. Go to `/login` — click nowhere yet, the register page isn't public
3. To create the **first admin account**, POST to your backend directly:
   ```bash
   curl -X POST https://your-backend.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"yourname","email":"you@email.com","password":"yourpassword"}'
   ```
   (First user is automatically admin)
4. Now login normally at the website

### Adding More Users
- Login as admin → go to **Users** tab in sidebar
- Create new users from there
- They can login with their credentials — no public registration

---

## 📱 Features

### 🏠 Dashboard
- See your **currently active activity** live with elapsed time
- One tap to **switch activity** (ends previous, starts new)
- Add **interruptions/gaps** for things you forgot to switch for
- Today's full **timeline** with all activity blocks
- Today's **tasks** at a glance

### 📊 Analytics
- Weekly / monthly breakdown of time by activity
- Pie chart of activity categories
- Daily bar chart (Productive vs Health vs Leisure vs Personal)
- Top activities ranked with % of total time

### 📅 Schedule
- Add tasks with date, time, priority
- Tasks due today shown on Dashboard
- Check off completed tasks
- 30-day rolling view

### 💪 Health
- Log weight weekly (or whenever)
- Track height (set it once)
- BMI calculator
- Weight trend line chart
- History with +/- changes

### 📝 Notes / Journal
- Daily journal entry per day
- Mood tracker (5 levels)
- Tags for categorizing days
- Full-text + tag search

### 👤 Users (Admin only)
- Create new user accounts
- View all users
- Remove users

---

## 🕐 Session
- Login once per day — session lasts 24 hours
- Automatically stays logged in until session expires

---

## Local Development

```bash
# Backend
cd backend
npm install
cp .env.example .env  # fill in your values
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
# The proxy in package.json points to localhost:5000
npm start
```
