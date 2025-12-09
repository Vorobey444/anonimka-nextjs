'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './BurgerMenu.css';

interface BurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BurgerMenu({ isOpen, onClose }: BurgerMenuProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Проверяем админские права (можно добавить логику позже)
    const adminStatus = localStorage.getItem('is_admin');
    setIsAdmin(adminStatus === 'true');
  }, []);

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      localStorage.clear();
      onClose();
      router.push('/');
    }
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`hamburger-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      >
        {/* Menu Content */}
        <div
          className="hamburger-menu-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="hamburger-header">
            <h2>Меню</h2>
            <button className="hamburger-close" onClick={onClose}>
              ×
            </button>
          </div>

          {/* Navigation */}
          <nav className="hamburger-nav">
            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/main');
              }}
            >
              <span className="hamburger-icon">🏠</span>
              Главная
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/browse');
              }}
            >
              <span className="hamburger-icon">👁️</span>
              Смотреть анкеты
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/create');
              }}
            >
              <span className="hamburger-icon">📝</span>
              Создать анкету
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/my-ads');
              }}
            >
              <span className="hamburger-icon">📋</span>
              Мои анкеты
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/chats');
              }}
            >
              <span className="hamburger-icon">💬</span>
              Мои чаты
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/world-chat');
              }}
            >
              <span className="hamburger-icon">🌍</span>
              Мир чат
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/polls');
              }}
            >
              <span className="hamburger-icon">📊</span>
              Опросы
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/my-photos');
              }}
            >
              <span className="hamburger-icon">📸</span>
              Мои фото
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/edit-nickname');
              }}
            >
              <span className="hamburger-icon">✏️</span>
              Изменить никнейм
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/location-setup');
              }}
            >
              <span className="hamburger-icon">📍</span>
              Изменить локацию
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/blocked-users');
              }}
            >
              <span className="hamburger-icon">🚫</span>
              Мои заблокированные
            </a>

            {isAdmin && (
              <a
                href="#"
                className="hamburger-item"
                id="adminMenuItem"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/admin');
                }}
              >
                <span className="hamburger-icon">🛠️</span>
                Админ-панель
              </a>
            )}

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/support');
              }}
            >
              <span className="hamburger-icon">📞</span>
              Тех.поддержка
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/rules');
              }}
            >
              <span className="hamburger-icon">📋</span>
              Правила
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/privacy');
              }}
            >
              <span className="hamburger-icon">🔒</span>
              Конфиденциальность
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/about');
              }}
            >
              <span className="hamburger-icon">ℹ️</span>
              О приложении
            </a>

            <a
              href="#"
              className="hamburger-item"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/earn');
              }}
            >
              <span className="hamburger-icon">💰</span>
              Хотите заработать?
            </a>

            <a
              href="#"
              className="hamburger-item logout-item"
              id="logoutBtn"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              <span className="hamburger-icon">🚪</span>
              Выйти из аккаунта
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}
