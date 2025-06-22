'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Student {
  id: number;
  userId: number | null;
  parentId: number;
  dojoId: number;
  beltLevel: string;
  age: number;
  qrCode: string;
  isActive: boolean;
  createdAt: string;
}

interface Attendance {
  id: number;
  studentId: number;
  classId: number;
  dojoId: number;
  checkInTime: string;
  checkInMethod: 'qr_code' | 'manual';
  notes: string | null;
  checkedInBy: number | null;
  createdAt: string;
}

interface Class {
  id: number;
  name: string;
  description: string;
  instructorId: number;
  dojoId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentEnrollment: number;
  beltLevelRequired: string;
  isActive: boolean;
  createdAt: string;
}

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch student data
        const studentResponse = await fetch(`/api/students/${studentId}`);
        if (!studentResponse.ok) {
          throw new Error('Failed to fetch student data');
        }
        const studentData = await studentResponse.json();
        setStudent(studentData);

        // Fetch attendance data
        const attendanceResponse = await fetch(`/api/students/${studentId}/attendance`);
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setAttendance(attendanceData);
        }

        // Fetch classes data for attendance context
        const classesResponse = await fetch('/api/classes');
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setClasses(classesData);
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
  }, [studentId]);

  const getClassName = (classId: number) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo?.name || `Class #${classId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBeltColor = (beltLevel: string) => {
    const colors: Record<string, string> = {
      white: 'bg-white text-gray-800 border-gray-300',
      yellow: 'bg-yellow-400 text-yellow-900',
      orange: 'bg-orange-400 text-orange-900',
      green: 'bg-green-400 text-green-900',
      blue: 'bg-blue-400 text-blue-900',
      purple: 'bg-purple-400 text-purple-900',
      red: 'bg-red-400 text-red-900',
      brown: 'bg-amber-700 text-white',
      black: 'bg-gray-900 text-white',
    };
    return colors[beltLevel.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <h2 className="text-lg font-semibold mb-2">Error Loading Student Profile</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <h2 className="text-lg font-semibold mb-2">Student Not Found</h2>
          <p>The requested student could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dojo-primary mb-2">
          Student Profile
        </h1>
        <p className="text-gray-600">
          Student #{student.id} - {student.isActive ? 'Active' : 'Inactive'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Student ID</label>
                <p className="text-lg font-semibold">#{student.id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Age</label>
                <p className="text-lg">{student.age} years old</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Belt Rank</label>
                <div className="mt-1">
                  <Badge className={`${getBeltColor(student.beltLevel)} capitalize`}>
                    {student.beltLevel} Belt
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">QR Code</label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {student.qrCode}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-sm">{formatDate(student.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                Recent class attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.slice(0, 10).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.checkInTime)}</TableCell>
                        <TableCell>{getClassName(record.classId)}</TableCell>
                        <TableCell>{formatTime(record.checkInTime)}</TableCell>
                        <TableCell>
                          <Badge variant={record.checkInMethod === 'qr_code' ? 'default' : 'secondary'}>
                            {record.checkInMethod === 'qr_code' ? 'QR Code' : 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No attendance records found for this student.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Belt Test Results */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Belt Test Results</CardTitle>
            <CardDescription>
              History of belt promotions and test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Belt test history will be displayed here.</p>
              <p className="text-sm mt-2">This feature is coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Media */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Media</CardTitle>
            <CardDescription>
              Photos, videos, and documents related to this student
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Media gallery will be displayed here.</p>
              <p className="text-sm mt-2">This feature is coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 