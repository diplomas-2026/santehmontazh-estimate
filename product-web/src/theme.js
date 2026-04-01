import { alpha, createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff9b62',
      light: '#ffd37d',
      dark: '#d4672e',
    },
    secondary: {
      main: '#6dc8ff',
    },
    background: {
      default: '#08111d',
      paper: alpha('#ffffff', 0.06),
    },
    text: {
      primary: '#f8f6f2',
      secondary: 'rgba(227, 235, 248, 0.72)',
    },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.05em',
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at top left, rgba(255, 166, 114, 0.28), transparent 24%), radial-gradient(circle at 85% 15%, rgba(73, 173, 255, 0.24), transparent 25%), radial-gradient(circle at bottom right, rgba(106, 92, 246, 0.18), transparent 28%), linear-gradient(135deg, #08111d 0%, #0d1524 42%, #111b32 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          paddingInline: 18,
          paddingBlock: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
  },
});

