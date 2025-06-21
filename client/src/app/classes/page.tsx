import { ProtectedRoute } from '@/components/protected-route';

function ClassesContent() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-900 mb-8">Classes</h1>
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <p className="text-blue-600">Class management coming soon.</p>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  return (
    <ProtectedRoute>
      <ClassesContent />
    </ProtectedRoute>
  );
} 