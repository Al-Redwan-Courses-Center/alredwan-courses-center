import os
import re

def resolve_file(filepath, choice_dict):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by conflicts
    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> upstream/dev\n', re.DOTALL)
    
    def repl(match):
        head_text = match.group(1)
        upstream_text = match.group(2)
        
        # Look up in choice_dict or use a default strategy
        filename = os.path.basename(filepath)
        
        if filename == 'docker-compose.yml':
            return head_text + '\n' + upstream_text
        if filename == 'courses.ts' and 'pendingOrProcessingRequestCourseIds' in upstream_text:
            # this is courses.ts filtering
            return upstream_text
        if filename == 'courses.ts' and 'physicalEnrollments' in head_text:
            return head_text
        if filename == 'landing.ts':
            return 'import type { PaginatedResponse } from "@/types/config";\nimport type { LandingPageCourse, LandingPageInstructor, OnlineCourseListItem } from "@/types/entities";\n'
        if filename == 'user.ts':
            return head_text
        if filename == '[id]/page.tsx' or 'courses/page.tsx' in filepath:
            # For the public course page
            if 'import' in head_text:
                return head_text + '\n' + upstream_text.replace('import type { Metadata } from "next";\n', '')
            if 'Promise.all' in head_text:
                return head_text
            return head_text
        if filename == 'layout.tsx':
            if 'protect' in upstream_text and 'ReactNode' in head_text:
                return 'import type { ReactNode } from "react";\nimport { protect } from "@/actions/auth";\n'
            return head_text
        if filename == 'page.tsx':
            if 'getAllOnlineCourses' in head_text:
                return 'import { Suspense } from "react";\nimport { getUser, protect } from "@/actions/auth";\nimport { getAllCourses } from "@/actions/courses";\nimport { getAllOnlineCourses } from "@/actions/online-courses";\nimport PublicCourseCatalog from "@/components/courses/PublicCourseCatalog";\nimport DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";\n'
        if filename == 'CourseHeader.tsx':
            return head_text + '\n' + upstream_text
        if filename == 'PublicCourseCard.tsx':
            return upstream_text
        if filename == 'MemoriesClient.tsx' or filename == 'MemoryCard.tsx' or filename == 'Lightbox.tsx':
            return head_text
        if filename == 'StudentMyCoursesPage.tsx':
            if 'notFound' in head_text:
                return 'import { notFound } from "next/navigation";\nimport { Suspense } from "react";\nimport { CourseDetail } from "@/types/entities";\n'
            if 'childId' in head_text:
                return head_text
        if filename == 'StudentOverviewCoursesAccordion.tsx':
            return head_text
        if filename == 'CoursesSection.tsx':
            return head_text
        if filename == 'HeroSection.tsx':
            return head_text
        if filename == 'dashboardNavConfig.tsx':
            return 'import MosqueIcon from "@/components/icons/MosqueIcon";\nimport MonitorPlayIcon from "@/components/icons/MonitorPlayIcon";\nimport type { UserEntity } from "@/types/auth";\nimport type { ReactNode } from "react";\n'
        if filename == 'RatingForm.tsx' or filename == 'RatingsBreakdown.tsx' or filename == 'RatingsSection.tsx':
            # HEAD has the compact mode, online_courses, etc. We must keep HEAD.
            return head_text
        if filename == 'index.ts':
            return head_text
            
        return head_text

    new_content = pattern.sub(repl, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

def main():
    import subprocess
    result = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'], capture_output=True, text=True)
    files = [line for line in result.stdout.split('\n') if line.strip()]
    for f in files:
        print(f"Resolving {f}")
        resolve_file(f, {})
        subprocess.run(['git', 'add', f])

if __name__ == '__main__':
    main()
