"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from '@/components/protected-route';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from "next/navigation";

function StudentsContent() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/students");
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();
        setStudents(data);
      } catch (err: any) {
        setError(err.message || "Error fetching students");
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-900 mb-8">Students</h1>
      <div className="space-y-4">
        {loading && (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
        )}
        {!loading && !error && students.length === 0 && (
          <div className="text-gray-500">No students found.</div>
        )}
        {!loading && !error && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div key={student.id} className="bg-white border rounded-lg shadow p-4 flex flex-col gap-2" data-testid="student-card">
                <div className="font-semibold text-lg" data-testid="student-name">
                  Student #{student.id}
                </div>
                <div className="text-sm text-blue-700" data-testid="belt-level">
                  Belt: {student.beltLevel}
                </div>
                <Button onClick={() => router.push(`/students/${student.id}`)}>
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <ProtectedRoute>
      <StudentsContent />
    </ProtectedRoute>
  );
} 