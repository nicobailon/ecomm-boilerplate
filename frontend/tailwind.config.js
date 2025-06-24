import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				border: "rgb(var(--border) / <alpha-value>)",
				input: "rgb(var(--input) / <alpha-value>)",
				ring: "rgb(var(--ring) / <alpha-value>)",
				background: "rgb(var(--background) / <alpha-value>)",
				foreground: "rgb(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "rgb(var(--primary) / <alpha-value>)",
					foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
				},
				secondary: {
					DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
					foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
				},
				destructive: {
					DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
					foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
				},
				muted: {
					DEFAULT: "rgb(var(--muted) / <alpha-value>)",
					foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
				},
				accent: {
					DEFAULT: "rgb(var(--accent) / <alpha-value>)",
					foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
				},
				popover: {
					DEFAULT: "rgb(var(--popover) / <alpha-value>)",
					foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
				},
				card: {
					DEFAULT: "rgb(var(--card) / <alpha-value>)",
					foreground: "rgb(var(--card-foreground) / <alpha-value>)",
				},
				success: {
					DEFAULT: "rgb(var(--success) / <alpha-value>)",
					foreground: "rgb(var(--success-foreground) / <alpha-value>)",
				},
				warning: {
					DEFAULT: "rgb(var(--warning) / <alpha-value>)",
					foreground: "rgb(var(--warning-foreground) / <alpha-value>)",
				},
				info: {
					DEFAULT: "rgb(var(--info) / <alpha-value>)",
					foreground: "rgb(var(--info-foreground) / <alpha-value>)",
				},
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-accent': 'var(--gradient-accent)',
			},
			keyframes: {
				highlight: {
					'0%': { 
						transform: 'scale(1)',
						boxShadow: '0 0 0 0 rgba(52, 211, 153, 0.7)'
					},
					'50%': { 
						transform: 'scale(1.02)',
						boxShadow: '0 0 0 10px rgba(52, 211, 153, 0)'
					},
					'100%': { 
						transform: 'scale(1)',
						boxShadow: '0 0 0 0 rgba(52, 211, 153, 0)'
					}
				}
			},
			animation: {
				highlight: 'highlight 1s ease-in-out 2',
			},
			scale: {
				'102': '1.02',
				'105': '1.05',
			}
		},
	},
	plugins: [animate],
};
