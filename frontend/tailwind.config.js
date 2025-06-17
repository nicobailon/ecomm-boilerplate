import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
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
			}
		},
	},
	plugins: [animate],
};
