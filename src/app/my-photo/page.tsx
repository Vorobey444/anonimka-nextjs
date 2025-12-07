"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

interface Photo {
  id: number;
  photo_url: string;
  caption: string | null;
  position: number;
  is_active: boolean;
}

function MyPhotoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitText, setLimitText] = useState("Загрузка...");
  const [isPremium, setIsPremium] = useState(false);

  const userToken = useMemo(
    () =>
      (searchParams?.get("userToken") ?? null) ||
      (typeof window !== "undefined" ? localStorage.getItem("user_token") : null),
    [searchParams]
  );

  // Load photos and premium status
  useEffect(() => {
    if (!userToken) {
      setIsLoading(false);
      setError("Требуется авторизация");
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [photosResp, premiumResp] = await Promise.all([
          fetch(`/api/user-photos?userToken=${encodeURIComponent(userToken)}`),
          fetch(`/api/premium?action=get-user-status&userId=${encodeURIComponent(userToken)}`),
        ]);

        const photosData = await photosResp.json();
        const premiumData = await premiumResp.json();

        if (photosData.error) throw new Error(photosData.error.message || "Ошибка загрузки фото");
        if (premiumData.error) throw new Error(premiumData.error.message || "Ошибка загрузки статуса");

        if (cancelled) return;

        const list: Photo[] = photosData.data || [];
        setPhotos(list);
        const premiumFlag = !!premiumData.isPremium;
        setIsPremium(premiumFlag);
        const limit = premiumFlag ? 3 : 1;
        const active = list.filter((p) => p.is_active).length;
        setLimitText(`Активных: ${active}/${limit}`);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Неизвестная ошибка");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userToken]);

  const reload = async () => {
    if (!userToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const photosResp = await fetch(`/api/user-photos?userToken=${encodeURIComponent(userToken)}`);
      const photosData = await photosResp.json();
      if (photosData.error) throw new Error(photosData.error.message || "Ошибка загрузки фото");
      const list: Photo[] = photosData.data || [];
      setPhotos(list);
      const limit = isPremium ? 3 : 1;
      const active = list.filter((p) => p.is_active).length;
      setLimitText(`Активных: ${active}/${limit}`);
    } catch (err: any) {
      setError(err?.message || "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => router.back();

  const handleAddPhoto = async () => {
    if (!userToken) return alert("Требуется авторизация");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("userToken", userToken);

        const uploadResp = await fetch("/api/upload-photo", { method: "POST", body: formData });
        const uploadResult = await uploadResp.json();
        if (uploadResult.error) throw new Error(uploadResult.error);

        const saveResp = await fetch("/api/user-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userToken, fileId: uploadResult.file_id, photoUrl: uploadResult.url }),
        });
        const saveResult = await saveResp.json();
        if (saveResult.error) throw new Error(saveResult.error.message);
        await reload();
        if (saveResult.overLimit) alert("⚠️ Достигнут лимит: лишние фото деактивированы");
      } catch (err: any) {
        setError(err?.message || "Ошибка загрузки фото");
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  const editCaption = async (photoId: number, oldCaption: string | null) => {
    const caption = window.prompt("Введите подпись к фото:", oldCaption || "");
    if (caption === null) return;
    if (!userToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/user-photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken, updates: [{ id: photoId, caption: caption || null }] }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error.message);
      await reload();
    } catch (err: any) {
      setError(err?.message || "Ошибка обновления подписи");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (photoId: number, newState: boolean) => {
    if (!userToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/user-photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken, updates: [{ id: photoId, is_active: newState }] }),
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error.message);
      await reload();
    } catch (err: any) {
      setError(err?.message || "Ошибка смены статуса");
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (!userToken) return;
    if (!window.confirm("Удалить это фото?")) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/user-photos?userToken=${encodeURIComponent(userToken)}&photoId=${photoId}`,
        { method: "DELETE" }
      );
      const result = await resp.json();
      if (result.error) throw new Error(result.error.message);
      await reload();
    } catch (err: any) {
      setError(err?.message || "Ошибка удаления");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#e0e0e0',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
          }}
        >
          <button
            onClick={handleBack}
            style={{
              background: 'rgba(131, 56, 236, 0.2)',
              border: '1px solid rgba(131, 56, 236, 0.5)',
              color: '#8338ec',
              padding: '8px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginRight: '15px',
            }}
          >
            ← Назад
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '600',
            }}
          >
            📸 Мои фото
          </h1>
        </div>

        {/* Info Banner */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '15px',
            background: 'rgba(0, 217, 255, 0.1)',
            borderLeft: '3px solid #00d9ff',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
          <div>
            <p
              style={{
                margin: '0 0 5px 0',
                fontSize: '0.95rem',
                fontWeight: '500',
              }}
            >
              {limitText}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#888',
              }}
            >
              Фото будут показаны во всех ваших активных объявлениях
            </p>
          </div>
        </div>

        {/* Add Photo Button */}
        <button
          onClick={handleAddPhoto}
          style={{
            width: '100%',
            padding: '15px',
            background: 'linear-gradient(135deg, #8338ec 0%, #00d9ff 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(131, 56, 236, 0.3)',
          }}
        >
          ➕ Добавить фото
        </button>

        {/* States */}
        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: '#ff3b30',
              marginBottom: '20px',
              background: 'rgba(255, 59, 48, 0.08)',
              borderRadius: '10px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '300px',
          }}
        >
          {isLoading ? (
            <p
              style={{
                textAlign: 'center',
                color: '#888',
                margin: '60px 0',
              }}
            >
              ⏳ Загрузка...
            </p>
          ) : !userToken ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>🔐</div>
              <h3 style={{ color: '#e0e0e0', margin: '0 0 15px 0' }}>Требуется авторизация</h3>
              <p style={{ color: '#888', margin: 0 }}>Откройте эту страницу через Telegram бот</p>
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '5rem', marginBottom: '25px', opacity: 0.4 }}>📸</div>
              <h3 style={{ color: '#e0e0e0', margin: '0 0 15px 0', fontSize: '1.4rem' }}>Нет фото</h3>
              <p style={{ color: '#888', margin: 0, lineHeight: 1.6 }}>
                Нажмите кнопку "Добавить фото" выше,<br />
                чтобы загрузить фото для своих объявлений
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {photos.map((photo) => {
                const borderColor = photo.is_active ? '#00d9ff' : '#ff3b30';
                const opacity = photo.is_active ? 1 : 0.6;
                return (
                  <div
                    key={photo.id}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(26, 26, 46, 0.8)',
                      border: `2px solid ${borderColor}`,
                      opacity,
                    }}
                  >
                    <div
                      onClick={() => window.open(photo.photo_url, "_blank")}
                      style={{
                        width: '100%',
                        height: '160px',
                        backgroundImage: `url(${photo.photo_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      {!photo.is_active && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            background: 'rgba(255, 59, 48, 0.95)',
                            color: 'white',
                            padding: '4px 10px',
                            fontSize: '0.7rem',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}
                        >
                          ❌ Отключено
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ color: '#888', marginBottom: '10px', fontSize: '0.75rem' }}>
                        Позиция: <strong style={{ color: '#00d9ff' }}>{photo.position}</strong>
                      </div>
                      {photo.caption && (
                        <div
                          style={{
                            color: '#e0e0e0',
                            marginBottom: '12px',
                            fontSize: '0.85rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {photo.caption}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editCaption(photo.id, photo.caption);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(131, 56, 236, 0.2)',
                            border: '1px solid rgba(131, 56, 236, 0.6)',
                            color: '#8338ec',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          ✏️ Изменить подпись
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActive(photo.id, !photo.is_active);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(0, 217, 255, 0.2)',
                            border: '1px solid rgba(0, 217, 255, 0.6)',
                            color: '#00d9ff',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {photo.is_active ? '🚫 Скрыть фото' : '👁️ Показать фото'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePhoto(photo.id);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(255, 59, 48, 0.2)',
                            border: '1px solid rgba(255, 59, 48, 0.6)',
                            color: '#ff3b30',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyPhotoPage() {
  return (
    <Suspense fallback={<div style={{ color: "#e0e0e0", padding: 24 }}>Загрузка...</div>}>
      <MyPhotoContent />
    </Suspense>
  );
}
