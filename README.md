# 🚀 Astro Firefighter: Tactical Overdrive

> A fast-paced, retro side-scrolling space shooter built with pure HTML5 Canvas, CSS3, and modern Vanilla JavaScript. Extinguish rogue flame-bots, maneuver through hazardous debris, and defeat boss fleets across 15 escalating sectors!

![Game Preview](https://img.shields.io/badge/Genre-Arcade%20Shooter-ff4500?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Made%20With-HTML5%20%7C%20CSS3%20%7C%20JS-00f0ff?style=for-the-badge)
![Dependencies](https://img.shields.io/badge/Dependencies-Zero-2a9d8f?style=for-the-badge)

---

## 🎮 Game Features

* **15 Escalating Sectors:** Fight through progressively harder levels with increasing enemy spawn rates, speed, and aggression.
* **Multiple Enemy Archetypes:**
  * **Scouts:** Fast and light strike craft.
  * **Interceptors:** Sine-wave maneuvering bots that attack in patterns.
  * **Heavy Cruisers:** Tanky dreadnoughts that fire high-damage fireballs.
  * **Sector Bosses:** Giant boss encounters every 5 sectors with unique movement patterns and health bars.
* **Thermal Management System:** Your high-pressure water cannon builds up heat as you spray. Manage continuous fire carefully to avoid cannon lockouts during crucial moments.
* **Hydro-Dash Booster:** Perform a tactical dodge-dash using `Shift` to escape tight spots.
* **Power-Up Drops:** Enemies drop tactical modules including **Hull Repair (H)**, **Tri-Shot Cannon Upgrades (W)**, and **Energy Shields (S)**.
* **Custom Particle System:** Real-time explosions, thruster trails, and dynamic impact effects.
* **Procedural Synthesizer Audio:** Uses the browser's native **Web Audio API** to dynamically create laser, explosion, and power-up sound effects without external audio file dependencies.

---

## 🕹️ Controls

| Action | Control Key |
| :--- | :--- |
| **Move Ship** | `W` `A` `S` `D` or `Arrow Keys` |
| **Water Cannon** | `Spacebar` *(Hold to fire continuously)* |
| **Hydro-Dash** | `Left Shift` / `Right Shift` |

---

## 🛠️ Project Structure

```text
├── index.html     # Game container, Canvas element, and UI Overlays
├── style.css      # Dark arcade styling, animations, and blurred backdrops
└── script.js      # Game loop, WebAudio synth, physics, collision detection, and AI
