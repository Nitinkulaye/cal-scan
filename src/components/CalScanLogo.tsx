import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'app-icon' | 'mark' | 'monochrome';
}

/**
 * Cal Scan Logo
 * Faithfully matches the exact uploaded visual icon:
 * - Glossy deep black curved squircle container with outer rim highlight
 * - Four sculpted aerodynamic chrome/white curved scanner brackets in the corners
 * - Central glossy white ceramic sculpted apple with distinct two-segment leaf & stem
 * - High-definition gradient shading, specular highlights, and soft inner bevels
 */
export const CalScanLogo: React.FC<LogoProps> = ({ 
  size = 38, 
  className = '', 
  variant = 'app-icon' 
}) => {
  // Pure flat coral or monochrome mark
  if (variant === 'mark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
        aria-label="Cal Scan Mark"
      >
        {/* Four Horn/Crescent Corner Brackets */}
        <path
          d="M 18 35 C 18 20 22 17 38 18 C 28 20 23 25 21 35 C 20 40 18 42 18 35 Z"
          fill="#FF6B5B"
        />
        <path
          d="M 82 35 C 82 20 78 17 62 18 C 72 20 77 25 79 35 C 80 40 82 42 82 35 Z"
          fill="#FF6B5B"
        />
        <path
          d="M 18 65 C 18 80 22 83 38 82 C 28 80 23 75 21 65 C 20 60 18 58 18 65 Z"
          fill="#FF6B5B"
        />
        <path
          d="M 82 65 C 82 80 78 83 62 82 C 72 80 77 75 79 65 C 80 60 82 58 82 65 Z"
          fill="#FF6B5B"
        />

        {/* Central Apple */}
        <path
          d="M 50 44 C 44 36 32 37 27 45 C 20 54 22 71 33 80 C 39 85 46 84 50 82 C 54 84 61 85 67 80 C 78 71 80 54 73 45 C 68 37 56 36 50 44 Z"
          fill="#FF6B5B"
        />
        {/* Leaf */}
        <path
          d="M 52 42 C 48 30 54 21 66 20 C 66 31 60 40 52 42 Z"
          fill="#FF6B5B"
        />
      </svg>
    );
  }

  // Exact 3D High-Gloss Icon from user's image
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-[24%] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Background Squircle Gloss Gradient */}
          <radialGradient id={`bgSphere_${uniqueId}`} cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#252528" />
            <stop offset="45%" stopColor="#141416" />
            <stop offset="85%" stopColor="#08080A" />
            <stop offset="100%" stopColor="#020202" />
          </radialGradient>

          {/* Chrome/White Ceramic Horn Bracket Gradient */}
          <linearGradient id={`chromeHorns_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F8F8FC" />
            <stop offset="70%" stopColor="#E3E3EC" />
            <stop offset="100%" stopColor="#B6B6C4" />
          </linearGradient>

          {/* Bracket Inner Shadow & Specular */}
          <linearGradient id={`specularTop_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#9E9EA8" stopOpacity="0.8" />
          </linearGradient>

          {/* Apple 3D Body Ceramic Shading */}
          <radialGradient id={`appleBodyGrad_${uniqueId}`} cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F4F4F8" />
            <stop offset="85%" stopColor="#E2E2EA" />
            <stop offset="100%" stopColor="#BDBDC9" />
          </radialGradient>

          {/* Apple Ambient Drop Shadow onto Background */}
          <filter id={`appleShadow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.65" />
          </filter>

          {/* Outer Border Rim Highlight */}
          <linearGradient id={`outerRimGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A4A54" />
            <stop offset="30%" stopColor="#2B2B32" />
            <stop offset="70%" stopColor="#1C1C20" />
            <stop offset="100%" stopColor="#3A3A42" />
          </linearGradient>
        </defs>

        {/* 1. Base Squircle with Deep Radial Black Glass Finish */}
        <rect
          x="3"
          y="3"
          width="194"
          height="194"
          rx="52"
          fill={`url(#bgSphere_${uniqueId})`}
          stroke={`url(#outerRimGrad_${uniqueId})`}
          strokeWidth="3.5"
        />

        {/* 2. Delicate Specular Bezel Line inside */}
        <rect
          x="6.5"
          y="6.5"
          width="187"
          height="187"
          rx="48.5"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.12"
          strokeWidth="1.5"
        />

        {/* 3. FOUR SCULPTED AERODYNAMIC CHROME CORNER BRACKETS */}
        {/* Top-Left Chrome Curved Bracket */}
        <g>
          <path
            d="M 33 80 
               C 33 50 42 35 78 35 
               C 60 37 47 45 42 60 
               C 39 70 37 77 33 80 Z"
            fill={`url(#chromeHorns_${uniqueId})`}
          />
          {/* Specular Ridge Top-Left */}
          <path
            d="M 36 78 C 36 53 44 40 76 37 C 62 39 50 47 45 61 C 41 71 39 76 36 78 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />
          {/* Beveled Edge highlight */}
          <path
            d="M 34 80 C 34 49 43 35 78 35"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Top-Right Chrome Curved Bracket */}
        <g>
          <path
            d="M 167 80 
               C 167 50 158 35 122 35 
               C 140 37 153 45 158 60 
               C 161 70 163 77 167 80 Z"
            fill={`url(#chromeHorns_${uniqueId})`}
          />
          {/* Specular Ridge Top-Right */}
          <path
            d="M 164 78 C 164 53 156 40 124 37 C 138 39 150 47 155 61 C 159 71 161 76 164 78 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />
          <path
            d="M 166 80 C 166 49 157 35 122 35"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Bottom-Left Chrome Curved Bracket */}
        <g>
          <path
            d="M 33 120 
               C 33 150 42 165 78 165 
               C 60 163 47 155 42 140 
               C 39 130 37 123 33 120 Z"
            fill={`url(#chromeHorns_${uniqueId})`}
          />
          {/* Specular Ridge Bottom-Left */}
          <path
            d="M 36 122 C 36 147 44 160 76 163 C 62 161 50 153 45 139 C 41 129 39 124 36 122 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />
          <path
            d="M 34 120 C 34 151 43 165 78 165"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Bottom-Right Chrome Curved Bracket */}
        <g>
          <path
            d="M 167 120 
               C 167 150 158 165 122 165 
               C 140 163 153 155 158 140 
               C 161 130 163 123 167 120 Z"
            fill={`url(#chromeHorns_${uniqueId})`}
          />
          {/* Specular Ridge Bottom-Right */}
          <path
            d="M 164 122 C 164 147 156 160 124 163 C 138 161 150 153 155 139 C 159 129 161 124 164 122 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />
          <path
            d="M 166 120 C 166 151 157 165 122 165"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* 4. CENTRAL GLOSSY WHITE SCULPTED APPLE WITH LEAF & STEM */}
        <g filter={`url(#appleShadow_${uniqueId})`}>
          {/* Slender Stem linking to leaf */}
          <path
            d="M 100 86 C 102 78 107 72 119 66 C 117 71 114 77 106 83 Z"
            fill={`url(#chromeHorns_${uniqueId})`}
          />
          <path
            d="M 103 82 C 105 76 109 71 118 67"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Two-Segment Sculpted White Leaf */}
          <g>
            {/* Main Upper Leaf body */}
            <path
              d="M 104 84 
                 C 98 70 82 56 68 53 
                 C 74 69 91 85 104 84 Z"
              fill={`url(#appleBodyGrad_${uniqueId})`}
            />
            {/* Top Leaf half with crisp embossed specular highlight */}
            <path
              d="M 104 84 
                 C 96 74 85 64 68 53 
                 C 82 52 98 62 104 84 Z"
              fill="#FFFFFF"
              opacity="0.95"
            />
            {/* Subtle central rib vein */}
            <path
              d="M 103 82 C 92 72 80 62 69 54"
              stroke="#D2D2DC"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>

          {/* Main Apple Silhouette with Rounded Heart Base & Dimple */}
          <path
            d="M 100 90 
               C 91 76 72 74 60 88 
               C 46 105 48 132 66 148 
               C 78 158 91 157 100 153 
               C 109 157 122 158 134 148 
               C 152 132 154 105 140 88 
               C 128 74 109 76 100 90 Z"
            fill={`url(#appleBodyGrad_${uniqueId})`}
          />

          {/* Primary Top Left Specular Reflection */}
          <path
            d="M 70 94 
               C 76 89 87 88 94 94 
               C 83 96 76 103 72 112 
               C 70 106 69 98 70 94 Z"
            fill="#FFFFFF"
            opacity="0.9"
          />

          {/* Wide Glossy Core Sheen */}
          <ellipse
            cx="96"
            cy="114"
            rx="24"
            ry="18"
            transform="rotate(-15 96 114)"
            fill="#FFFFFF"
            opacity="0.45"
          />

          {/* Edge Specular Glow around Right Rim */}
          <path
            d="M 132 94 C 142 106 142 124 132 138"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Bottom Dimple Shading for 3D depth */}
          <path
            d="M 94 151 C 98 149 102 149 106 151"
            stroke="#9C9CA8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};

// Re-export as CalibrateLogo for backward compatibility
export { CalScanLogo as CalibrateLogo };
