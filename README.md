# 🌊 Ocean Catcher

A 2D web-based survival and collecting game built with HTML5 Canvas, JavaScript, and CSS3. Developed as a Computer Graphics course project.

## 🎮 Gameplay
Take control of a deep-sea diver and collect valuable treasures while avoiding dangerous marine life and ocean trash. The game features a dynamic difficulty system—as your score increases, the game speed and spawn rates challenge your reflexes!

## 🕹️ Controls
* **Left Arrow (←):** Move diver left
* **Right Arrow (→):** Move diver right

## ⚙️ Technical Highlights
**2D Transformations:** For dynamic submersible tilt movements, the `ctx.translate()` and `ctx.rotate()` functions are used.
* **Collision Detection:** Custom hitbox logic for accurate interaction between the diver and falling objects.
* **Data Persistence:** Implements `localStorage` to save and display the highest score across sessions.
* **Responsive Rendering:** Smooth requestAnimationFrame loop with dynamic gradient backgrounds and UI overlays.
