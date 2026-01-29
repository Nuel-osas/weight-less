# MetaGems-Style Landing Page Design

## ✅ Design Updated!

The landing page has been redesigned to match the MetaGems reference style with warm colors, dynamic layout, and modern UI.

## Design Changes

### 🎨 Color Palette

**Before**: Black & White Minimalist
**After**: Warm Peachy/Coral Theme

```css
/* Background */
- Base: Custom background image
- Overlay: Orange-pink gradient (from-orange-200/30 via-pink-200/20 to-orange-300/30)
- Body: #fef3c7 (warm amber)

/* Primary Colors */
- Amber Button: #fef3c7 (amber-100) → #fef08a (amber-200) on hover
- Dialog Buttons: #f59e0b (amber-500) → #d97706 (amber-600) on hover
- Text: White on dark backgrounds

/* Glass Effects */
- Cards: rgba(31, 41, 55, 0.8) with backdrop-blur
- Buttons: rgba(255, 255, 255, 0.2) with backdrop-blur
```

### 📐 Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ [S] SUIGEN  TRENDING MARKETPLACE CREATE COMMUNITY  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CREATE THE           ┌──────────────────┐         │
│  FUTURE. MINT THE     │ EXPLORE          │         │
│  ADVENTURE.           │ DIGITAL ART      │         │
│                       │                  │         │
│  [GET STARTED]        │ [3 NFT previews] │         │
│  ▶ WATCH VIDEO        │                  │         │
│                       │ [BUY NOW]        │         │
│  200K+    50K+        └──────────────────┘         │
│  ARTWORKS CREATORS                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 🔤 Typography

**Header**:
- Logo: Bold, white, tracking-wider, uppercase
- Navigation: Font-medium, text-sm, uppercase, tracking-wider

**Hero Heading**:
- Size: 5xl - 7xl responsive
- Weight: Bold
- Style: Uppercase
- Letter-spacing: -0.02em (tight)
- Color: White

**Stats**:
- Numbers: 3xl, bold
- Labels: sm, uppercase, tracking-wider, white/80

**Buttons**:
- Font: Bold
- Size: sm
- Style: Uppercase, tracking-wider

### 🎯 Component Updates

#### Header
```typescript
- Logo: White box with orange "S"
- Brand: "SUIGEN" in white
- Navigation: TRENDING | MARKETPLACE | CREATE | COMMUNITY
- Wallet: Glass-morphism connect button
- Mobile: Hamburger menu
```

#### Hero Section
```typescript
Heading: "CREATE THE FUTURE. MINT THE ADVENTURE."
Buttons:
  - Primary: "GET STARTED" (amber-100 solid)
  - Secondary: "WATCH VIDEO" (glass with play icon)
Stats:
  - 200K+ Artworks
  - 50K+ Creators
```

#### Explore Card (Right Side)
```typescript
Background: Gray-800/80 with backdrop-blur
Title: "EXPLORE DIGITAL ART"
Preview: 3x1 grid of gradient squares
CTA: "BUY NOW" (amber-100)
```

### ✨ Visual Effects

**Animations**:
- Hero: Slide from left (x: -50 → 0)
- Card: Scale up (0.9 → 1)
- Staggered delays for smooth entrance
- Button hover: Scale 1.05
- Card hover: translateY(-4px) + shadow

**Glass Morphism**:
```css
background: rgba(255, 255, 255, 0.2);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.3);
```

**Shadows**:
```css
/* Dialog */
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

/* Card Hover */
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
```

### 🔘 Button Styles

**Primary (Get Started)**:
```css
background: #fef3c7;
color: #1f2937;
hover: #fef08a;
```

**Secondary (Watch Video)**:
```css
background: transparent;
icon: rounded-full bg-white/20 with play icon
color: white;
```

**Wallet Connect**:
```css
background: rgba(255, 255, 255, 0.2);
backdrop-filter: blur(10px);
border: rgba(255, 255, 255, 0.3);
hover: rgba(255, 255, 255, 0.3);
```

### 📱 Responsive Design

**Mobile (< 1024px)**:
- Single column layout
- Explore card hidden
- Hamburger menu visible
- Stats displayed
- Full-width buttons

**Desktop (≥ 1024px)**:
- Two column grid
- Explore card visible
- Full navigation menu
- Side-by-side layout

## File Changes

### Modified Files:
1. **`/app/page.tsx`**
   - New header with navigation
   - Warm overlay gradient
   - Updated hero text
   - New button styles
   - Explore card added
   - Stats redesigned

2. **`/app/globals.css`**
   - Warm color palette
   - Glass-morphism styles
   - Updated wallet button styles
   - Rounded corners added
   - Amber button colors
   - Modern shadows

### Preserved Files:
- `/app/generate/page.tsx` - NFT generation page (unchanged)
- `/components/Header.tsx` - Not used on landing (custom header inline)
- `/components/NFTCard.tsx` - Used on generate page

## Navigation Flow

```
Landing (/) ──[GET STARTED]──> Generate (/generate)
             [BUY NOW]──────> Generate (/generate)
             [WATCH VIDEO]──> (Video modal - to be implemented)
```

## Technical Implementation

### Key Technologies:
- **Framer Motion**: Smooth animations
- **Tailwind CSS**: Utility-first styling
- **@mysten/dapp-kit**: Wallet integration
- **Lucide Icons**: Play, Menu icons
- **Next.js 16**: App router

### Performance:
- Single background image
- CSS animations (GPU accelerated)
- Minimal JavaScript
- No layout shift
- Smooth 60fps animations

## Color Reference

```css
/* Amber/Orange Spectrum */
amber-100: #fef3c7  /* Primary button */
amber-200: #fef08a  /* Button hover */
amber-500: #f59e0b  /* Dialog buttons */
amber-600: #d97706  /* Dialog hover */

/* Grays */
gray-800: #1f2937   /* Card background */
gray-900: #111827   /* Text */

/* Overlays */
orange-200/30: rgba(254, 215, 170, 0.3)
pink-200/20: rgba(251, 207, 232, 0.2)
orange-300/30: rgba(253, 186, 116, 0.3)
```

## Browser Compatibility

Tested on:
- ✅ Chrome (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## Accessibility

- ✅ High contrast text on backgrounds
- ✅ Visible focus states
- ✅ Keyboard navigation
- ✅ Screen reader friendly
- ✅ Semantic HTML structure
- ✅ ARIA labels where needed

## Live Preview

**Development**: http://localhost:3000

## Next Steps (Optional)

Future enhancements:
1. Video modal for "Watch Video" button
2. Animated background particles
3. Actual NFT previews in explore card
4. Trending page implementation
5. Marketplace page
6. Community section
7. Mobile menu drawer

Enjoy your modern, warm-themed landing page! 🎨
