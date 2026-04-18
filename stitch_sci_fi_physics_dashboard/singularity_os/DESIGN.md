# Design System Document

## 1. Overview & Creative North Star: The Kinetic Void
This design system is built upon the concept of **"The Kinetic Void."** We are moving away from the flat, uninspired interfaces of the last decade toward a command-and-control experience that feels like high-precision instrumentation. The "Void" is our canvas—a deep, infinite space (#050505)—while the "Kinetic" energy is provided by hyper-vibrant plasma accents and glass-morphic depth.

The goal is to break the "template" look. We achieve this through:
*   **Intentional Asymmetry:** Avoid perfectly centered layouts. Use a 12-column grid but allow elements to overlap or bleed off-canvas to suggest a larger, living data environment.
*   **The Precision Edge:** Utilizing subtle technical rounding (scale 1) to suggest high-end aerospace engineering rather than consumer-grade softness.
*   **Depth as Information:** Visual hierarchy is not dictated by size alone, but by "physical" proximity to the user, achieved through layered translucency and light emission.

---

## 2. Colors: High-Contrast Luminance
The color palette is designed to simulate a self-illuminated display in a dark environment.

### Primary Palette
*   **Deep Space (Background):** `#050505` – The foundation. It is the absolute void that allows for high-contrast luminance.
*   **Electric Purple (Primary):** `#A855F7` – Used for primary actions and "active" system states.
*   **Cyber Yellow (Secondary):** `#FACC15` – Used for warnings, critical data highlights, and secondary interactions.
*   **Plasma Pink (Tertiary):** `#EC4899` – Reserved for decorative accents, data visualization peaks, and rare call-outs.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. Use `surface_container_low` against the `background` to define a section. If an element requires more focus, use `surface_container_high`. We define space through mass and light, not wireframes.

### The "Glass & Gradient" Rule
To achieve "soul" in the UI, use subtle linear gradients (e.g., `primary` to `primary_dim`) at a 135-degree angle for CTA backgrounds. For floating panels, use a backdrop-blur (minimum 12px) with a semi-transparent `surface_variant` to create the "Neumorphic-glass" effect.

---

## 3. Typography: The Technical Editorial
We utilize a dual-font strategy to balance high-speed legibility with futuristic authority.

*   **Display & Headlines (Space Grotesk):** Used for `display-lg` through `headline-sm`. Space Grotesk provides a "HUD" (Heads-Up Display) aesthetic with its geometric and technical letterforms.
*   **Body & Labels (Inter):** Used for all `title`, `body`, and `label` scales. Inter provides the necessary "Editorial" clarity against high-contrast backgrounds.

**Hierarchy Tip:** Use `primary` or `secondary` colors for `label-md` to call out specific data points within a block of text, creating a "scanning" path for the user’s eye.

---

## 4. Elevation & Depth: Neumorphic-Glass Fusion
In this system, depth is a functional tool. 

### The Layering Principle
Stacking is the primary method of hierarchy. 
1.  **Base:** `surface` (The Void).
2.  **Level 1:** `surface_container_low` (General layout zones).
3.  **Level 2:** `surface_container_highest` (Interactive cards/modals).

### Ambient Glows & Shadows
Traditional black drop shadows are forbidden. Instead, use:
*   **Inner Glow:** `inset 0px 1px 2px rgba(255, 255, 255, 0.1)` on glass cards to catch the "top light."
*   **Ambient Shadows:** For floating elements, use a 40px blur with 8% opacity, tinted with the `surface_tint` (Electric Purple). This mimics the way a neon screen casts light onto its surroundings.
*   **The Ghost Border:** If accessibility requires a stroke, use `outline_variant` at 15% opacity. It should feel like a faint reflection on the edge of a glass pane, not a drawn line.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` gradient with an `on_primary` (black) label. Add a 4px soft glow (`primary` color) on hover.
*   **Secondary:** Ghost-style. No fill, with a `secondary` "Ghost Border" and `secondary` text.
*   **Shape:** Use the `SUBTLE` (1) rounding scale for a precision-machined look.

### Cards & Lists
*   **Cards:** Use `surface_container_highest` with 20% opacity and a `backdrop-filter: blur(12px)`. Never use dividers. Separate content using the `NORMAL` (2) spacing scale to ensure balanced information density.
*   **Lists:** Separate list items with a subtle shift in tonal background (e.g., `surface_container_low` to `surface_container`) rather than lines.

### Inputs & Interaction
*   **Input Fields:** Standardized density. Only a bottom "glow-line" that activates (changes from `outline` to `primary`) when focused. Labels should use the `label-sm` scale in `on_surface_variant`.
*   **Icons:** Use a 2px "Soft Glow" filter (`drop-shadow`) in the icon's representative accent color (Purple/Yellow/Pink) to make them appear as illuminated bulbs.

### Additional Component: The "Data Pulse"
A custom component for this system. A small, 4px circular dot using the `tertiary` (Plasma Pink) color with a breathing animation (opacity 40% to 100%) to indicate live system connectivity.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts where one side of the dashboard is "heavier" than the other to create visual interest.
*   **Do** use `primary_fixed_dim` for text that sits on top of vibrant accents to ensure WCAG 2.1 AAA readability.
*   **Do** lean into the "3D" aspect by slightly offsetting nested containers to show the layers underneath, utilizing the standard spacing scale for consistency.

### Don’t:
*   **Don’t** use 100% opaque borders. They flatten the "Glass" illusion.
*   **Don’t** use standard grey shadows. Shadows must always be a darkened, tinted version of the background or a glow of the accent.
*   **Don’t** use Space Grotesk for long-form body text. It is a display face; use Inter for high-density data and descriptions.