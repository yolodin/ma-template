import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-dojo-primary to-dojo-primary/80 text-white">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to YOLO Dojo
        </h1>
        <p className="text-xl mb-8 text-dojo-secondary">
          Comprehensive martial arts management system for modern dojos
        </p>
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link href="/login">
            <Button size="lg" variant="outline" className="bg-white text-dojo-primary hover:bg-gray-100">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" className="bg-dojo-secondary text-dojo-primary hover:bg-dojo-secondary/90">
              Get Started
            </Button>
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Student Management</h3>
            <p className="text-dojo-secondary">Track students, progress, and attendance</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Class Scheduling</h3>
            <p className="text-dojo-secondary">Organize classes and manage capacity</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Attendance Tracking</h3>
            <p className="text-dojo-secondary">QR code check-ins and reports</p>
          </div>
        </div>
      </div>
    </main>
  );
}
