import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Root } from './Root';
import './index.css';
import { ClickToComponent } from "click-to-react-component";

console.log(import.meta.env);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClickToComponent editor="cursor"/>
    <Root />
  </StrictMode>
);