from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
from django.core.validators import MinValueValidator, MaxValueValidator

class TrustedEnroller(models.Model):
    """Model representing a trusted enroller."""
    
    parent = models.ForeignKey('users.Parent', null=True, blank=True, on_delete=models.CASCADE) 
    student = models.ForeignKey('users.StudentUser', null=True, blank=True, on_delete=models.CASCADE)  
    trust_level = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])  # Level of trust assigned from one to ten
    notes = models.TextField(null=True, blank=True)  # Optional notes about the trusted enroller
    added_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the trusted enroller was added
    added_by = models.ForeignKey('users.User', null=True, blank=True, related_name='trusted_enroller_added_by', on_delete=models.SET_NULL)  # Admin who added the trusted enroller

    class Meta:
        """Meta class for TrustedEnroller model."""
        constraints = [
            # Ensure that either (parent and child) or (student) is provided, but not both
            models.CheckConstraint(
                check=(
                    (Q(parent__isnull=False) & Q(student__isnull=True)) |  
                    (Q(student__isnull=False) & Q(parent__isnull=True))  
                ),
                name='trusted_enroller_participant_constraint'  
            ),
        ]

        indexes = [
            models.Index(fields=['parent'], name='trusted_enroller_user_index'),
            models.Index(fields=['student'], name='trusted_enroller_student_index'),
        ]
        
        verbose_name = 'Trusted Enroller'  
        verbose_name_plural = 'Trusted Enrollers'

    def clean(self):
        """Validate trusted enroller constraints."""
        # Validate that the trusted enroller is either for a parent or for a student alone
        if not ((self.parent is not None and self.student is None) or 
                (self.student is not None and self.parent is None)):
            raise ValidationError("Select either a parent or a student for the trusted enroller.")

    def __str__(self):
        """String representation of the TrustedEnroller."""
        return f"Trusted Enroller: {self.parent} (Institution: {self.institution}) - Added at: {self.added_at}"
    