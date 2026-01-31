# Athens Water Reserves Dashboard 💧

A modern, interactive dashboard for monitoring the water reserves of Athens, Greece. This application visualizes historical data from the EYDAP Open Data API, allowing users to track water levels across major reservoirs (Mornos, Evinos, Yliki, Marathonas).

## Features

- Interactive Visualization: Dynamic area charts showing water volume over time using Recharts.

- Historical Data: View weekly water level trends dating back up to 10 years.

- Reservoir Filtering: Toggle visibility for individual reservoirs (Mornos, Evinos, Yliki, Marathonas) to isolate specific data.

- Responsive Design: Built with Tailwind CSS for a seamless experience on desktop and mobile.

- Data Accuracy: Implements forward-filling logic to handle missing API data points and ensure smooth trend lines.

# Tech Stack

- React + Vite
- Tailwind CSS
- Recharts
- Lucide React

# Installation

## Install dependencies:

```
npm install
```

## Start the development server:

```
npm run dev
```

Open your browser and navigate to http://localhost:5173 (or the port shown in your terminal).

## Building for Production

To create a production-ready build:

```
npm run build
```

The output will be in the dist directory, ready to be deployed to static hosting services like Vercel, Netlify, or GitHub Pages.

# License

This project is open-source and available under the MIT License.

# Data Source

All data is provided by the EYDAP Open Data Hub via the Hellenic Corporation of Assets and Participations.
