import imageCompression from "browser-image-compression";

export async function compressImage(
  base64Image: string,
  maxSizeMB = 0.5,
  maxWidthOrHeight = 1024,
): Promise<string> {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Image);
    const blob = await response.blob();

    // Convert blob to File (required by browser-image-compression)
    const file = new File([blob], "drawing.png", { type: "image/png" });

    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: "image/png",
    };

    const compressedBlob = await imageCompression(file, options);

    // Convert back to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedBlob);
    });
  } catch (error) {
    console.error("Image compression failed:", error);
    // Return original if compression fails
    return base64Image;
  }
}

export function estimateImageSize(base64Image: string): number {
  // Base64 encoding increases size by ~33%
  // Remove data URL prefix to get actual base64 length
  const base64Data = base64Image.split(",")[1] || base64Image;
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
