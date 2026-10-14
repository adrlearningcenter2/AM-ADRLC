/**
 * Image compression utility for AM Digital ADR evidence photos.
 * Compresses camera/upload photos via HTML5 Canvas to JPEG < 700KB.
 */

export interface CompressedImageResult {
  dataUrl: string;
  base64: string;
  mime: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
}

export async function compressImage(file: File, maxDimension: number = 1200, quality: number = 0.65): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
    if (!isImage && file.type) {
      return reject(new Error('Format file bukan gambar yang valid'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Gagal menginisialisasi canvas untuk kompresi');
        }

        // Fill white background for transparent PNG converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split(',')[1];
        const compressedSizeBytes = Math.round((base64Data.length * 3) / 4);

        if (compressedSizeBytes > 700 * 1024) {
          // If still over 700KB, attempt secondary compression with lower quality
          const secondaryDataUrl = canvas.toDataURL('image/jpeg', 0.45);
          const secondaryBase64 = secondaryDataUrl.split(',')[1];
          const secondaryBytes = Math.round((secondaryBase64.length * 3) / 4);

          resolve({
            dataUrl: secondaryDataUrl,
            base64: secondaryBase64,
            mime: 'image/jpeg',
            originalSizeBytes: file.size,
            compressedSizeBytes: secondaryBytes,
            width: targetWidth,
            height: targetHeight,
          });
          return;
        }

        resolve({
          dataUrl,
          base64: base64Data,
          mime: 'image/jpeg',
          originalSizeBytes: file.size,
          compressedSizeBytes,
          width: targetWidth,
          height: targetHeight,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Gagal memproses gambar'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Foto tidak dapat dibaca'));
    };

    img.src = objectUrl;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
