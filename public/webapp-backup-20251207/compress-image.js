// Сжатие изображений для избежания лимита Vercel 4.5MB
async function compressImage(file, maxSizeMB = 4) {
    return new Promise((resolve, reject) => {
        // Если не изображение - возвращаем как есть
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        
        // Если файл уже меньше лимита - не сжимаем
        if (file.size < maxSizeMB * 1024 * 1024) {
            console.log(`✅ Файл уже подходит: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(file);
            return;
        }
        
        console.log(`🗜️ Начинаем сжатие: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Ограничиваем максимальный размер до 2048px (как в Telegram)
                const maxDimension = 2048;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Начинаем с качества 0.85 и понижаем пока не уложимся в лимит
                let quality = 0.85;
                
                const tryCompress = () => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Ошибка сжатия'));
                            return;
                        }
                        
                        const newSizeMB = blob.size / 1024 / 1024;
                        console.log(`🗜️ Качество ${quality.toFixed(2)}: ${newSizeMB.toFixed(2)}MB`);
                        
                        if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
                            // Ещё слишком большой, снижаем качество
                            quality -= 0.1;
                            tryCompress();
                        } else {
                            // Создаём новый File объект
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            console.log(`✅ Сжатие завершено: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                            resolve(compressedFile);
                        }
                    }, 'image/jpeg', quality);
                };
                
                tryCompress();
            };
            img.onerror = () => reject(new Error('Ошибка загрузки изображения'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsDataURL(file);
    });
}
