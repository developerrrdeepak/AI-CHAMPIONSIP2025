
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Clock, Users, BookOpen } from 'lucide-react';
import { useCourses } from '@/hooks/use-courses';
import Link from 'next/link';

export default function CoursesPage() {
  const { courses, isLoading } = useCourses();

  if (isLoading) {
    return (
      <div className="space-y-6 py-6">
        <PageHeader title="Learning Courses" description="Upskill with employer-provided training" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <PageHeader
        title="Learning Courses"
        description="Upskill with employer-provided training courses"
      />

      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Courses Available</h3>
            <p className="text-muted-foreground">
              Check back later for new learning opportunities from employers
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary">{course.level || 'Intermediate'}</Badge>
                  <Badge variant="outline">{course.category || 'Technical'}</Badge>
                </div>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description || 'Learn new skills to advance your career'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration || '4 weeks'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{course.enrollments || 0} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.lessons || 12} lessons</span>
                  </div>
                  {course.instructor && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>By {course.instructor}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href={`/courses/${course.id}`}>
                    Enroll Now
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
