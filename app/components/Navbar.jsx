'use client';
import {
  AppBar, Toolbar, Button, Box, Typography, Avatar, IconButton,
  Menu, MenuItem, Slide, Tooltip, useTheme, Chip,
} from '@mui/material';
import {
  Map, Dashboard as DashboardIcon, AddCircleOutline, Login, Logout,
  Person, Menu as MenuIcon, LightMode, DarkMode,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.jsx';
import { useDarkMode } from '@/app/providers/ThemeProvider';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useScrollTrigger } from '@mui/material';

function HideOnScroll({ children }) {
  const trigger = useScrollTrigger({ threshold: 10 });
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const ROLE_COLORS = {
  admin: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  municipality: { bg: 'rgba(14,165,233,0.12)', text: '#0ea5e9', border: 'rgba(14,165,233,0.3)' },
  citizen: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
};
const ROLE_LABELS = { admin: 'Admin', municipality: 'Municipality', citizen: 'Citizen' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleUserMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleMobileMenuOpen = (e) => setMobileMenuAnchor(e.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchor(null);

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Map', href: '/', icon: <Map sx={{ fontSize: 18 }} /> },
    { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
    { label: 'Report Issue', href: '/upload', icon: <AddCircleOutline sx={{ fontSize: 18 }} />, highlight: true },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');
  const roleStyle = user ? (ROLE_COLORS[user.role] || ROLE_COLORS.citizen) : null;

  return (
    <HideOnScroll>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: darkMode
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: darkMode
            ? '0 4px 24px rgba(0, 0, 0, 0.4)'
            : '0 4px 24px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 64, sm: 70 }, py: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Box
              sx={{
                width: 44, height: 44, borderRadius: 2.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)' },
              }}
            >
              <Map sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.5px',
                display: { xs: 'none', sm: 'block' },
                color: darkMode ? '#fff' : '#1f2937',
              }}
            >
              Civic Tracker
            </Typography>
          </Link>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, flex: 1, justifyContent: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                startIcon={item.icon}
                sx={{
                  color: isActive(item.href)
                    ? '#667eea'
                    : darkMode ? 'rgba(255, 255, 255, 0.9)' : '#4b5563',
                  px: 2.5, py: 0.75, borderRadius: 2,
                  fontWeight: 600, fontSize: '0.875rem',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  background: isActive(item.href)
                    ? darkMode ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.08)'
                    : item.highlight
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'transparent',
                  ...(item.highlight && {
                    color: '#fff !important',
                    boxShadow: '0 3px 18px rgba(102, 126, 234, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.32)',
                  }),
                  '&:hover': {
                    background: isActive(item.href)
                      ? darkMode ? 'rgba(102, 126, 234, 0.22)' : 'rgba(102, 126, 234, 0.14)'
                      : item.highlight
                        ? 'linear-gradient(135deg, #5568d3 0%, #6a3f8a 100%)'
                        : darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    transform: item.highlight ? 'translateY(-2px)' : 'none',
                    boxShadow: item.highlight ? '0 6px 20px rgba(102, 126, 234, 0.4)' : 'none',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'} arrow>
              <IconButton
                onClick={toggleDarkMode}
                size="small"
                sx={{
                  color: darkMode ? '#fbbf24' : '#667eea',
                  bgcolor: darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                  border: `1px solid ${darkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(102, 126, 234, 0.2)'}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: darkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(102, 126, 234, 0.12)',
                    transform: 'rotate(180deg) scale(1.05)',
                  },
                }}
              >
                {darkMode ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {user ? (
              <>
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                  {user.role && roleStyle && (
                    <Chip
                      id="navbar-role-badge"
                      label={ROLE_LABELS[user.role] || user.role}
                      size="small"
                      sx={{
                        fontWeight: 700, fontSize: '0.68rem', borderRadius: 999,
                        bgcolor: roleStyle.bg, color: roleStyle.text,
                        border: `1px solid ${roleStyle.border}`,
                        height: 24,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      px: 2, py: 0.75, borderRadius: 2,
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(102, 126, 234, 0.08)',
                      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(102, 126, 234, 0.2)'}`,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: darkMode ? '#fff' : '#1f2937', fontWeight: 600, fontSize: '0.875rem' }}>
                      {user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                    </Typography>
                  </Box>

                  <IconButton
                    id="navbar-user-menu-btn"
                    onClick={handleUserMenuOpen}
                    size="small"
                    sx={{
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(102, 126, 234, 0.08)',
                      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(102, 126, 234, 0.2)'}`,
                      '&:hover': {
                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(102, 126, 234, 0.12)',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <Person sx={{ fontSize: 18, color: '#fff' }} />
                    </Avatar>
                  </IconButton>
                </Box>

                <IconButton
                  size="small"
                  sx={{ display: { xs: 'flex', sm: 'none' } }}
                  onClick={handleUserMenuOpen}
                >
                  <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Person sx={{ fontSize: 18, color: '#fff' }} />
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5, borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      minWidth: 180,
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {user.name || user.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                  <MenuItem
                    id="navbar-logout"
                    onClick={handleLogout}
                    sx={{ gap: 1, color: '#ef4444', fontWeight: 600 }}
                  >
                    <Logout sx={{ fontSize: 18 }} />
                    Sign out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                id="navbar-login-btn"
                component={Link}
                href="/login"
                startIcon={<Login sx={{ fontSize: 18 }} />}
                sx={{
                  color: '#fff', px: 2.5, py: 0.75, borderRadius: 2,
                  fontWeight: 600, fontSize: '0.875rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8a 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                  },
                }}
              >
                Sign in
              </Button>
            )}

            <IconButton
              size="small"
              sx={{ display: { xs: 'flex', md: 'none' }, color: darkMode ? '#fff' : '#1f2937', ml: 1 }}
              onClick={handleMobileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleMobileMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5, borderRadius: 3, minWidth: 220,
                boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.12)',
                border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              },
            }}
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.href}
                component={Link}
                href={item.href}
                onClick={handleMobileMenuClose}
                sx={{
                  gap: 1.5, py: 1.5, mx: 1, my: 0.5, borderRadius: 2,
                  bgcolor: isActive(item.href)
                    ? darkMode ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.08)'
                    : 'transparent',
                  color: isActive(item.href) ? '#667eea' : 'text.primary',
                  fontWeight: isActive(item.href) ? 600 : 500,
                  '&:hover': {
                    bgcolor: isActive(item.href)
                      ? darkMode ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.12)'
                      : darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                {item.icon}
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
}
