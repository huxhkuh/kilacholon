import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import LoadingBoundary from './components/LoadingBoundary';

// The server-rendered reading view remains usable if an article request fails.
// Normal direct links initialise from the embedded article in the same HTML.
const staticReading = new URLSearchParams(window.location.search).get('view') === 'static'
  && !!document.querySelector('[data-static-reference]');
if (!staticReading) createRoot(document.getElementById("root")!).render(<LoadingBoundary><App /></LoadingBoundary>);
