import Image from "next/image";
import type { CSSProperties, ReactEventHandler } from "react";

type StorefrontImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  draggable?: boolean;
  style?: CSSProperties;
  onError?: ReactEventHandler<HTMLImageElement>;
};

/**
 * Use Next.js image optimization for local assets. Uploaded/external URLs
 * remain regular images so existing customer-managed image URLs keep working.
 */
export default function StorefrontImage({
  src,
  alt,
  width = 1200,
  height = 1500,
  sizes = "(max-width: 700px) 90vw, 45vw",
  className,
  loading = "lazy",
  fetchPriority,
  draggable,
  style,
  onError,
}: StorefrontImageProps) {
  const isLocalAsset = src.startsWith("/") && !src.startsWith("//");

  if (isLocalAsset) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        draggable={draggable}
        style={style}
        onError={onError}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      draggable={draggable}
      style={style}
      onError={onError}
    />
  );
}
