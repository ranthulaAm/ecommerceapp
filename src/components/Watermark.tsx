import { FC, ReactNode } from 'react';

interface WatermarkProps {
  text?: string;
  opacity?: number;
  children?: ReactNode;
}

export const Watermark: FC<WatermarkProps> = ({ text = "PREVIEW ONLY - DO NOT COPY", opacity = 0.3, children }) => {
  return (
    <div className="relative w-full h-full">
      {children}
      <div 
        className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-wrap content-center justify-center z-50"
        style={{ zIndex: 50 }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="transform -rotate-45 text-gray-500 font-bold text-xl whitespace-nowrap m-8"
            style={{ opacity }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};
