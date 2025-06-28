'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/config/api';

interface Student {
  id: number;
  userId: number | null;
  parentId: number;
  dojoId: number;
  beltLevel: string;
  age: number | null;
  qrCode: string;
  isActive: boolean;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
}

interface Dojo {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
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

interface Booking {
  id: number;
  studentId: number;
  classId: number;
  bookedBy: number;
  bookedAt: string;
  isActive: boolean;
  createdAt: string;
}

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [parent, setParent] = useState<User | null>(null);
  const [dojo, setDojo] = useState<Dojo | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);

        // Fetch student data
        const studentData = await apiClient.get<Student>(`/api/students/${studentId}`);
        setStudent(studentData);

        // Fetch parent data
        try {
          const parentData = await apiClient.get<User>(`/api/users/${studentData.parentId}`);
          setParent(parentData);
        } catch (err) {
          console.log('Parent data not available');
        }

        // Fetch dojo data
        try {
          const dojoData = await apiClient.get<Dojo>(`/api/dojos/${studentData.dojoId}`);
          setDojo(dojoData);
        } catch (err) {
          console.log('Dojo data not available');
        }

        // Fetch attendance data
        try {
          const attendanceData = await apiClient.get<Attendance[]>(`/api/students/${studentId}/attendance`);
          setAttendance(attendanceData);
        } catch (err) {
          console.log('Attendance data not available');
        }

        // Fetch classes data for attendance context
        try {
          const classesData = await apiClient.get<Class[]>('/api/classes');
          setClasses(classesData);
        } catch (err) {
          console.log('Classes data not available');
        }

        // Fetch bookings data
        try {
          const bookingsData = await apiClient.get<Booking[]>('/api/bookings');
          const studentBookings = bookingsData.filter(booking => booking.studentId === studentData.id);
          setBookings(studentBookings);
        } catch (err) {
          console.log('Bookings data not available');
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

  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const totalClasses = classes.length;
    const attendedClasses = attendance.length;
    return Math.round((attendedClasses / totalClasses) * 100);
  };

  const getRecentAttendance = () => {
    return attendance
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
      .slice(0, 5);
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
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
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

              {student.age && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Age</label>
                  <p className="text-lg">{student.age} years old</p>
                </div>
              )}

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

              <Separator />

              {/* Parent Information */}
              {parent && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Parent Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm">{parent.firstName} {parent.lastName}</p>
                    </div>
                    {parent.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{parent.email}</p>
                      </div>
                    )}
                    {parent.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm">{parent.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Dojo Information */}
              {dojo && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Dojo Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dojo</label>
                      <p className="text-sm">{dojo.name}</p>
                    </div>
                    {dojo.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-sm">{dojo.address}</p>
                      </div>
                    )}
                    {dojo.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm">{dojo.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics and Recent Activity */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{attendance.length}</div>
                <div className="text-sm text-gray-500">Total Classes Attended</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{calculateAttendanceRate()}%</div>
                <div className="text-sm text-gray-500">Attendance Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{bookings.length}</div>
                <div className="text-sm text-gray-500">Active Bookings</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>
                Last 5 class attendance records
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
                    {getRecentAttendance().map((record) => (
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

      {/* Active Bookings */}
      {bookings.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Bookings</CardTitle>
              <CardDescription>
                Currently booked classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Booked On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.filter(booking => booking.isActive).map((booking) => {
                    const classInfo = classes.find(c => c.id === booking.classId);
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>{classInfo?.name || `Class #${booking.classId}`}</TableCell>
                        <TableCell className="capitalize">{classInfo?.dayOfWeek || '-'}</TableCell>
                        <TableCell>{classInfo ? `${classInfo.startTime} - ${classInfo.endTime}` : '-'}</TableCell>
                        <TableCell>{formatDate(booking.bookedAt)}</TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

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