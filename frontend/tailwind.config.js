/** @type {import('tailwindcss').Config} */
module.exports = {
	mode: "jit",
	content: ["./src/**/*.{js,jsx,ts,tsx}", "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				"mint-cream": "#F8FFF4",
				"smoky-black": "#121212",
				"charlestown-green": "#252C2C",
				"deep-space-sparkle": "#476566",
				"paradise-pink": "#E34A6F"
			}
		},
	},
	plugins: [require("flowbite/plugin"), require("@tailwindcss/line-clamp")],
}
