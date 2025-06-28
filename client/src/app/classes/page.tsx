"use client"

import { useState } from "react"
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
import { Plus, Calendar, Clock, Users, Trash2, CheckCircle, Minus } from "lucide-react"
import { ProtectedRoute } from '@/components/protected-route'
import { apiClient } from "@/config/api"
import { Skeleton } from "@/components/ui/skeleton"

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
  const { user, loading } = useAuth()
  return useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<Class[]> => {
      return apiClient.get<Class[]>('/api/classes')
    },
    enabled: !loading && !!user,
  })
}

const useStudents = () => {
  const { user, loading } = useAuth()
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<Student[]> => {
      return apiClient.get<Student[]>('/api/students')
    },
    enabled: !loading && !!user,
  })
}

const useDojos = () => {
  const { user, loading } = useAuth()
  return useQuery({
    queryKey: ["dojos"],
    queryFn: async (): Promise<Dojo[]> => {
      return apiClient.get<Dojo[]>('/api/dojos')
    },
    enabled: !loading && !!user,
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
  const { user, loading } = useAuth()
  const { addToast } = useToast()
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ classId: number; className: string } | null>(null)

  const { data: classes, isLoading: classesLoading, error } = useClasses()
  const { data: students } = useStudents()
  const deleteClass = useDeleteClass()
  const bookClass = useBookClass()
  const unbookClass = useUnbookClass()

  const handleBookClass = async (classId: number) => {
    // Only allow instructors and parents to book classes
    if (user?.role === 'student') {
      addToast("Students cannot book classes. Please ask your parent or instructor for help.", "error")
      return
    }

    const selectedStudentId = getSelectedStudentId()
    if (!selectedStudentId) {
      addToast("Please select a student first", "error")
      return
    }

    try {
      await bookClass.mutateAsync({ classId, studentId: selectedStudentId })
      addToast("Successfully booked class!", "success")
    } catch (error: any) {
      console.error("Failed to book class:", error)
      addToast(error.message || "Failed to book class", "error")
    }
  }

  const handleUnbookClass = async (classId: number) => {
    // Only allow instructors and parents to unbook classes
    if (user?.role === 'student') {
      addToast("Students cannot unbook classes. Please ask your parent or instructor for help.", "error")
      return
    }

    const selectedStudentId = getSelectedStudentId()
    if (!selectedStudentId) {
      addToast("Please select a student first", "error")
      return
    }

    try {
      await unbookClass.mutateAsync({ classId, studentId: selectedStudentId })
      addToast("Successfully unbooked class!", "success")
    } catch (error: any) {
      console.error("Failed to unbook class:", error)
      addToast(error.message || "Failed to unbook class", "error")
    }
  }

  const handleDeleteClass = async (classId: number) => {
    try {
      await deleteClass.mutateAsync(classId)
      addToast("Class deleted successfully!", "success")
      setDeleteConfirmDialog(null)
    } catch (error: any) {
      console.error("Failed to delete class:", error)
      addToast(error.message || "Failed to delete class", "error")
    }
  }

  const getAvailableStudents = () => {
    if (!students) return []
    if (user?.role === "parent") {
      return students.filter(student => student.parentId === user.id)
    }
    return students
  }

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1)
  }

  const getSelectedStudentId = () => {
    if (user?.role === "student") {
      // For students, find their own student record
      const studentRecord = students?.find(student => student.userId === user.id)
      return studentRecord?.id
    }

    // For instructors and parents, we'd need to implement student selection
    // For now, just return the first available student
    const availableStudents = getAvailableStudents()
    return availableStudents[0]?.id
  }

  if (loading || classesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Classes</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Please log in to view classes</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">
            {user.role === 'student'
              ? "View the classes you're enrolled in"
              : user.role === 'parent'
                ? "Manage your children's class enrollment"
                : "Manage all dojo classes"
            }
          </p>
        </div>
        {user.role === "instructor" && <AddClassDialog />}
      </div>

      {!classes || classes.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {user.role === 'student'
              ? "No Classes Enrolled"
              : "No Classes Available"
            }
          </h3>
          <p className="text-gray-500">
            {user.role === 'student'
              ? "You are not currently enrolled in any classes. Ask your parent or instructor about enrollment."
              : user.role === 'parent'
                ? "No classes are available for enrollment at this time."
                : "Create your first class to get started."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{cls.name}</CardTitle>
                    {cls.description && (
                      <CardDescription className="mt-1">
                        {cls.description}
                      </CardDescription>
                    )}
                  </div>
                  {user.role === "instructor" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirmDialog({ classId: cls.id, className: cls.name })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{formatDay(cls.dayOfWeek)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {cls.currentEnrollment}/{cls.maxCapacity} enrolled
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {cls.beltLevelRequired} belt+
                    </Badge>
                  </div>

                  {/* Only show booking controls for instructors and parents */}
                  {user.role !== 'student' && (
                    <div className="pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleBookClass(cls.id)}
                          disabled={bookClass.isPending}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Book
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleUnbookClass(cls.id)}
                          disabled={unbookClass.isPending}
                        >
                          <Minus className="w-4 h-4 mr-1" />
                          Unbook
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show enrollment status for students */}
                  {user.role === 'student' && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-center">
                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enrolled
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteConfirmDialog}
        onOpenChange={(open) => !open && setDeleteConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirmDialog?.className}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmDialog && handleDeleteClass(deleteConfirmDialog.classId)}
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