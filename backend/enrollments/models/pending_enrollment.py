# from django.forms import ValidationError
# import django.utils.timezone as timezone
# from django.db import models
# import uuid

# class Status(models.TextChoices):
#     """Enumeration for pending enrollment status choices."""
#     PENDING = 'pending', 'Pending' # pending enrollment when created
#     CANCELLED = 'cancelled', 'Cancelled' # admin cancelled
#     EXPIRED = 'expired', 'Expired' # auto expired after expires_at
#     ACCEPTED = 'accepted', 'Accepted' # enrollment accepted by admin

# class PendingEnrollment(models.Model):
#     """Model representing a pending enrollment request for a course."""

#     course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='pending_enrollments')
#     parent = models.ForeignKey('parents.Parent', null=True, blank=True, on_delete=models.CASCADE, related_name='pending_enrollments')
#     student = models.ForeignKey('student_users.StudentUser', null=True, blank=True, on_delete=models.CASCADE, related_name='pending_enrollments')
#     child = models.ForeignKey('children.Child', null=True, blank=True, on_delete=models.CASCADE, related_name='pending_enrollments')
    
#     status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
#     price = models.DecimalField(max_digits=10, decimal_places=2) # price auto from course 
#     created_at = models.DateTimeField(auto_now_add=True)
#     expires_at = models.DateTimeField(null=True, blank=True) # auto after like 7 days
#     processed_by = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='processed_pending_enrollments')
#     processed_at = models.DateTimeField(null=True, blank=True) # auto when accepted or cancelled

#     class Meta:
#         """Meta class for PendingEnrollment model."""
#         constraints = [
#             # Ensure either parent and child are set together or student is set alone
#             models.CheckConstraint(
#                 check=(
#                     models.Q(parent__isnull=False, child__isnull=False, student__isnull=True) |
#                     models.Q(student__isnull=False, parent__isnull=True, child__isnull=True)
#                 ),
#                 name='parent_child_or_student'
#             ),
#             # check for price non negative
#             models.CheckConstraint(
#                 check=models.Q(price__gte=0),
#                 name='non_negative_price'
#             ),            
#             # Ensure processed_at and processed_by are set when status is ACCEPTED or CANCELLED other wise i don't care
#             models.CheckConstraint(
#                 check=(
#                     models.Q(status=Status.ACCEPTED, processed_at__isnull=False, processed_by__isnull=False) |
#                     models.Q(status=Status.CANCELLED, processed_at__isnull=False, processed_by__isnull=False) |
#                     models.Q(status=Status.PENDING, processed_at__isnull=True, processed_by__isnull=True) |
#                     models.Q(status=Status.EXPIRED, processed_at__isnull=True, processed_by__isnull=True)
#                 ),
#                 name='processed_fields_consistency'
#             ),
#         ]
#         indexes = [
#             models.Index(fields=['course'], name='pending_course_index'),
#             models.Index(fields=['parent'], name='pending_parent_index'),
#             models.Index(fields=['student'], name='pending_student_index'),
#             models.Index(fields=['status'], name='pending_status_index'),
#             models.Index(fields=['expires_at'], name='pending_expires_index'),
#         ]
#         verbose_name = 'Pending Enrollment'
#         verbose_name_plural = 'Pending Enrollments'

#     def clean(self):
#         """Custom validation logic for PendingEnrollment model."""
#         # Ensure either parent and child are set together or student is set alone
#         if (self.parent is not None and self.child is not None and self.student is None) or \
#            (self.student is not None and self.parent is None and self.child is None):
#             pass  # Valid cases
#         else:
#             raise ValidationError("Select either a parent and child together or a student alone.")
#         # Ensure price is non-negative
#         if self.price < 0:
#             raise ValidationError("Price must be a non-negative value.")
#         # Ensure processed_at and processed_by are set when status is ACCEPTED or CANCELLED
#         if self.status in [Status.ACCEPTED, Status.CANCELLED]:
#             if self.processed_at is None or self.processed_by is None:
#                 raise ValidationError("processed_at and processed_by must be set when status is ACCEPTED or CANCELLED.")

#     def update_status(self, new_status, processed_by=None):
#         """Update the pending enrollment status with validation."""
#         allowed_transitions = {
#             Status.PENDING: [Status.ACCEPTED, Status.CANCELLED, Status.EXPIRED],
#             Status.ACCEPTED: [Status.PENDING],
#             Status.CANCELLED: [Status.PENDING],
#             Status.EXPIRED: [], # No transitions allowed from expired or accepted or cancelled
#         }

#         if new_status not in Status.values:
#             raise ValidationError(f"Invalid status: {new_status}")
#         if new_status not in allowed_transitions[self.status]:
#             raise ValidationError(f"Cannot transition from {self.status} to {new_status}")

#         self.status = new_status
#         if new_status in [Status.ACCEPTED, Status.CANCELLED]:
#             self.processed_at = timezone.now()
#             self.processed_by = processed_by
#         self.save()

#     def expire(self):
#         """Mark the pending enrollment as expired if past expires_at"""
#         if self.status != Status.PENDING:
#             raise ValidationError("Only pending enrollments can be expired.")
#         if self.expires_at and self.expires_at <= timezone.now():
#             self.status = Status.EXPIRED
#             self.processed_at = timezone.now()
#             self.save()

#     def save(self, *args, **kwargs):
#         # add price from course if not set
#         if not self.price and self.course:
#             self.price = self.course.price
#         self.clean()  # Validate before saving
#         super().save(*args, **kwargs)

#     def __str__(self):
#         """String representation of the PendingEnrollment"""
#         participant = self.student if self.student else self.child or 'Unknown'
#         return f"Pending Enrollment for {participant} in {self.course}"