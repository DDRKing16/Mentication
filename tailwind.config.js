/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 0.4rem)',
  			sm: 'calc(var(--radius) - 0.7rem)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			indigo: 'hsl(var(--indigo))',
  			teal: 'hsl(var(--teal))',
  			cream: 'hsl(var(--cream))',
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))'
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			clean: ['var(--font-clean)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'fade-up': {
  				from: { opacity: '0', transform: 'translateY(12px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-in': {
  				from: { opacity: '0' },
  				to: { opacity: '1' }
  			},
  			'soft-pulse': {
  				'0%, 100%': { opacity: '0.6' },
  				'50%': { opacity: '1' }
  			},
  			'gentle-rise': {
  				from: { opacity: '0', transform: 'translateY(10px) scale(0.99)' },
  				to: { opacity: '1', transform: 'translateY(0) scale(1)' }
  			},
  			'breathe': {
  				'0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
  				'50%': { transform: 'scale(1.15)', opacity: '1' }
  			}
  			},
  			animation: {
  			'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
  			'fade-in': 'fade-in 0.4s ease-out both',
  			'soft-pulse': 'soft-pulse 3s ease-in-out infinite',
  			'gentle-rise': 'gentle-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
  			'breathe': 'breathe 6s ease-in-out infinite'
  			}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
