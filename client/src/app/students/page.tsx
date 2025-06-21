import { ProtectedRoute } from '@/components/protected-route';

function StudentsContent() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dojo-primary mb-8">Students</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-dojo-secondary">Student management coming soon.</p>
      </div>
    </main>
  );
}

export default function StudentsPage() {
  return (
    <ProtectedRoute>
      <StudentsContent />
    </ProtectedRoute>
  );
} 