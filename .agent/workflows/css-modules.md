---
description: Create CSS Module files alongside React components
---

# CSS Modules Convention

When creating new React components in `frontend_admin`, `frontend_user`, or `shared`:

1. **Always create a CSS Module file** next to the component:
   - Component: `ComponentName.tsx`
   - Styles: `ComponentName.module.css`

2. **Color palette** (from Abra branding):
   ```css
   /* Primary colors */
   --color-primary: #141e3e;        /* Dark blue - buttons, primary actions */
   --color-primary-hover: #1a2b53;  /* Lighter blue - hover states */
   
   /* Backgrounds */
   --color-bg-white: white;
   --color-shadow: rgba(0, 0, 0, 0.1);
   ```

3. **Import in component**:
   ```tsx
   import styles from './ComponentName.module.css';
   // Use: className={styles.container}
   ```

4. **Prefer CSS :hover** over `onMouseEnter`/`onMouseLeave` handlers

5. **RTL support**: Use `dir="rtl"` on container elements for Hebrew text
