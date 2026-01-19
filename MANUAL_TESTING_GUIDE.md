# Manual Testing Guide - Frontend & Backend Integration

## Prerequisites

### 1. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Expected output:
- `✅ Database configured on port X (from .env)`
- `Server is running on port 3000`

**Terminal 2 - User Frontend:**
```bash
cd frontend_user
npm run dev
```
Expected output:
- Server running (usually on `http://localhost:5173`)

**Terminal 3 - Admin Frontend:**
```bash
cd frontend_admin
npm run dev
```
Expected output:
- Server running (usually on `http://localhost:5174`)

---

## Test Credentials

From seed data (`backend/prisma/seed.ts`):
- **Admin:** `admin@timereporting.com` / `Password123`
- **Worker:** `john.doe@timereporting.com` / `Password123`
- **Worker:** `jane.smith@timereporting.com` / `Password123`
- **Worker:** `david.cohen@timereporting.com` / `Password123`

---

## Test Cases

### ✅ Test 1: Admin App - Login Flow

**Steps:**
1. Open browser to admin frontend URL (e.g., `http://localhost:5174`)
2. **Expected:** Login page displays with:
   - `abraLogo.png` image at the top
   - Welcome text: "ברוכים הבאים למערכת הניהול של אברא 👋"
   - "התחברות" button (color `#141e3e`)
   - RTL layout (right-to-left)
   - Background image: `log_in_backround.png`
   - **Form fields should be HIDDEN initially**

3. Click the "התחברות" button
   - **Expected:** Form fields appear (email and password inputs)

4. Enter admin credentials:
   - Email: `admin@timereporting.com`
   - Password: `Password123`

5. Click "התחברות" to submit

**Expected Results:**
- ✅ Login request sent to `POST http://localhost:3000/api/auth/login`
- ✅ Success response with `token`, `expiresInHours: 24`, and `user` object
- ✅ Token and user info saved to `localStorage`
- ✅ Redirect to `/client-management` page
- ✅ No error notifications shown

**Verify in Browser DevTools:**
- **Network Tab:** Check `/api/auth/login` request:
  - Status: `200 OK`
  - Response body contains `token` and `user` object
- **Application Tab → Local Storage:**
  - `token`: JWT token string
  - `user`: JSON object with user data

---

### ✅ Test 2: User App - Login Flow

**Steps:**
1. Open browser to user frontend URL (e.g., `http://localhost:5173`)
2. **Expected:** Login page displays with:
   - Background image: `log_in_backround.png`
   - White rounded box containing:
     - `login_mobile.png` image
     - "התחברות" button below the image
   - RTL layout
   - **Form fields should be HIDDEN initially**

3. Click the "התחברות" button
   - **Expected:** Form fields appear (email and password inputs)

4. Enter worker credentials:
   - Email: `john.doe@timereporting.com`
   - Password: `Password123`

5. Click "התחברות" to submit

**Expected Results:**
- ✅ Login request sent to `POST http://localhost:3000/api/auth/login`
- ✅ Success response with token and user info
- ✅ Token and user saved to `localStorage`
- ✅ Redirect to `/month-history` page
- ✅ No error notifications shown

---

### ✅ Test 3: Authentication Persistence

**Steps:**
1. Complete Test 1 or Test 2 (login successfully)
2. Refresh the page (F5)
3. **Expected:** 
   - ✅ User remains logged in
   - ✅ Still on protected route (`/client-management` or `/month-history`)
   - ✅ No redirect to `/login`

**Verify:**
- Check `localStorage` still contains `token` and `user`
- Check browser console for no authentication errors

---

### ✅ Test 4: Protected Route Access (Unauthenticated)

**Steps:**
1. Open a new incognito/private browser window
2. Navigate directly to:
   - Admin: `http://localhost:5174/client-management`
   - User: `http://localhost:5173/month-history`
3. **Expected:**
   - ✅ Redirected to `/login` page
   - ✅ Cannot access protected route without authentication

---

### ✅ Test 5: Invalid Credentials (400 Validation Error)

**Steps:**
1. Go to login page (admin or user app)
2. Click "התחברות" button to show form
3. Leave fields empty and submit
4. **Expected:**
   - ✅ Form validation errors appear:
     - "כתובת אימייל נדרשת" (Email required)
     - "סיסמה נדרשת" (Password required)
   - ✅ Errors shown using `form.setFieldError()` (inline form errors)
   - ✅ No API request sent

---

### ✅ Test 6: Invalid Credentials (401 Unauthorized)

**Steps:**
1. Go to login page
2. Click "התחברות" button to show form
3. Enter invalid credentials:
   - Email: `wrong@email.com`
   - Password: `wrongpassword`
4. Submit form
5. **Expected:**
   - ✅ API request sent to `/api/auth/login`
   - ✅ Backend returns `401 Unauthorized`
   - ✅ Error notification shown using `notifications.show()` (Mantine toast)
   - ✅ Error message: "Invalid credentials" or similar
   - ✅ User stays on login page
   - ✅ No redirect

