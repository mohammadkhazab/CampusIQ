from rest_framework import serializers

from .models import Category, Course


class CategorySerializer(serializers.ModelSerializer):
    """Converts Category objects to/from JSON for the categories API."""

    class Meta:
        model = Category
        fields = ["id", "name"]


class CourseSerializer(serializers.ModelSerializer):
    """Converts Course objects to/from JSON for the courses API."""

    # Writes take a category id; reads also expose the name so clients
    # don't need a second request per course.
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Course
        fields = ["id", "code", "title", "description", "credits", "category", "category_name"]
