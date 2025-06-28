"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from '@/components/protected-route';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from "next/navigation";
import { apiClient } from "@/config/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

function StudentsContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [formData, setFormData] = useState({
    parentId: 2, // Default to the existing parent
    dojoId: 1,   // Default to the existing dojo
    beltLevel: "white",
    age: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Always fetch students and dojos
        const [studentsData, dojosData] = await Promise.all([
          apiClient.get<Student[]>('/api/students'),
          apiClient.get<Dojo[]>('/api/dojos')
        ]);
        setStudents(studentsData);
        setDojos(dojosData);

        // Try to fetch users (only instructors have access)
        try {
          const usersData = await apiClient.get<User[]>('/api/users');
          setUsers(usersData);
        } catch (userError: any) {
          // If users fetch fails (e.g., 403 for parents), just continue without user data
          console.log('Could not fetch users data:', userError.message);
          setUsers([]);
        }
      } catch (err: any) {
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCreateStudent = async () => {
    setCreating(true);
    setCreateError("");

    try {
      const newStudent = await apiClient.post<Student>('/api/students', {
        parentId: formData.parentId,
        dojoId: formData.dojoId,
        beltLevel: formData.beltLevel,
        age: parseInt(formData.age) || null
      });

      setStudents(prev => [...prev, newStudent]);
      setIsDialogOpen(false);
      setFormData({
        parentId: 2,
        dojoId: 1,
        beltLevel: "white",
        age: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      });
    } catch (err: any) {
      setCreateError(err.message || "Error creating student");
    } finally {
      setCreating(false);
    }
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

  const getParentName = (parentId: number) => {
    const parent = users.find(user => user.id === parentId);
    if (parent) {
      return `${parent.firstName} ${parent.lastName}`;
    }
    // If users data is not available (e.g., for parents), show a generic name
    return `Parent #${parentId}`;
  };

  const getDojoName = (dojoId: number) => {
    const dojo = dojos.find(d => d.id === dojoId);
    return dojo ? dojo.name : `Dojo #${dojoId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-900">Students</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-student-button">Add New Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="parentId">Parent</Label>
                <Select
                  value={formData.parentId.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(user => user.role === 'parent').map(parent => (
                      <SelectItem key={parent.id} value={parent.id.toString()}>
                        {parent.firstName} {parent.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dojoId">Dojo</Label>
                <Select
                  value={formData.dojoId.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dojoId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dojos.map(dojo => (
                      <SelectItem key={dojo.id} value={dojo.id.toString()}>
                        {dojo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="beltLevel">Belt Level</Label>
                <Select
                  value={formData.beltLevel}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, beltLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Enter age"
                />
              </div>

              {createError && (
                <div className="text-red-600 text-sm">{createError}</div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStudent} disabled={creating}>
                  {creating ? "Creating..." : "Create Student"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-4">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow" data-testid="student-card">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg" data-testid="student-name">
                      Student #{student.id}
                    </CardTitle>
                    <Badge variant={student.isActive ? "default" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Belt Level</span>
                    <Badge className={`${getBeltColor(student.beltLevel)} capitalize`} data-testid="belt-level">
                      {student.beltLevel}
                    </Badge>
                  </div>

                  {student.age && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Age</span>
                      <span className="text-sm font-medium">{student.age} years</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Parent</span>
                    <span className="text-sm font-medium">{getParentName(student.parentId)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Dojo</span>
                    <span className="text-sm font-medium">{getDojoName(student.dojoId)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Member Since</span>
                    <span className="text-sm font-medium">{formatDate(student.createdAt)}</span>
                  </div>

                  <Separator />

                  <div className="pt-2">
                    <Button
                      onClick={() => router.push(`/students/${student.id}`)}
                      className="w-full"
                      size="sm"
                    >
                      View Full Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
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