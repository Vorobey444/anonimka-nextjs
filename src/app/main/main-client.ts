// Client-side JavaScript for Main Page

// Toggle Hamburger Menu
if (typeof window !== 'undefined') {
  (window as any).toggleHamburgerMenu = () => {
    const overlay = document.getElementById('hamburgerOverlay');
    if (overlay) {
      overlay.classList.toggle('active');
    }
  };

  // Close menu when clicking overlay
  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hamburgerOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    }
  });
}
