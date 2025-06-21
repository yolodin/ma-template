import { ProtectedRoute } from '@/components/protected-route';

function MessagesContent() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dojo-primary mb-8">Messages</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-dojo-secondary">Messaging coming soon.</p>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesContent />
    </ProtectedRoute>
  );
} 