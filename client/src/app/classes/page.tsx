import { ProtectedRoute } from '@/components/protected-route';

function ClassesContent() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dojo-primary mb-8">Classes</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-dojo-secondary">Class management coming soon.</p>
      </div>
    </main>
  );
}

export default function ClassesPage() {
  return (
    <ProtectedRoute>
      <ClassesContent />
    </ProtectedRoute>
  );
} 