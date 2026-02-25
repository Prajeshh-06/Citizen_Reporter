'use client';
import React from 'react';
import { Box, Typography, Container, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { keyframes } from '@mui/system';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

export default function PageHeader({ title, summary }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary;
  const background = theme.palette.background;
  const darkGradientStart = alpha(background.default || '#0f172a', 0.98);
  const darkGradientEnd = alpha(background.paper || '#111827', 0.88);
  const lightGradientStart = alpha(primary.main, 0.8);
  const lightGradientEnd = alpha(primary.light || primary.main, 0.6);
  const gradientStart = isDark ? darkGradientStart : lightGradientStart;
  const gradientEnd = isDark ? darkGradientEnd : lightGradientEnd;
  const overlayAccent = isDark
    ? alpha(primary.main, 0.12)
    : alpha(primary.light || primary.main, 0.15);
  const softHighlight = isDark ? alpha('#0f172a', 0.4) : alpha('#0f172a', 0.12);
  const chipBackground = isDark ? alpha('#1f2937', 0.75) : alpha('#ffffff', 0.18);
  const chipBorder = isDark ? alpha('#94a3b8', 0.35) : alpha('#ffffff', 0.22);
  const headingColor = isDark ? 'rgba(226, 232, 240, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const bodyColor = isDark ? 'rgba(203, 213, 225, 0.9)' : 'rgba(255, 255, 255, 0.88)';
  
  return (
    <Box
      sx={{
        position: 'relative',
        background: `linear-gradient(140deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
        color: isDark ? bodyColor : '#fff',
        py: { xs: 6, md: 8 },
        px: { xs: 2, sm: 3, md: 4 },
        mb: 0,
        overflow: 'hidden',
        borderBottom: `1px solid ${alpha(isDark ? '#0b1220' : '#1f2937', 0.12)}`,
        boxShadow: isDark ? 'none' : `inset 0 -1px 0 ${alpha('#ffffff', 0.08)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 18% 45%, ${overlayAccent} 0%, transparent 55%)`,
          animation: `${float} 8s ease-in-out infinite`,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 82% 70%, ${alpha(primary.dark || primary.main, isDark ? 0.16 : 0.15)} 0%, transparent 60%)`,
          animation: `${float} 6s ease-in-out infinite reverse`,
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${softHighlight} 0%, transparent 70%)`,
          filter: 'blur(48px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(primary.main, isDark ? 0.22 : 0.18)} 0%, transparent 70%)`,
          filter: 'blur(36px)',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Typography 
          variant="overline" 
          sx={{ 
            color: isDark ? alpha('#e2e8f0', 0.95) : 'rgba(255, 255, 255, 0.92)', 
            fontWeight: 700, 
            letterSpacing: 2.5, 
            fontSize: '0.75rem',
            display: 'inline-block',
            px: 2.5,
            py: 0.75,
            borderRadius: 2,
            background: chipBackground,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${chipBorder}`,
            mb: 2.5,
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)',
          }}
        >
          {title}
        </Typography>
        {summary && (
          <>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                mt: 1.5, 
                mb: 1.5,
                fontSize: { xs: '2rem', md: '2.5rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: headingColor,
                textShadow: isDark ? '0 28px 40px rgba(8, 15, 25, 0.55)' : '0 12px 28px rgba(79, 70, 229, 0.25)',
              }}
            >
              {summary.titleText || ''}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: bodyColor,
                fontWeight: 400,
                fontSize: { xs: '0.9375rem', md: '1rem' },
                maxWidth: '600px',
                lineHeight: 1.7,
                textShadow: isDark ? '0 10px 24px rgba(8, 15, 25, 0.35)' : '0 10px 24px rgba(99, 102, 241, 0.18)',
              }}
            >
              {summary.subText || ''}
            </Typography>
          </>
        )}
      </Container>
    </Box>
  );
}
