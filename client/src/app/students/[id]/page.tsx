import { useToast } from '@/components/toast-provider';
import { useEffect, useState } from 'react';

export default function StudentProfilePage() {
  const { showToast } = useToast();
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        // Fetch student data
        const studentResponse = await fetch(`/api/students/${studentId}`);
        if (!studentResponse.ok) {
          showToast({ title: 'Failed to fetch student data', variant: 'error' });
          throw new Error('Failed to fetch student data');
        }
        const studentData = await studentResponse.json();
        setStudent(studentData);
        // Fetch attendance data
        const attendanceResponse = await fetch(`/api/students/${studentId}/attendance`);
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setAttendance(attendanceData);
        } else {
          showToast({ title: 'Failed to fetch attendance', variant: 'error' });
        }
        // Fetch classes data for attendance context
        const classesResponse = await fetch('/api/classes');
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setClasses(classesData);
        } else {
          showToast({ title: 'Failed to fetch classes', variant: 'error' });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId, showToast]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
} 