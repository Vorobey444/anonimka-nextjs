'use client';

import React, { useState } from 'react';
import BurgerMenu from './BurgerMenu';
import './BurgerButton.css';

export default function BurgerButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Burger button */}
      <button
        className="hamburger-menu"
        onClick={() => setIsMenuOpen(true)}
        aria-label="Открыть меню"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Burger menu */}
      <BurgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