**Verify in Browser DevTools:**
- **Network Tab:** `/api/auth/login` request:
  - Status: `401 Unauthorized`
  - Response body: `{ error: "UNAUTHORIZED", message: "Invalid credentials" }`

---

### ✅ Test 7: Wrong Password (401)

**Steps:**
1. Go to login page
2. Click "התחברות" button
3. Enter correct email but wrong password:
   - Email: `admin@timereporting.com`
   - Password: `WrongPassword123`
4. Submit
5. **Expected:**
   - ✅ `401 Unauthorized` response
   - ✅ Error notification shown
   - ✅ No redirect

---

### ✅ Test 8: Inactive User (401)

**Note:** This requires manually deactivating a user in the database first.

**Steps:**
1. In database, set `active = false` for `admin@timereporting.com`
2. Try to login with that account
3. **Expected:**
   - ✅ `401 Unauthorized` response
   - ✅ Error message: "Account is inactive"
   - ✅ Error notification shown

---

### ✅ Test 9: Admin Accessing User App

**Steps:**
1. Login to **Admin App** with `admin@timereporting.com`
2. Open **User App** in same browser (different tab)
3. Navigate to `/month-history`
4. **Expected:**
   - ✅ If using same `localStorage`, admin user should be able to access (if `ProtectedRoute` doesn't check `requireAdmin`)
   - ✅ Or redirect to login if different `localStorage` domains

**Note:** This depends on your `ProtectedRoute` implementation for user app.

---

### ✅ Test 10: Worker Accessing Admin App

**Steps:**
1. Login to **User App** with `john.doe@timereporting.com` (worker)
2. Open **Admin App** in same browser
3. Navigate to `/client-management`
4. **Expected:**
   - ✅ `ProtectedRoute` with `requireAdmin={true}` should block access
   - ✅ Redirect to `/login` or show error
   - ✅ Error notification if implemented

---

### ✅ Test 11: Logout Functionality

**Steps:**
1. Login successfully (admin or user)
2. Call logout (if logout button/functionality exists)
   - Or manually clear `localStorage`:
     ```javascript
     localStorage.removeItem('token');
     localStorage.removeItem('user');
     ```
3. Refresh page
4. **Expected:**
   - ✅ Redirected to `/login` page
   - ✅ Cannot access protected routes

---

### ✅ Test 12: Backend Error Handling

**Steps:**
1. Stop the backend server
2. Try to login from frontend
3. **Expected:**
   - ✅ Network error (connection refused)
   - ✅ Error notification shown
   - ✅ User-friendly error message

---

### ✅ Test 13: Form Field Validation (Frontend)

**Steps:**
1. Go to login page
2. Click "התחברות" button
3. Enter invalid email format:
   - Email: `notanemail`
   - Password: `Password123`
4. Submit
5. **Expected:**
   - ✅ Email validation error (if email format validation exists)
   - ✅ Form prevents submission

---

### ✅ Test 14: JWT Token Expiration (Future)

**Note:** Token expires in 24 hours. To test immediately, you'd need to modify backend to use shorter expiration.

**Steps:**
1. Login successfully
2. Wait for token to expire (or manually modify token in `localStorage` to be expired)
3. Try to access protected route
4. **Expected:**
   - ✅ Backend should reject expired token (if `authMiddleware` checks expiration)
   - ✅ Frontend should redirect to login

---

## Checklist Summary

- [ ] Admin login page displays correctly (logo, welcome text, button)
- [ ] User login page displays correctly (background, mobile image, button)
- [ ] Form fields hidden initially, appear after button click
- [ ] RTL layout works correctly
- [ ] Admin login redirects to `/client-management`
- [ ] User login redirects to `/month-history`
- [ ] Token and user saved to `localStorage`
- [ ] Authentication persists on page refresh
- [ ] Protected routes redirect unauthenticated users
- [ ] Form validation errors show inline
- [ ] 401 errors show as notifications (toast)
- [ ] Invalid credentials show error notification
- [ ] Wrong password shows error notification
- [ ] Inactive user shows error notification
- [ ] Admin cannot access user routes (if implemented)
- [ ] Worker cannot access admin routes
- [ ] Logout clears authentication
- [ ] Network errors handled gracefully

---

## Common Issues to Watch For

1. **CORS Errors:** Check backend has `cors()` middleware enabled
2. **Port Mismatch:** Ensure frontend API client points to correct backend URL (`http://localhost:3000`)
3. **Token Storage:** Verify token is saved correctly in `localStorage`
4. **Redirect Loops:** Check `ProtectedRoute` logic doesn't cause infinite redirects
5. **RTL Layout:** Verify Hebrew text displays correctly right-to-left
6. **Image Loading:** Check browser console for 404 errors on images
7. **Form State:** Verify form fields show/hide correctly

---

## Quick Debug Commands

**Check backend is running:**
```bash
curl http://localhost:3000/health
```

**Check database connection:**
```bash
# In backend directory
npx prisma studio
```

**Clear localStorage (in browser console):**
```javascript
localStorage.clear();
```

**Check token in localStorage:**
```javascript
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('user')));
```
