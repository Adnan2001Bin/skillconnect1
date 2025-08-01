// components/IllustrationLoader.tsx
import React, { useEffect, useState } from 'react';
import styles from './Loader.module.css';

type LoaderVariant = 'web-developer' | 'web-designer' | 'graphic-designer' | 'general';

interface IllustrationLoaderProps {
  variant?: LoaderVariant;
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

const Loader: React.FC<IllustrationLoaderProps> = ({
  variant = 'general',
  size = 'medium',
  message = 'Loading talents...',
  className = '',
}) => {
  const [activeIcon, setActiveIcon] = useState(0);

  // Icons for different talent types
  const icons = {
    'web-developer': ['💻', '👨‍💻', '🔧', '⚙️'],
    'web-designer': ['🎨', '🖌️', '🖥️', '✏️'],
    'graphic-designer': ['🖼️', '📐', '✒️', '🖋️'],
    'general': ['🌟', '✨', '💡', '🚀'],
  };

  // Animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIcon((prev) => (prev + 1) % icons[variant].length);
    }, 500);

    return () => clearInterval(interval);
  }, [variant]);

  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Main animated icon */}
        <span className={`${styles.bounce} inline-block`}>
          {icons[variant][activeIcon]}
        </span>
        
        {/* Floating decorative elements */}
        <span className={`absolute -top-2 -left-2 ${styles.float} ${styles.delay100}`}>
          {icons[variant][(activeIcon + 1) % icons[variant].length]}
        </span>
        <span className={`absolute -bottom-2 -right-2 ${styles.float} ${styles.delay200}`}>
          {icons[variant][(activeIcon + 2) % icons[variant].length]}
        </span>
      </div>
      
      {/* Loading message */}
      <p className={`mt-4 text-center ${styles.pulse} ${size === 'small' ? 'text-sm' : 'text-lg'}`}>
        {message}
      </p>
      
      {/* Animated progress bar */}
      <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-4">
        <div className={`h-full bg-indigo-500 rounded-full ${styles.progress}`}></div>
      </div>
    </div>
  );
};

export default Loader;