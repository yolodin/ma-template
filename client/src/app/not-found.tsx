import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-dojo-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button className="bg-dojo-primary hover:bg-dojo-primary/90 text-white px-6 py-2 rounded">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
} 