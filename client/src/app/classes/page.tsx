"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/toast-provider"
import { Plus, Calendar, Clock, Users, BookOpen, BookX } from "lucide-react"
import { ProtectedRoute } from '@/components/protected-route'
import { apiClient } from "@/config/api"

interface Class {
  id: number
  name: string
  description: string | null
  instructorId: number
  dojoId: number
  dayOfWeek: string
  startTime: string
  endTime: string
  maxCapacity: number
  currentEnrollment: number
  beltLevelRequired: string
  isActive: boolean
  createdAt: string
}

interface Student {
  id: number
  userId: number | null
  parentId: number | null
  dojoId: number
  beltLevel: string
  age: number | null
  qrCode: string
  isActive: boolean
  createdAt: string
}

interface NewClass {
  name: string
  description: string
  dayOfWeek: string
  startTime: string
  endTime: string
  maxCapacity: number
  beltLevelRequired: string
  instructorId: number
  dojoId: number
}

interface Dojo {
  id: number
  name: string
  address: string | null
  phone: string | null
  email: string | null
  createdAt: string
}

const useClasses = () => {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<Class[]> => {
      return apiClient.get<Class[]>('/api/classes')
    },
  })
}

const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<Student[]> => {
      return apiClient.get<Student[]>('/api/students')
    },
  })
}

const useDojos = () => {
  return useQuery({
    queryKey: ["dojos"],
    queryFn: async (): Promise<Dojo[]> => {
      return apiClient.get<Dojo[]>('/api/dojos')
    },
  })
}

const useCreateClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newClass: NewClass) => {
      return apiClient.post<Class>('/api/classes', newClass)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

const useBookClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: number; studentId: number }) => {
      return apiClient.post<any>(`/api/bookings`, { classId, studentId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

const useUnbookClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: number; studentId: number }) => {
      // Note: We'll need to implement a proper unbook endpoint or use a different approach
      // For now, we'll use a DELETE request to the bookings endpoint
      return apiClient.delete<any>(`/api/bookings/${classId}/${studentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

const useDeleteClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (classId: number) => {
      return apiClient.delete<any>(`/api/classes/${classId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

function AddClassDialog() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const createClass = useCreateClass()
  const { data: dojos } = useDojos()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<NewClass>({
    name: "",
    description: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    maxCapacity: 20,
    beltLevelRequired: "white",
    instructorId: user?.id || 0,
    dojoId: 1 // Default to first dojo
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createClass.mutateAsync(formData)
      addToast("Class created successfully!", "success")
      setOpen(false)
      setFormData({
        name: "",
        description: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        maxCapacity: 20,
        beltLevelRequired: "white",
        instructorId: user?.id || 0,
        dojoId: 1
      })
    } catch (error: any) {
      console.error("Failed to create class:", error)
      addToast(error.message || "Failed to create class", "error")
    }
  }

  const handleInputChange = (field: keyof NewClass, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new class. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Advanced Karate"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Class description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dojoId">Dojo</Label>
              <Select value={formData.dojoId.toString()} onValueChange={(value) => handleInputChange("dojoId", parseInt(value))}>
                <SelectTrigger data-testid="dojo-select-trigger">
                  <SelectValue placeholder="Select dojo" />
                </SelectTrigger>
                <SelectContent>
                  {dojos?.map((dojo) => (
                    <SelectItem key={dojo.id} value={dojo.id.toString()}>
                      {dojo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select value={formData.dayOfWeek} onValueChange={(value) => handleInputChange("dayOfWeek", value)}>
                <SelectTrigger data-testid="day-select-trigger">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="monday" value="monday">Monday</SelectItem>
                  <SelectItem key="tuesday" value="tuesday">Tuesday</SelectItem>
                  <SelectItem key="wednesday" value="wednesday">Wednesday</SelectItem>
                  <SelectItem key="thursday" value="thursday">Thursday</SelectItem>
                  <SelectItem key="friday" value="friday">Friday</SelectItem>
                  <SelectItem key="saturday" value="saturday">Saturday</SelectItem>
                  <SelectItem key="sunday" value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxCapacity">Maximum Capacity</Label>
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                max="100"
                value={formData.maxCapacity}
                onChange={(e) => handleInputChange("maxCapacity", parseInt(e.target.value))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="beltLevelRequired">Belt Level Required</Label>
              <Select value={formData.beltLevelRequired} onValueChange={(value) => handleInputChange("beltLevelRequired", value)}>
                <SelectTrigger data-testid="belt-select-trigger">
                  <SelectValue placeholder="Select belt level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="white" value="white">White</SelectItem>
                  <SelectItem key="yellow" value="yellow">Yellow</SelectItem>
                  <SelectItem key="orange" value="orange">Orange</SelectItem>
                  <SelectItem key="green" value="green">Green</SelectItem>
                  <SelectItem key="blue" value="blue">Blue</SelectItem>
                  <SelectItem key="purple" value="purple">Purple</SelectItem>
                  <SelectItem key="brown" value="brown">Brown</SelectItem>
                  <SelectItem key="black" value="black">Black</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createClass.isPending}>
              {createClass.isPending ? "Creating..." : "Create Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ClassesContent() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<number | null>(null)

  const { data: classes, isLoading, error } = useClasses()
  const { data: students, isLoading: studentsLoading } = useStudents()
  const bookClass = useBookClass()
  const unbookClass = useUnbookClass()
  const deleteClass = useDeleteClass()

  const isStaff = user?.role === "instructor"
  const canBook = user?.role === "student" || user?.role === "parent"

  // Debug: Log classes data to see if there are duplicates
  console.log('Classes data:', classes)

  // Remove duplicates based on class ID to prevent React key conflicts
  const uniqueClasses = classes ? classes.filter((cls, index, self) =>
    index === self.findIndex(c => c.id === cls.id)
  ) : []

  console.log('Unique classes:', uniqueClasses)

  // Auto-set student ID for students
  useEffect(() => {
    if (user?.role === "student" && students) {
      const studentRecord = students.find(student => student.userId === user.id)
      if (studentRecord) {
        setSelectedStudent(studentRecord.id)
      }
    }
  }, [user, students])

  const handleBookClass = async (classId: number) => {
    if (!selectedStudent) return
    try {
      await bookClass.mutateAsync({ classId, studentId: selectedStudent })
      addToast("Class booked successfully!", "success")
    } catch (error: any) {
      console.error("Failed to book class:", error)
      addToast(error.message || "Failed to book class", "error")
    }
  }

  const handleUnbookClass = async (classId: number) => {
    if (!selectedStudent) return
    try {
      await unbookClass.mutateAsync({ classId, studentId: selectedStudent })
      addToast("Booking cancelled successfully!", "success")
    } catch (error: any) {
      console.error("Failed to unbook class:", error)
      addToast(error.message || "Failed to cancel booking", "error")
    }
  }

  const handleDeleteClass = async (classId: number) => {
    try {
      await deleteClass.mutateAsync(classId)
      addToast("Class deleted successfully!", "success")
    } catch (error: any) {
      console.error("Failed to delete class:", error)
      addToast(error.message || "Failed to delete class", "error")
    }
  }

  const getAvailableStudents = () => {
    if (!students) return []
    if (user?.role === "student") {
      return students.filter(student => student.userId === user.id)
    }
    if (user?.role === "parent") {
      return students.filter(student => student.parentId === user.id)
    }
    return []
  }

  const formatTime = (time: string) => {
    return time
  }

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Classes</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={`class-skeleton-${i}`} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Classes</h1>
          <p className="text-red-500">Failed to load classes. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Classes</h1>
        {isStaff && <AddClassDialog />}
      </div>

      {canBook && students && user?.role !== "student" && (
        <div className="mb-6">
          <Label htmlFor="student-select" className="text-sm font-medium">
            Select Student
          </Label>
          <Select value={selectedStudent?.toString() || ""} onValueChange={(value) => setSelectedStudent(parseInt(value))}>
            <SelectTrigger data-testid="student-select-trigger" className="w-full max-w-xs">
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableStudents().map((student) => (
                <SelectItem key={student.id} value={student.id.toString()}>
                  Student #{student.id} ({student.beltLevel} belt)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {uniqueClasses.map((cls, index) => (
          <Card key={`class-${cls.id}-${index}`} className="hover:shadow-lg transition-shadow" data-testid="class-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg" data-testid="class-name">{cls.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {cls.description || "No description available"}
                  </CardDescription>
                </div>
                <Badge variant={cls.isActive ? "default" : "secondary"}>
                  {cls.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground" data-testid="class-schedule">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDay(cls.dayOfWeek)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground" data-testid="class-time">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground" data-testid="class-enrollment">
                  <Users className="w-4 h-4 mr-2" />
                  {cls.currentEnrollment}/{cls.maxCapacity} enrolled
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" data-testid="class-belt-level">{cls.beltLevelRequired} belt required</Badge>
                </div>

                {(canBook && selectedStudent) || (user?.role === "student" && students) ? (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleBookClass(cls.id)}
                      disabled={bookClass.isPending || cls.currentEnrollment >= cls.maxCapacity}
                      className="flex-1"
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Book
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnbookClass(cls.id)}
                      disabled={unbookClass.isPending}
                      className="flex-1"
                    >
                      <BookX className="w-4 h-4 mr-1" />
                      Unbook
                    </Button>
                  </div>
                ) : null}

                {isStaff && (
                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteConfirmDialog(cls.id)}
                      disabled={deleteClass.isPending}
                      className="w-full"
                    >
                      {deleteClass.isPending ? "Deleting..." : "Delete Class"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {uniqueClasses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No classes available.</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog !== null} onOpenChange={() => setDeleteConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmDialog && handleDeleteClass(deleteConfirmDialog)}
              disabled={deleteClass.isPending}
            >
              {deleteClass.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ClassesPage() {
  return (
    <ProtectedRoute>
      <ClassesContent />
    </ProtectedRoute>
  );
} 