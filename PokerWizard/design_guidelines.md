# Design Guidelines: Poker Analytics Platform

## Design Approach

**Selected Approach:** Design System (Material Design) with Analytics Dashboard Focus

**Justification:** This is a data-intensive, utility-focused application requiring clear information hierarchy, professional credibility, and efficient data visualization. Material Design provides excellent patterns for dashboards, data display, and progressive disclosure.

**Reference Inspiration:** GTO Wizard (clean data presentation), PokerTracker (professional analytics), Linear (modern dashboard aesthetics)

**Key Design Principles:**
1. Data clarity above decoration
2. Professional credibility through restraint
3. Clear feature tier visibility (free vs premium)
4. Efficient task completion
5. Portuguese-first experience

## Core Design Elements

### A. Typography

**Primary Font:** Inter or Roboto (Google Fonts)
- Excellent readability for data-heavy interfaces
- Strong number differentiation (critical for poker stats)

**Secondary Font:** JetBrains Mono (for hand history code/data)

**Type Scale:**
- Hero/Dashboard Title: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Data Labels: text-sm font-medium (14px)
- Secondary Info: text-xs (12px)
- Stats/Numbers: text-2xl to text-4xl font-bold (prominent display)

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Tight spacing (p-2, gap-2): Within stat cards, compact data
- Standard spacing (p-4, p-6): Card padding, form fields
- Section spacing (p-8, py-12): Major content areas
- Large spacing (p-16, py-20): Page sections, hero areas

**Grid System:**
- Desktop: 12-column grid with max-w-7xl container
- Dashboard: 3-column layout (sidebar-main-stats)
- Responsive breakpoints: sm, md, lg, xl

**Container Strategy:**
- Full-width dashboard: w-full with inner max-w-screen-2xl
- Content sections: max-w-6xl mx-auto
- Stat cards: Flexible grid (grid-cols-2 lg:grid-cols-4)

### C. Component Library

#### Navigation & Layout
**Top Navigation Bar:**
- Fixed position with subtle shadow/border
- Logo left, navigation center, user/credits right
- Height: h-16
- Includes: Credits counter badge, "Análises Restantes: 3/5" with icon
- CTA button for "Assinar Premium" prominently displayed

**Sidebar Navigation (Dashboard):**
- Width: w-64 on desktop, collapsible to w-16 icons-only
- Sections: Dashboard, Upload, Histórico, Estatísticas, Premium
- Active state clearly indicated with subtle treatment

**Footer:**
- Multi-column layout (4 columns on desktop)
- Sections: Produto, Recursos, Suporte, Legal
- Newsletter signup integrated
- Social links and payment badges
- Copyright and language selector

#### Data Visualization Components
**Stat Cards:**
- Rounded corners (rounded-lg or rounded-xl)
- Shadow: shadow-sm with hover:shadow-md transition
- Padding: p-6
- Structure: Icon + Label + Large Number + Change Indicator
- Grid layout: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4

**Chart Containers:**
- Full-width responsive containers
- Min-height: min-h-[400px] for readability
- Title + time period selector + export button
- Padding: p-6
- Use Chart.js or Recharts library via CDN

**Progress Indicators:**
- Linear progress bars for winrate trends
- Circular progress for completion metrics
- Width: w-full with height h-2 for bars

#### Upload & Analysis
**File Upload Zone:**
- Large dropzone (min-h-[300px])
- Dashed border with drag-over state
- Center-aligned icon + text + button
- Accepted formats clearly listed (.txt, .csv, .hand)
- File preview list after upload

**Analysis Results Card:**
- Prominent header with hand ID/date
- Tabbed interface for different stats views
- Expandable sections for detailed breakdowns
- Export/share options in header

#### Monetization Elements
**Free Trial Counter:**
- Sticky badge in top navigation
- Large, clear number display
- Warning state when <2 analyses remain
- Direct link to premium upgrade

**Ad Placement Zones:**
- Sidebar banner: 300x250px space
- Between content sections: 728x90px horizontal
- Non-intrusive placement with clear "Anúncio" label
- Skip ad button after viewing (earn credit feature)

**Premium Upgrade Modal:**
- Center modal with pricing table
- Clear value proposition grid
- Features comparison (Free vs Premium)
- Payment form with Stripe integration
- Monthly price (R$10/mês) prominently displayed
- Trust indicators (secure payment, cancel anytime)

**Pricing Card:**
- Highlighted "Premium" plan
- List of benefits with checkmarks
- "Plano Atual" badge for active subscription
- Large CTA button
- Money-back guarantee mention

