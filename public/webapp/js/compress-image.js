// РЎР¶Р°С‚РёРµ РёР·РѕР±СЂР°Р¶РµРЅРёР№ РґР»СЏ РёР·Р±РµР¶Р°РЅРёСЏ Р»РёРјРёС‚Р° Vercel 4.5MB
async function compressImage(file, maxSizeMB = 4) {
    return new Promise((resolve, reject) => {
        // Р•СЃР»Рё РЅРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ - РІРѕР·РІСЂР°С‰Р°РµРј РєР°Рє РµСЃС‚СЊ
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        
        // Р•СЃР»Рё С„Р°Р№Р» СѓР¶Рµ РјРµРЅСЊС€Рµ Р»РёРјРёС‚Р° - РЅРµ СЃР¶РёРјР°РµРј
        if (file.size < maxSizeMB * 1024 * 1024) {
            console.log(`вњ… Р¤Р°Р№Р» СѓР¶Рµ РїРѕРґС…РѕРґРёС‚: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(file);
            return;
        }
        
        console.log(`рџ—њпёЏ РќР°С‡РёРЅР°РµРј СЃР¶Р°С‚РёРµ: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // РћРіСЂР°РЅРёС‡РёРІР°РµРј РјР°РєСЃРёРјР°Р»СЊРЅС‹Р№ СЂР°Р·РјРµСЂ РґРѕ 2048px (РєР°Рє РІ Telegram)
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
                
                // РќР°С‡РёРЅР°РµРј СЃ РєР°С‡РµСЃС‚РІР° 0.85 Рё РїРѕРЅРёР¶Р°РµРј РїРѕРєР° РЅРµ СѓР»РѕР¶РёРјСЃСЏ РІ Р»РёРјРёС‚
                let quality = 0.85;
                
                const tryCompress = () => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('РћС€РёР±РєР° СЃР¶Р°С‚РёСЏ'));
                            return;
                        }
                        
                        const newSizeMB = blob.size / 1024 / 1024;
                        console.log(`рџ—њпёЏ РљР°С‡РµСЃС‚РІРѕ ${quality.toFixed(2)}: ${newSizeMB.toFixed(2)}MB`);
                        
                        if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
                            // Р•С‰С‘ СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕР№, СЃРЅРёР¶Р°РµРј РєР°С‡РµСЃС‚РІРѕ
                            quality -= 0.1;
                            tryCompress();
                        } else {
                            // РЎРѕР·РґР°С‘Рј РЅРѕРІС‹Р№ File РѕР±СЉРµРєС‚
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            console.log(`вњ… РЎР¶Р°С‚РёРµ Р·Р°РІРµСЂС€РµРЅРѕ: ${(file.size / 1024 / 1024).toFixed(2)}MB в†’ ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                            resolve(compressedFile);
                        }
                    }, 'image/jpeg', quality);
                };
                
                tryCompress();
            };
            img.onerror = () => reject(new Error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РёР·РѕР±СЂР°Р¶РµРЅРёСЏ'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('РћС€РёР±РєР° С‡С‚РµРЅРёСЏ С„Р°Р№Р»Р°'));
        reader.readAsDataURL(file);
    });
}

