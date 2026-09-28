from django.contrib import admin

from .models import Category, Course


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Django admin page for managing categories."""

    list_display = ["name"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Django admin page for managing courses; joins category to avoid N+1 in the list."""

    list_display = ["code", "title", "credits", "category"]
    list_select_related = ["category"]
