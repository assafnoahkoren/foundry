import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Home = () => {
  return (
    <div id="home-page" className="flex flex-col items-center justify-center px-4 py-8">
      <h1 id="home-title" className="text-4xl font-bold mb-4">Welcome to Aviaite</h1>
      <p id="home-description" className="text-lg text-muted-foreground mb-8">A modern full-stack TypeScript application with tRPC.</p>
      <div id="home-actions" className="flex gap-4">
        <Link to="/login" id="login-link">
          <Button id="login-button" variant="default">Login</Button>
        </Link>
        <Link to="/register" id="register-link">
          <Button id="register-button" variant="secondary">Get Started</Button>
        </Link>
      </div>
    </div>
  );
};