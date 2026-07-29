# Astro Firefighter

A fast-paced side-scrolling retro space arcade shooter built with HTML5 Canvas and Vanilla JavaScript.

## 📖 About the Project
Astro Firefighter is an original browser game . In this game, players pilot an emergency response starship tasked with clearing space stations of rogue thermal automata across 15 escalating sectors.

## 🌟 Unique Gameplay Mechanics
* **Hydro-Pump Shockwave (`KEY E`):** A custom panic-button feature that emits an electric wave clearing all active enemy projectiles and dealing area damage to enemies on screen.
* **Cannon Thermal Management:** Continuous firing causes your water hose cannon to heat up. Manage your burst fire to prevent cannon lockouts during critical moments.
* **Asteroid Hazard Dodging:** Non-shootable physical space rocks spawn dynamically across the screen, requiring tactical navigation with WASD and Hydro-Dash.
* **Dynamic Floating Damage Text:** Real-time feedback showing hit numbers and critical strike indicators as you attack enemies.
* **CRT Neon Styling:** Built using a custom neon arcade theme with scanlines and glowing vector HUDs.

## 🎮 How to Play
1. **Move Ship:** `W`, `A`, `S`, `D` or `Arrow Keys`
2. **Water Cannon:** `Spacebar` *(Hold to shoot, watch heat meter!)*
3. **Hydro-Dash:** `Left Shift` or `Right Shift`
4. **Hydro-Bomb:** `E` Key *(Screen clearer, limited uses per sector)*

## 🛠️ Project Setup
This project uses zero external build tools, frameworks, or dependencies.

1. Clone or download this repository.
2. Open `index.html` directly in any web browser.
3. Deploy to GitHub Pages by choosing `main` branch under Repository Settings -> Pages.

## 📂 Code Architecture
* `index.html` - Game overlay markup, HUD text structures, and canvas viewport.
* `style.css` - Custom CRT scanline styles, neon arcade borders, and retro button layouts.
* `script.js` - Game loop physics, WebAudio synth sounds, collision detection, and custom gameplay systems.