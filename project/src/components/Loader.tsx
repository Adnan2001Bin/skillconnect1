'use client';

import { motion } from 'framer-motion';

interface CodeLoaderProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  bgColor?: string;
}

const Loader = ({
  text = '</>',
  size = 'medium',
  color = '#6366f1',
  bgColor = '#e0e7ff'
}: CodeLoaderProps) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      {/* Laptop illustration */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Laptop base */}
        <motion.rect
          x="30"
          y="80"
          width="140"
          height="100"
          rx="5"
          fill={bgColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Laptop top */}
        <motion.rect
          x="70"
          y="70"
          width="60"
          height="10"
          rx="2"
          fill={bgColor}
          initial={{ y: 60 }}
          animate={{ y: 70 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        
        {/* Customizable text */}
        <motion.text
          x="100"
          y="120"
          textAnchor="middle"
          fill={color}
          fontSize="15"
          fontFamily="monospace"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {text}
        </motion.text>
        
        {/* Animated line */}
        <motion.path
          d="M80,140 L120,140"
          stroke={color}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        />
      </svg>
      
      {/* Pulsing background */}
      <motion.div 
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${bgColor}50` }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Animated dots */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            top: '20%',
            left: `${20 + i * 30}%`,
            backgroundColor: color
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
};

export default Loader;