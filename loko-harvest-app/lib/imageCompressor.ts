/**
 * Compresses an image file (from camera or file picker) to max dimensions (default 1200px)
 * and JPEG quality (default 0.8), reducing 10MB+ camera photos down to ~150KB - 250KB.
 */
export async function compressImageFile(
  file: File, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.8
): Promise<File> {
  if (!file || !file.type || (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|heic|heif|webp)$/i)) || file.type.includes('svg')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallbackName = (file.name || "photo").replace(/\.[^/.]+$/, "") + ".jpg";
          resolve(new File([file], fallbackName, { type: "image/jpeg", lastModified: Date.now() }));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const fallbackName = (file.name || "photo").replace(/\.[^/.]+$/, "") + ".jpg";
              resolve(new File([file], fallbackName, { type: "image/jpeg", lastModified: Date.now() }));
              return;
            }

            const cleanName = (file.name || "photo").replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            console.log(`📸 Compressed photo proof: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        const fallbackName = (file.name || "photo").replace(/\.[^/.]+$/, "") + ".jpg";
        resolve(new File([file], fallbackName, { type: "image/jpeg", lastModified: Date.now() }));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        const fallbackName = (file.name || "photo").replace(/\.[^/.]+$/, "") + ".jpg";
        resolve(new File([file], fallbackName, { type: "image/jpeg", lastModified: Date.now() }));
      }
    };

    reader.onerror = () => {
      const fallbackName = (file.name || "photo").replace(/\.[^/.]+$/, "") + ".jpg";
      resolve(new File([file], fallbackName, { type: "image/jpeg", lastModified: Date.now() }));
    };

    reader.readAsDataURL(file);
  });
}

export const compressImage = compressImageFile;
export default compressImageFile;
