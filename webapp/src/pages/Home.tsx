import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Foundry</h1>
        <p className="text-xl text-muted-foreground mb-8">
          A modern web application platform
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/register">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}