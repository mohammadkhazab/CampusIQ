from django.db.models import ProtectedError
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import APIException

from .models import Category, Course
from .serializers import CategorySerializer, CourseSerializer


class CategoryInUse(APIException):
    """409 returned when deleting a category that still has courses."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Category still has courses; move or delete them first."
    default_code = "category_in_use"


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for categories under /api/categories/. Signed-in users only."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance: Category) -> None:
        """Delete the category, turning the model's PROTECT refusal into a 409 (not a 500)."""
        try:
            instance.delete()
        except ProtectedError as exc:
            raise CategoryInUse() from exc


class CourseViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for courses under /api/courses/. Signed-in users only."""

    # select_related joins category in the same query: without it,
    # serializing category_name costs one extra query per course (N+1).
    queryset = Course.objects.select_related("category")
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
