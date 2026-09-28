from rest_framework import permissions, viewsets

from .models import Category, Course
from .serializers import CategorySerializer, CourseSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for categories under /api/categories/. Signed-in users only."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class CourseViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for courses under /api/courses/. Signed-in users only."""

    # select_related joins category in the same query: without it,
    # serializing category_name costs one extra query per course (N+1).
    queryset = Course.objects.select_related("category")
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
