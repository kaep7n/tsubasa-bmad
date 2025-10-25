/**
 * Image Resize Utility
 * Resizes images using Canvas API for team logo uploads
 */

/**
 * Resize an image file to specified dimensions
 * Maintains aspect ratio and center crops if needed
 *
 * @param file The image file to resize
 * @param maxWidth Maximum width in pixels (default: 512)
 * @param maxHeight Maximum height in pixels (default: 512)
 * @param quality Image quality for compression (0-1, default: 0.9)
 * @returns Promise resolving to resized File
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 512,
  maxHeight: number = 512,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate dimensions for center crop (square)
        const size = Math.min(img.width, img.height);
        const left = (img.width - size) / 2;
        const top = (img.height - size) / 2;

        // Set canvas size to target dimensions
        canvas.width = maxWidth;
        canvas.height = maxHeight;

        // Draw the center-cropped, resized image
        ctx.drawImage(
          img,
          left, top, size, size,  // Source rectangle (center crop)
          0, 0, maxWidth, maxHeight  // Destination rectangle
        );

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new File from blob with original name and type
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      } finally {
        // Clean up: revoke object URL
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image file size
 *
 * @param file The file to validate
 * @param maxSizeBytes Maximum file size in bytes (default: 2MB)
 * @returns True if file size is valid
 */
export function validateImageSize(file: File, maxSizeBytes: number = 2097152): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Validate image file type
 *
 * @param file The file to validate
 * @param allowedTypes Array of allowed MIME types (default: common image types)
 * @returns True if file type is valid
 */
export function validateImageType(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Get file extension from filename
 *
 * @param filename The filename
 * @returns File extension (e.g., 'png', 'jpg')
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}