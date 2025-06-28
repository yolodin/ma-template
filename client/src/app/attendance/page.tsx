"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/toast-provider"
import { ProtectedRoute } from '@/components/protected-route'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Camera, QrCode, Users, Calendar, LogIn, LogOut, UserCheck } from "lucide-react"

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

const useClasses = () => {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<Class[]> => {
      const response = await fetch("/api/classes", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to fetch classes")
      }
      return response.json()
    },
  })
}

const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<Student[]> => {
      const response = await fetch("/api/students", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }
      return response.json()
    },
  })
}

const useQRCheckIn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ qrCode, classId }: { qrCode: string; classId: number }) => {
      const response = await fetch("/api/attendance/qr-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ qrCode, classId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process QR check-in")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}

const useManualCheckIn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ studentId, classId, notes }: { studentId: number; classId: number; notes?: string }) => {
      const response = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          studentId,
          classId,
          notes,
          checkInMethod: "manual"
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process manual check-in")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}

function QRScanner({ onScan, isScanning, mode }: { onScan: (qrCode: string) => void; isScanning: boolean; mode: 'checkin' | 'checkout' }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isScanning && containerRef.current && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      )

      scannerRef.current.render((decodedText) => {
        onScan(decodedText)
      }, (error) => {
        // Ignore errors during scanning
      })
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [isScanning, onScan])

  if (!isScanning) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>
            Click "Start Scanning" to begin {mode === 'checkin' ? 'check-in' : 'check-out'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Scanner ready for {mode === 'checkin' ? 'check-in' : 'check-out'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Point camera at student QR code for {mode === 'checkin' ? 'check-in' : 'check-out'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div id="qr-reader" ref={containerRef} className="w-full"></div>
      </CardContent>
    </Card>
  )
}

function ManualCheckIn({ selectedClass, classes }: { selectedClass: number | null; classes: Class[] | undefined }) {
  const { addToast } = useToast()
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [notes, setNotes] = useState("")

  const { data: students, isLoading: studentsLoading } = useStudents()
  const manualCheckIn = useManualCheckIn()

  const handleManualCheckIn = async () => {
    if (!selectedClass || !selectedStudent) {
      addToast("Please select both class and student", "error")
      return
    }

    try {
      await manualCheckIn.mutateAsync({
        studentId: selectedStudent,
        classId: selectedClass,
        notes: notes.trim() || undefined
      })
      addToast("Manual check-in successful!", "success")
      setSelectedStudent(null)
      setNotes("")
    } catch (error: any) {
      console.error("Manual check-in failed:", error)
      addToast(error.message || "Manual check-in failed", "error")
    }
  }

  const selectedClassData = classes?.find(cls => cls.id === selectedClass)
  const selectedStudentData = students?.find(student => student.id === selectedStudent)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Manual Check-In
        </CardTitle>
        <CardDescription>
          For students who forgot their QR code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="student-select" className="text-sm font-medium">
            Select Student
          </Label>
          <Select
            value={selectedStudent?.toString() || ""}
            onValueChange={(value) => setSelectedStudent(parseInt(value))}
            disabled={!selectedClass}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectedClass ? "Choose a student" : "Select a class first"} />
            </SelectTrigger>
            <SelectContent>
              {students?.map((student) => (
                <SelectItem key={student.id} value={student.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">Student #{student.id}</span>
                    <span className="text-sm text-muted-foreground">
                      {student.beltLevel} belt
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm font-medium">
            Notes (Optional)
          </Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Forgot QR code, parent called ahead..."
            className="w-full p-2 border rounded-md text-sm"
            rows={2}
          />
        </div>

        {selectedStudentData && selectedClassData && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Check-in Summary:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Student:</strong> Student #{selectedStudentData.id} ({selectedStudentData.beltLevel} belt)</p>
              <p><strong>Class:</strong> {selectedClassData.name}</p>
              <p><strong>Time:</strong> {selectedClassData.dayOfWeek} {selectedClassData.startTime}-{selectedClassData.endTime}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleManualCheckIn}
          disabled={!selectedClass || !selectedStudent || manualCheckIn.isPending}
          className="w-full"
        >
          {manualCheckIn.isPending ? "Processing..." : "Manual Check-In"}
        </Button>
      </CardContent>
    </Card>
  )
}

function AttendanceContent() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [mode, setMode] = useState<'checkin' | 'checkout'>('checkin')

  const { data: classes, isLoading, error } = useClasses()
  const qrCheckIn = useQRCheckIn()

  const isStaff = user?.role === "instructor"

  const handleQRScan = async (qrCode: string) => {
    if (!selectedClass) {
      addToast("Please select a class first", "error")
      return
    }

    if (lastScannedCode === qrCode) {
      // Prevent duplicate scans
      return
    }

    setLastScannedCode(qrCode)
    setIsScanning(false)

    try {
      await qrCheckIn.mutateAsync({ qrCode, classId: selectedClass })
      const action = mode === 'checkin' ? 'check-in' : 'check-out'
      addToast(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`, "success")
    } catch (error: any) {
      console.error("QR scan failed:", error)
      addToast(error.message || "Scan failed", "error")
    }
  }

  const handleStartScanning = () => {
    if (!selectedClass) {
      addToast("Please select a class first", "error")
      return
    }
    setIsScanning(true)
    setLastScannedCode(null)
  }

  const handleStopScanning = () => {
    setIsScanning(false)
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
          <h1 className="text-3xl font-bold">Attendance Tracking</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Attendance Tracking</h1>
          <p className="text-red-500">Failed to load classes. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Attendance Tracking</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Class
            </CardTitle>
            <CardDescription>
              Choose the class for attendance tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="class-select" className="text-sm font-medium">
                Class
              </Label>
              <Select
                value={selectedClass?.toString() || ""}
                onValueChange={(value) => setSelectedClass(parseInt(value))}
              >
                <SelectTrigger data-testid="class-select-trigger" className="w-full">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{cls.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDay(cls.dayOfWeek)} • {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode Selection */}
            <div>
              <Label className="text-sm font-medium">Attendance Mode</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={mode === 'checkin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('checkin')}
                  className="flex-1"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Check-In
                </Button>
                <Button
                  variant={mode === 'checkout' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('checkout')}
                  className="flex-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Check-Out
                </Button>
              </div>
            </div>

            {selectedClass && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Class Details:</h4>
                {classes?.find(cls => cls.id === selectedClass) && (
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {classes.find(cls => cls.id === selectedClass)?.currentEnrollment}/
                        {classes.find(cls => cls.id === selectedClass)?.maxCapacity} enrolled
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {classes.find(cls => cls.id === selectedClass)?.beltLevelRequired} belt required
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Scanner */}
        <div className="space-y-4">
          <QRScanner onScan={handleQRScan} isScanning={isScanning} mode={mode} />

          <div className="flex gap-2">
            <Button
              onClick={handleStartScanning}
              disabled={!selectedClass || isScanning}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
            <Button
              onClick={handleStopScanning}
              disabled={!isScanning}
              variant="outline"
              className="flex-1"
            >
              Stop Scanning
            </Button>
          </div>

          {qrCheckIn.isPending && (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-600">Processing {mode === 'checkin' ? 'check-in' : 'check-out'}...</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Check-In Section (Instructors Only) */}
      {isStaff && (
        <div className="mt-6">
          <ManualCheckIn selectedClass={selectedClass} classes={classes} />
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Select a class from the dropdown above</li>
            <li>Choose check-in or check-out mode</li>
            <li>Click "Start Scanning" to activate the camera</li>
            <li>Point the camera at a student's QR code</li>
            <li>The system will automatically process the attendance</li>
            <li>You'll see a success or error message</li>
            {isStaff && (
              <li>For students without QR codes, use the Manual Check-In section below</li>
            )}
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> QR codes are used exclusively for attendance tracking and should be in the format: <code>DOJO:1:STUDENT:2</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <ProtectedRoute roles={['instructor']}>
      <AttendanceContent />
    </ProtectedRoute>
  )
} 