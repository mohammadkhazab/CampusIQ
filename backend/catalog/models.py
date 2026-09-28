from django.db import models


class Category(models.Model):
    """A subject area (e.g. "Computer Science") that groups courses in the catalog."""

    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name


class Course(models.Model):
    """A course offered in the catalog, identified by its unique code (e.g. "CS101").

    Each course belongs to exactly one category; a category with courses cannot be
    deleted (PROTECT), so removing a category never silently wipes courses.
    """

    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    credits = models.PositiveSmallIntegerField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="courses")

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} {self.title}"