#### Forms & Inputs
**Input Fields:**
- Height: h-12
- Padding: px-4
- Border: border-2 with focus states
- Label above field (text-sm font-medium mb-2)
- Helper text below (text-xs)
- Error states with icon + message

**Buttons:**
- Primary CTA: px-6 py-3 text-base font-semibold rounded-lg
- Secondary: px-4 py-2 text-sm font-medium rounded-md
- Icon buttons: w-10 h-10 rounded-full
- States: Default, Hover (slight scale/shadow), Active, Disabled
- Hero buttons over images: backdrop-blur-sm treatment

#### Data Tables
**Hand History Table:**
- Sticky header row
- Alternating row treatment
- Sortable columns with indicators
- Pagination at bottom
- Row actions on hover
- Responsive: Stack on mobile

**Stats Table:**
- Compact row spacing (py-2)
- Right-aligned numbers
- Left-aligned labels
- Dividers between sections
- Highlight positive/negative values

#### Feedback & States
**Empty States:**
- Center-aligned illustration/icon
- Concise heading + description
- Primary action button
- Suggestions for next steps

**Loading States:**
- Skeleton loaders matching component structure
- Spinner for full-page loads
- Progress bar for uploads/analysis

**Success/Error Messages:**
- Toast notifications (top-right)
- Inline validation messages
- Success celebrations for completed analysis

### D. Page-Specific Layouts

#### Landing Page (Pre-Auth)
**Hero Section:**
- Height: min-h-[600px] (not forced 100vh)
- Large hero image: Poker table visualization or analytics dashboard screenshot
- Centered headline + subheadline + dual CTAs
- Social proof: "Mais de 1.000 jogadores confiam" with user avatars
- Grid: 2-column on desktop (text left, image/demo right)

**Features Section:**
- 3-column grid of feature cards
- Icon + Title + Description structure
- Real screenshots in cards
- Padding: py-20

**How It Works:**
- 4-step process with numbered indicators
- Alternating image-text layout
- Screenshots of actual interface
- CTA at end

**Pricing Section:**
- 2-column comparison (Free vs Premium)
- Feature checklist format
- Highlighted Premium card
- Clear monthly pricing
- Padding: py-20

**Testimonials:**
- 3-column grid of testimonial cards
- Player avatar + name + poker site
- Star rating + quote
- Background: Slightly differentiated treatment

#### Dashboard (Post-Auth)
**Layout Structure:**
- 3-zone layout: Sidebar (w-64) + Main (flex-1) + Stats Sidebar (w-80)
- Sticky sidebar navigation
- Main area: Cards grid with consistent gaps (gap-6)

**Header Stats Row:**
- 4 stat cards in grid
- Key metrics: Winrate, Mãos Jogadas, ROI, Lucro Total
- Trend indicators (arrows + percentages)

**Charts Section:**
- 2-column grid on desktop
- Primary chart full-width
- Secondary charts in 2-column below
- Time period selector for each

**Recent Activity:**
- Card list of recent analyses
- Thumbnail preview + stats summary
- Quick action buttons

#### Upload Page
**Full-Width Upload Zone:**
- Centered in viewport
- Max-width: max-w-2xl
- Large dropzone
- File format instructions
- Sample file download link

**Processing State:**
- Progress bar with percentage
- Current step indicator
- Estimated time remaining

**Results Preview:**
- Immediate stat highlights
- "Ver Análise Completa" CTA
- Share options

## Images

**Hero Image:** Full-bleed poker analytics dashboard screenshot or stylized poker table with overlaid data visualizations. Should convey professionalism and data-driven insights. Position: Right side of hero section, 50% width on desktop.

**Feature Section Images:** Actual application screenshots showing graphs, upload interface, and results. Each feature card includes a screenshot thumbnail.

**Testimonial Avatars:** Professional headshots or poker player avatars, circular crop, 64px diameter.

**Empty State Illustrations:** Simple, clean illustrations for no data states (empty chart icon, upload prompt graphic).

## Accessibility Standards
- Minimum touch targets: 44x44px
- Form inputs: Consistent h-12 height
- Focus indicators: 2px outline offset
- Color contrast: AA minimum for all text
- Alt text: Required for all images
- Keyboard navigation: Full support across dashboard

## Responsive Behavior
- Desktop (1280px+): Full 3-column dashboard layout
- Tablet (768-1279px): Collapsible sidebar, 2-column content
- Mobile (<768px): Single column, hamburger menu, stacked cards
- Touch-optimized: Larger buttons (min h-12), swipe gestures for charts